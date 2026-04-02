class NoopCache {
  get() {
    return null;
  }

  set() {}
}

class NoopApiTracker {
  logAPICall() {}
}

class FundamentalAnalysisService {
  constructor({
    dataSourceManager = null,
    cache = new NoopCache(),
    apiTracker = new NoopApiTracker(),
    fetchImpl = fetch,
    env = process.env,
    logger = console,
  } = {}) {
    this.dataSourceManager = dataSourceManager;
    this.cache = cache;
    this.apiTracker = apiTracker;
    this.fetchImpl = fetchImpl;
    this.env = env;
    this.logger = logger;
    this.key = env.ALPHA_VANTAGE_API_KEY;
    this.weights = {
      valuation: 25,
      growth: 20,
      profitability: 25,
      leverage: 15,
      cashflow: 15,
    };
  }

  async analyze(symbol) {
    const normalizedSymbol = String(symbol || "").toUpperCase();
    const cacheKey = `fa_analysis_${normalizedSymbol}`;
    const cached = this.cache.get(cacheKey);

    if (cached) return { ...cached, source: "cache" };

    try {
      if (this.dataSourceManager?.fetchFundamentalData) {
        try {
          const fundamentalData = await this.dataSourceManager.fetchFundamentalData(normalizedSymbol);
          if (fundamentalData?.overview) {
            const metrics = this.buildMetricsFromMultiSource(fundamentalData.overview);
            const breakdown = this.scoreCategories(metrics);
            const score = this.weightedScore(breakdown, this.weights);
            const recommendation = this.recommend(score);
            const result = {
              score,
              recommendation,
              breakdown,
              metrics,
              notes: `Computed from ${fundamentalData.source} fundamentals.`,
              source: fundamentalData.source,
              timestamp: new Date().toISOString(),
            };

            this.cache.set(cacheKey, result);
            return result;
          }
        } catch (error) {
          this.logger.warn("Multi-source fetch failed, falling back to Alpha Vantage:", error.message);
        }
      }

      const [overview, income, balance, cash] = await Promise.all([
        this.fetchOverview(normalizedSymbol),
        this.fetchIncomeStatement(normalizedSymbol),
        this.fetchBalanceSheet(normalizedSymbol),
        this.fetchCashFlow(normalizedSymbol),
      ]);

      const metrics = this.buildMetrics(overview, income, balance, cash);
      const breakdown = this.scoreCategories(metrics);
      const score = this.weightedScore(breakdown, this.weights);
      const recommendation = this.recommend(score);
      const result = {
        score,
        recommendation,
        breakdown,
        metrics,
        notes: "Computed from Alpha Vantage fundamentals (OVERVIEW/INCOME/BALANCE/CASH).",
        source: "Alpha Vantage",
        timestamp: new Date().toISOString(),
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.warn("Fundamentals pipeline failed, using neutral fallback:", error.message);
      return {
        score: 50,
        recommendation: "HOLD",
        breakdown: {
          valuation: 50,
          growth: 50,
          profitability: 50,
          leverage: 50,
          cashflow: 50,
        },
        metrics: {},
        notes: `Fallback fundamentals for ${normalizedSymbol}: ${error.message}`,
        source: "fallback",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async fetchOverview(symbol) {
    return this.fetchAlphaVantageJson("OVERVIEW", symbol);
  }

  async fetchIncomeStatement(symbol) {
    const data = await this.fetchAlphaVantageJson("INCOME_STATEMENT", symbol);
    return data?.annualReports || [];
  }

  async fetchBalanceSheet(symbol) {
    const data = await this.fetchAlphaVantageJson("BALANCE_SHEET", symbol);
    return data?.annualReports || [];
  }

  async fetchCashFlow(symbol) {
    const data = await this.fetchAlphaVantageJson("CASH_FLOW", symbol);
    return data?.annualReports || [];
  }

  async fetchAlphaVantageJson(functionName, symbol) {
    if (!this.key) throw new Error("Missing ALPHA_VANTAGE_API_KEY");

    const startTime = Date.now();
    try {
      const url = `https://www.alphavantage.co/query?function=${functionName}&symbol=${encodeURIComponent(
        symbol
      )}&apikey=${this.key}`;

      this.apiTracker.logAPICall("Alpha Vantage", functionName, symbol, null, true, 0);
      const response = await this.fetchImpl(url);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`Alpha Vantage HTTP ${response.status}`);
      }

      const data = await response.json();
      this.ensureOk(data);
      this.apiTracker.logAPICall("Alpha Vantage", functionName, symbol, null, true, responseTime);
      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.apiTracker.logAPICall("Alpha Vantage", functionName, symbol, null, false, responseTime);
      throw error;
    }
  }

  ensureOk(data) {
    if (!data) throw new Error("Empty response");
    if (data.Note) throw new Error(`API rate-limited: ${data.Note}`);
    if (data["Error Message"]) throw new Error(`API error: ${data["Error Message"]}`);
  }

  buildMetrics(overview, incomeAnnual, balanceAnnual, cashAnnual) {
    const num = (value) =>
      value === undefined || value === null || value === "" ? null : Number(value);
    const safeDiv = (a, b) => (a === null || b === null || b === 0 ? null : a / b);

    const pe = num(overview?.PERatio);
    const peg = num(overview?.PEGRatio);
    const pb = num(overview?.PriceToBookRatio);
    const roe = num(overview?.ReturnOnEquityTTM);
    const pm = num(overview?.ProfitMargin);
    const opm = num(overview?.OperatingMarginTTM);
    const eps = num(overview?.EPS);
    const dy = num(overview?.DividendYield);

    const parseIncome = incomeAnnual.map((report) => ({
      totalRevenue: num(report.totalRevenue),
      operatingIncome: num(report.operatingIncome),
      netIncome: num(report.netIncome),
      interestExpense: num(report.interestExpense),
      eps: num(report.eps) ?? null,
    }));

    const parseBalance = balanceAnnual.map((report) => ({
      totalLiabilities: num(report.totalLiabilities),
      totalShareholderEquity: num(report.totalShareholderEquity),
      totalCurrentAssets: num(report.totalCurrentAssets),
      totalCurrentLiabilities: num(report.totalCurrentLiabilities),
    }));

    const parseCash = cashAnnual.map((report) => ({
      operatingCashflow: num(report.operatingCashflow),
      capitalExpenditures: num(report.capitalExpenditures),
    }));

    const lastIncome = parseIncome[0] || {};
    const lastBalance = parseBalance[0] || {};
    const lastCash = parseCash[0] || {};

    const revSeries = parseIncome
      .slice(0, 4)
      .map((report) => report.totalRevenue)
      .filter((value) => typeof value === "number" && !Number.isNaN(value));

    let revenueCAGR = null;
    if (revSeries.length >= 2) {
      const start = revSeries.at(-1);
      const end = revSeries[0];
      const years = revSeries.length - 1;
      if (start && end && years > 0) {
        revenueCAGR = (Math.pow(end / start, 1 / years) - 1) * 100;
      }
    }

    const profitMargin = pm ?? ((safeDiv(lastIncome.netIncome, lastIncome.totalRevenue) ?? null) * 100);
    const operatingMargin =
      opm ?? ((safeDiv(lastIncome.operatingIncome, lastIncome.totalRevenue) ?? null) * 100);
    const returnOnEquity =
      roe ?? ((safeDiv(lastIncome.netIncome, lastBalance.totalShareholderEquity) ?? null) * 100);

    const debtToEquity = safeDiv(lastBalance.totalLiabilities, lastBalance.totalShareholderEquity);
    const currentRatio = safeDiv(lastBalance.totalCurrentAssets, lastBalance.totalCurrentLiabilities);
    const fcfLast =
      lastCash.operatingCashflow === null || lastCash.operatingCashflow === undefined
        ? null
        : lastCash.operatingCashflow - (lastCash.capitalExpenditures ?? null);
    const fcfMargin =
      fcfLast !== null && lastIncome.totalRevenue ? (fcfLast / lastIncome.totalRevenue) * 100 : null;
    const interestCoverage =
      lastIncome.interestExpense !== null && lastIncome.interestExpense !== 0
        ? safeDiv(Math.abs(lastIncome.operatingIncome ?? 0), Math.abs(lastIncome.interestExpense))
        : null;

    return {
      pe,
      peg,
      pb,
      revenueCAGR,
      returnOnEquity,
      profitMargin,
      operatingMargin,
      debtToEquity,
      currentRatio,
      fcfMargin,
      interestCoverage,
      eps,
      dividendYield: dy,
    };
  }

  buildMetricsFromMultiSource(overview) {
    const num = (value) =>
      value === undefined || value === null || value === "" ? null : Number(value);

    return {
      pe: num(overview?.PERatio),
      peg: num(overview?.PEGRatio),
      pb: num(overview?.PriceToBookRatio),
      revenueCAGR: null,
      returnOnEquity: num(overview?.ReturnOnEquityTTM),
      profitMargin: num(overview?.ProfitMargin),
      operatingMargin: num(overview?.OperatingMarginTTM),
      debtToEquity: null,
      currentRatio: null,
      fcfMargin: null,
      interestCoverage: null,
      eps: num(overview?.EPS),
      dividendYield: num(overview?.DividendYield),
    };
  }

  scoreCategories(metrics) {
    const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
    const nanOr = (value, fallback) => (value === null || Number.isNaN(value) ? fallback : value);

    const higherBetter = (value, lowBad, highGood) => {
      if (value === null) return 50;
      const t = clamp((value - lowBad) / (highGood - lowBad), 0, 1);
      return Math.round(10 + t * 80);
    };

    const lowerBetter = (value, lowGood, highBad) => {
      if (value === null) return 50;
      const t = clamp((highBad - value) / (highBad - lowGood), 0, 1);
      return Math.round(10 + t * 80);
    };

    const sPEG = lowerBetter(metrics.peg, 1.0, 2.5);
    const sPE = lowerBetter(metrics.pe, 15, 40);
    const sPB = lowerBetter(metrics.pb, 3, 10);
    const valuation = Math.round(nanOr(sPEG * 0.5 + sPE * 0.3 + sPB * 0.2, 50));

    const growth = Math.round(nanOr(higherBetter(metrics.revenueCAGR, 0, 15), 50));

    const sROE = higherBetter(metrics.returnOnEquity, 5, 20);
    const sPM = higherBetter(metrics.profitMargin, 0, 20);
    const sOPM = higherBetter(metrics.operatingMargin, 5, 20);
    const profitability = Math.round(nanOr((sROE + sPM + sOPM) / 3, 50));

    const sD2E = lowerBetter(metrics.debtToEquity, 0.5, 2.5);
    const sCR = higherBetter(metrics.currentRatio, 1.0, 2.0);
    const leverage = Math.round(nanOr(sD2E * 0.7 + sCR * 0.3, 50));

    const sFCF = higherBetter(metrics.fcfMargin, 0, 10);
    const sICov = higherBetter(metrics.interestCoverage, 2, 10);
    const cashflow = Math.round(nanOr(sFCF * 0.7 + sICov * 0.3, 50));

    return { valuation, growth, profitability, leverage, cashflow };
  }

  weightedScore(breakdown, weights) {
    const totalWeight =
      weights.valuation +
      weights.growth +
      weights.profitability +
      weights.leverage +
      weights.cashflow;

    const sum =
      breakdown.valuation * weights.valuation +
      breakdown.growth * weights.growth +
      breakdown.profitability * weights.profitability +
      breakdown.leverage * weights.leverage +
      breakdown.cashflow * weights.cashflow;

    return Math.round(Math.max(0, Math.min(100, sum / totalWeight)));
  }

  recommend(score) {
    if (score >= 70) return "BUY";
    if (score >= 50) return "HOLD";
    return "SELL";
  }
}

function createFundamentalAnalysisService(options) {
  return new FundamentalAnalysisService(options);
}

module.exports = {
  FundamentalAnalysisService,
  createFundamentalAnalysisService,
};
