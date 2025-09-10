// services/fundamentalAnalysisService.js
const axios = require('axios');
const cacheService = require('./cacheService');

class FundamentalAnalysisService {
  constructor() {
    this.key = process.env.ALPHA_VANTAGE_API_KEY;
    if (!this.key) {
      console.warn('⚠️ ALPHA_VANTAGE_API_KEY is not set. Fundamentals will fall back.');
    }

    // category weights → overall score
    this.weights = {
      valuation: 25,
      growth: 20,
      profitability: 25,
      leverage: 15,
      cashflow: 15,
    };
  }

  // ---- Public entrypoint ----------------------------------------------------
  async analyze(symbol) {
    symbol = (symbol || '').toUpperCase();

    // cache full analysis to reduce API calls
    const cacheKey = `fa_analysis_${symbol}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return { ...cached, source: 'cache' };

    try {
      const [overview, income, balance, cash] = await Promise.all([
        this.fetchOverview(symbol),
        this.fetchIncomeStatement(symbol),
        this.fetchBalanceSheet(symbol),
        this.fetchCashFlow(symbol),
      ]);

      const metrics = this.buildMetrics(overview, income, balance, cash);
      const breakdown = this.scoreCategories(metrics);
      const score = this.weightedScore(breakdown, this.weights);
      const recommendation = this.recommend(score);

      const result = {
        score,
        recommendation, // BUY/HOLD/SELL
        breakdown,      // per-category scores
        metrics,        // raw computed metrics we based the scores on
        notes: 'Computed from Alpha Vantage fundamentals (OVERVIEW/INCOME/BALANCE/CASH).',
        source: 'Alpha Vantage',
        timestamp: new Date().toISOString(),
      };

      cacheService.set(cacheKey, result);
      return result;

    } catch (err) {
      console.warn('⚠️ Fundamentals pipeline failed, using neutral fallback:', err.message);
      return {
        score: 50,
        recommendation: 'HOLD',
        breakdown: {
          valuation: 50, growth: 50, profitability: 50, leverage: 50, cashflow: 50
        },
        metrics: {},
        notes: `Fallback fundamentals for ${symbol}: ${err.message}`,
        source: 'fallback',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ---- Fetchers -------------------------------------------------------------
  async fetchOverview(symbol) {
    if (!this.key) throw new Error('Missing ALPHA_VANTAGE_API_KEY');
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(symbol)}&apikey=${this.key}`;
    const data = (await axios.get(url, { timeout: 10000 })).data;
    this.ensureOk(data);
    return data; // strings
  }

  async fetchIncomeStatement(symbol) {
    if (!this.key) throw new Error('Missing ALPHA_VANTAGE_API_KEY');
    const url = `https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${encodeURIComponent(symbol)}&apikey=${this.key}`;
    const data = (await axios.get(url, { timeout: 10000 })).data;
    this.ensureOk(data);
    return data?.annualReports || [];
  }

  async fetchBalanceSheet(symbol) {
    if (!this.key) throw new Error('Missing ALPHA_VANTAGE_API_KEY');
    const url = `https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=${encodeURIComponent(symbol)}&apikey=${this.key}`;
    const data = (await axios.get(url, { timeout: 10000 })).data;
    this.ensureOk(data);
    return data?.annualReports || [];
  }

  async fetchCashFlow(symbol) {
    if (!this.key) throw new Error('Missing ALPHA_VANTAGE_API_KEY');
    const url = `https://www.alphavantage.co/query?function=CASH_FLOW&symbol=${encodeURIComponent(symbol)}&apikey=${this.key}`;
    const data = (await axios.get(url, { timeout: 10000 })).data;
    this.ensureOk(data);
    return data?.annualReports || [];
  }

  ensureOk(data) {
    if (!data) throw new Error('Empty response');
    if (data.Note) throw new Error(`API rate-limited: ${data.Note}`);
    if (data['Error Message']) throw new Error(`API error: ${data['Error Message']}`);
  }

  // ---- Metric building ------------------------------------------------------
  buildMetrics(overview, incomeAnnual, balanceAnnual, cashAnnual) {
    // parse helpers
    const num = (x) => (x === undefined || x === null || x === '' ? null : Number(x));
    const safeDiv = (a, b) => (a === null || b === null || b === 0 ? null : a / b);

    // ---- pull overview metrics (TTM-ish)
    const pe   = num(overview?.PERatio);
    const peg  = num(overview?.PEGRatio);
    const pb   = num(overview?.PriceToBookRatio);
    const roe  = num(overview?.ReturnOnEquityTTM);     // %
    const pm   = num(overview?.ProfitMargin);          // %
    const opm  = num(overview?.OperatingMarginTTM);    // %
    const eps  = num(overview?.EPS);
    const dy   = num(overview?.DividendYield);         // %
    // sector/industry might exist but not used here

    // ---- income statement series (most recent first usually)
    const parseIncome = incomeAnnual.map(r => ({
      date: r.fiscalDateEnding,
      totalRevenue: num(r.totalRevenue),
      operatingIncome: num(r.operatingIncome),
      netIncome: num(r.netIncome),
      interestExpense: num(r.interestExpense),
      eps: num(r.eps) ?? null,
    }));

    // ---- balance sheet series
    const parseBalance = balanceAnnual.map(r => ({
      date: r.fiscalDateEnding,
      totalLiabilities: num(r.totalLiabilities),
      totalShareholderEquity: num(r.totalShareholderEquity),
      totalCurrentAssets: num(r.totalCurrentAssets),
      totalCurrentLiabilities: num(r.totalCurrentLiabilities),
    }));

    // ---- cash flow series
    const parseCash = cashAnnual.map(r => ({
      date: r.fiscalDateEnding,
      operatingCashflow: num(r.operatingCashflow),
      capitalExpenditures: num(r.capitalExpenditures),
    }));

    // Align to last (most recent) year
    const lastIncome  = parseIncome[0]  || {};
    const lastBalance = parseBalance[0] || {};
    const lastCash    = parseCash[0]    || {};

    // Revenue CAGR (use up to ~3-4 years if available)
    const revSeries = parseIncome
      .slice(0, 4)
      .map(r => r.totalRevenue)
      .filter(v => typeof v === 'number' && !Number.isNaN(v));

    let revenueCAGR = null;
    if (revSeries.length >= 2) {
      const start = revSeries.at(-1);
      const end   = revSeries[0];
      const years = revSeries.length - 1;
      if (start && end && years > 0) {
        revenueCAGR = Math.pow(end / start, 1 / years) - 1; // decimal
        revenueCAGR = revenueCAGR * 100; // %
      }
    }

    // ROE / Profit & Operating margins (%). Use overview first; fallback to computed.
    const profitMargin = pm ?? safeDiv(lastIncome.netIncome, lastIncome.totalRevenue) * 100 ?? null;
    const operatingMargin = opm ?? safeDiv(lastIncome.operatingIncome, lastIncome.totalRevenue) * 100 ?? null;
    const returnOnEquity = roe ?? safeDiv(lastIncome.netIncome, lastBalance.totalShareholderEquity) * 100 ?? null;

    // Leverage
    const debtToEquity = safeDiv(lastBalance.totalLiabilities, lastBalance.totalShareholderEquity);
    const currentRatio = safeDiv(lastBalance.totalCurrentAssets, lastBalance.totalCurrentLiabilities);

    // Cash flow
    const fcfLast = (lastCash.operatingCashflow ?? null) - (lastCash.capitalExpenditures ?? null);
    const fcfMargin = (fcfLast !== null && lastIncome.totalRevenue) ? (fcfLast / lastIncome.totalRevenue) * 100 : null;

    const interestCoverage = (lastIncome.interestExpense !== null && lastIncome.interestExpense !== 0)
      ? safeDiv(Math.abs(lastIncome.operatingIncome ?? 0), Math.abs(lastIncome.interestExpense))
      : null; // null => unknown/NA

    return {
      // valuation
      pe, peg, pb,
      // growth
      revenueCAGR,
      // profitability
      returnOnEquity, profitMargin, operatingMargin,
      // leverage
      debtToEquity, currentRatio,
      // cashflow
      fcfMargin, interestCoverage,
      // misc
      eps, dividendYield: dy,
    };
  }

  // ---- Scoring --------------------------------------------------------------
  scoreCategories(m) {
    // scaling helpers → scores 10..90 (avoid 0/100 extremes), null => 50
    const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
    const nanOr = (v, alt) => (v === null || Number.isNaN(v) ? alt : v);

    const higherBetter = (v, loBad, hiGood) => {
      if (v === null) return 50;
      const t = clamp((v - loBad) / (hiGood - loBad), 0, 1);
      return Math.round(10 + t * 80);
    };

    const lowerBetter = (v, loGood, hiBad) => {
      if (v === null) return 50;
      const t = clamp((hiBad - v) / (hiBad - loGood), 0, 1);
      return Math.round(10 + t * 80);
    };

    // Valuation: favor low PEG, then low PE, then low P/B
    const sPEG = lowerBetter(m.peg, 1.0, 2.5);
    const sPE  = lowerBetter(m.pe, 15, 40);
    const sPB  = lowerBetter(m.pb, 3, 10);
    const valuation = Math.round(nanOr((sPEG * 0.5 + sPE * 0.3 + sPB * 0.2), 50));

    // Growth: Revenue CAGR (%)
    const sRev = higherBetter(m.revenueCAGR, 0, 15);  // 0%→10pts, 15%+→90pts
    const growth = Math.round(nanOr(sRev, 50));

    // Profitability: ROE, Profit Margin, Operating Margin
    const sROE = higherBetter(m.returnOnEquity, 5, 20);
    const sPM  = higherBetter(m.profitMargin, 0, 20);
    const sOPM = higherBetter(m.operatingMargin, 5, 20);
    const profitability = Math.round(nanOr((sROE + sPM + sOPM) / 3, 50));

    // Leverage/Liquidity: Debt/Equity lower is better; Current Ratio higher better
    const sD2E = lowerBetter(m.debtToEquity, 0.5, 2.5);
    const sCR  = higherBetter(m.currentRatio, 1.0, 2.0);
    const leverage = Math.round(nanOr((sD2E * 0.7 + sCR * 0.3), 50));

    // Cash Flow: FCF margin (%), Interest Coverage (x)
    const sFCF  = higherBetter(m.fcfMargin, 0, 10);
    const sICov = higherBetter(m.interestCoverage, 2, 10); // 2x→10pts, 10x+→90pts
    const cashflow = Math.round(nanOr((sFCF * 0.7 + sICov * 0.3), 50));

    return { valuation, growth, profitability, leverage, cashflow };
  }

  weightedScore(breakdown, weights) {
    const totalW =
      weights.valuation + weights.growth + weights.profitability + weights.leverage + weights.cashflow;
    const sum =
      breakdown.valuation * weights.valuation +
      breakdown.growth * weights.growth +
      breakdown.profitability * weights.profitability +
      breakdown.leverage * weights.leverage +
      breakdown.cashflow * weights.cashflow;

    return Math.round(Math.max(0, Math.min(100, sum / totalW)));
  }

  recommend(score) {
    if (score >= 70) return 'BUY';
    if (score >= 50) return 'HOLD';
    return 'SELL';
  }
}

module.exports = new FundamentalAnalysisService();