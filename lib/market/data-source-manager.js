import cacheModule from "../cache/index.js";
import observabilityModule from "../observability/index.js";

const { createCacheService } = cacheModule;
const { createApiTracker } = observabilityModule;

const POPULAR_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc.", type: "Equity", region: "United States" },
  { symbol: "MSFT", name: "Microsoft Corporation", type: "Equity", region: "United States" },
  { symbol: "NVDA", name: "NVIDIA Corporation", type: "Equity", region: "United States" },
  { symbol: "AMZN", name: "Amazon.com, Inc.", type: "Equity", region: "United States" },
  { symbol: "GOOGL", name: "Alphabet Inc.", type: "Equity", region: "United States" },
  { symbol: "META", name: "Meta Platforms, Inc.", type: "Equity", region: "United States" },
  { symbol: "TSLA", name: "Tesla, Inc.", type: "Equity", region: "United States" },
  { symbol: "AMD", name: "Advanced Micro Devices, Inc.", type: "Equity", region: "United States" },
];

class DataSourceManager {
  constructor({
    env = process.env,
    fetchImpl = fetch,
    cache = createCacheService(),
    apiTracker = createApiTracker(),
    logger = console,
  } = {}) {
    this.env = env;
    this.fetchImpl = fetchImpl;
    this.cache = cache;
    this.apiTracker = apiTracker;
    this.logger = logger;

    this.alphaVantageKey = env.ALPHA_VANTAGE_API_KEY;
    this.twelveDataKey = env.TWELVE_DATA_API_KEY;
    this.polygonKey = env.POLYGON_API_KEY;
    this.finnhubKey = env.FINNHUB_API_KEY;
    this.fmpKey = env.FMP_API_KEY;

    this.usageLimits = {
      alphaVantage: { daily: 25, current: 0, resetTime: this.getNextResetTime() },
      twelveData: { daily: 800, current: 0, resetTime: this.getNextResetTime() },
      polygon: { daily: 100, current: 0, resetTime: this.getNextResetTime() },
      finnhub: { daily: 1000, current: 0, resetTime: this.getNextResetTime() },
      fmp: { daily: 250, current: 0, resetTime: this.getNextResetTime() },
      yahooFinance: { daily: Number.MAX_SAFE_INTEGER, current: 0, resetTime: this.getNextResetTime() },
    };

    this.priorityOrder = {
      stockData: ["twelveData", "polygon", "alphaVantage", "yahooFinance"],
      fundamentals: ["fmp", "finnhub", "alphaVantage"],
      search: ["finnhub", "twelveData", "alphaVantage"],
    };
  }

  getNextResetTime() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  resetCountersIfNeeded() {
    const now = Date.now();
    for (const source of Object.keys(this.usageLimits)) {
      if (now >= this.usageLimits[source].resetTime) {
        this.usageLimits[source].current = 0;
        this.usageLimits[source].resetTime = this.getNextResetTime();
      }
    }
  }

  hasApiKey(source) {
    switch (source) {
      case "alphaVantage":
        return Boolean(this.alphaVantageKey);
      case "twelveData":
        return Boolean(this.twelveDataKey);
      case "polygon":
        return Boolean(this.polygonKey);
      case "finnhub":
        return Boolean(this.finnhubKey);
      case "fmp":
        return Boolean(this.fmpKey);
      case "yahooFinance":
        return true;
      default:
        return false;
    }
  }

  canUseSource(source) {
    this.resetCountersIfNeeded();
    const limits = this.usageLimits[source];
    return Boolean(limits) && limits.current < limits.daily && this.hasApiKey(source);
  }

  incrementUsage(source) {
    if (this.usageLimits[source]) {
      this.usageLimits[source].current += 1;
    }
  }

  getAvailableSource(dataType) {
    const sources = this.priorityOrder[dataType] || [];
    return sources.find((source) => this.canUseSource(source)) || null;
  }

  async fetchJson(url, { apiName, endpoint, symbol = null, timeframe = null, timeoutMs = 15000 } = {}) {
    const startTime = Date.now();

    try {
      const response = await this.fetchImpl(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`${apiName} HTTP ${response.status}`);
      }

      const data = await response.json();
      // Log only after successful completion
      await this.apiTracker.logAPICall(apiName, endpoint, symbol, timeframe, true, responseTime);
      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      // Log only after failure
      await this.apiTracker.logAPICall(apiName, endpoint, symbol, timeframe, false, responseTime);
      throw error;
    }
  }

  async fetchStockData(symbol, timeframe = "1M") {
    const normalizedSymbol = String(symbol || "").trim().toUpperCase();
    const cacheKey = `stock_data_${normalizedSymbol}_${timeframe}`;

    // Use async cache get
    const cached = await this.cache.getAsync(cacheKey);
    if (cached) return { ...cached, source: "cache" };

    const source = this.getAvailableSource("stockData");
    if (!source) return this.generateMockData(normalizedSymbol, timeframe);

    try {
      let data;
      if (source === "twelveData") data = await this.fetchTwelveData(normalizedSymbol, timeframe);
      else if (source === "polygon") data = await this.fetchPolygonData(normalizedSymbol, timeframe);
      else if (source === "alphaVantage") data = await this.fetchAlphaVantageData(normalizedSymbol, timeframe);
      else data = await this.fetchYahooFinanceData(normalizedSymbol, timeframe);

      if (data?.ohlcv?.length) {
        // Use async cache set
        await this.cache.setAsync(cacheKey, data, timeframe === "1D" ? 5 * 60 * 1000 : 15 * 60 * 1000);
        this.incrementUsage(source);
        return data;
      }
    } catch (error) {
      this.logger.warn(`Stock data fetch failed via ${source}:`, error.message);
    }

    return this.generateMockData(normalizedSymbol, timeframe);
  }

  async fetchTwelveData(symbol, timeframe) {
    const intervalMap = {
      "1D": "5min",
      "1W": "30min",
      "1M": "1day",
      "3M": "1day",
      "6M": "1day",
      "1Y": "1week",
      "2Y": "1week",
    };
    const interval = intervalMap[timeframe] || "1day";
    const outputSize = timeframe === "1D" ? "96" : "120";
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputSize}&apikey=${this.twelveDataKey}`;
    const data = await this.fetchJson(url, {
      apiName: "Twelve Data",
      endpoint: "TIME_SERIES",
      symbol,
      timeframe,
    });

    if (data.status === "error" || !Array.isArray(data.values)) {
      throw new Error(data.message || "Invalid Twelve Data response");
    }

    return {
      symbol,
      timeframe,
      source: "Twelve Data",
      ohlcv: data.values
        .map((item) => ({
          date: item.datetime,
          open: Number(item.open),
          high: Number(item.high),
          low: Number(item.low),
          close: Number(item.close),
          volume: Number(item.volume || 0),
        }))
        .reverse(),
    };
  }

  async fetchPolygonData(symbol, timeframe) {
    const endDate = new Date();
    const startDate = new Date();
    const daysBack = {
      "1D": 1,
      "1W": 7,
      "1M": 30,
      "3M": 90,
      "6M": 180,
      "1Y": 365,
      "2Y": 730,
    };

    startDate.setDate(startDate.getDate() - (daysBack[timeframe] || 30));
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];
    const multiplier = timeframe === "1D" ? "5/minute" : "1/day";
    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${multiplier}/${startDateStr}/${endDateStr}?adjusted=true&sort=asc&apikey=${this.polygonKey}`;
    const data = await this.fetchJson(url, {
      apiName: "Polygon",
      endpoint: "AGGREGATES",
      symbol,
      timeframe,
    });

    if (data.status !== "OK" || !Array.isArray(data.results) || data.results.length === 0) {
      throw new Error("No Polygon data returned");
    }

    return {
      symbol,
      timeframe,
      source: "Polygon.io",
      ohlcv: data.results.map((item) => ({
        date: new Date(item.t).toISOString(),
        open: Number(item.o),
        high: Number(item.h),
        low: Number(item.l),
        close: Number(item.c),
        volume: Number(item.v || 0),
      })),
    };
  }

  async fetchYahooFinanceData(symbol, timeframe) {
    const intervalMap = {
      "1D": "5m",
      "1W": "30m",
      "1M": "1d",
      "3M": "1d",
      "6M": "1d",
      "1Y": "1wk",
      "2Y": "1wk",
    };
    const daysBack = {
      "1D": 1,
      "1W": 7,
      "1M": 30,
      "3M": 90,
      "6M": 180,
      "1Y": 365,
      "2Y": 730,
    };
    const startUnix = Math.floor(Date.now() / 1000) - (daysBack[timeframe] || 30) * 24 * 60 * 60;
    const endUnix = Math.floor(Date.now() / 1000);
    const interval = intervalMap[timeframe] || "1d";
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startUnix}&period2=${endUnix}&interval=${interval}`;
    const data = await this.fetchJson(url, {
      apiName: "Yahoo Finance",
      endpoint: "CHART",
      symbol,
      timeframe,
    });

    const result = data?.chart?.result?.[0];
    const quote = result?.indicators?.quote?.[0];
    const timestamps = result?.timestamp;
    if (!quote || !Array.isArray(timestamps) || timestamps.length === 0) {
      throw new Error("Invalid Yahoo Finance response");
    }

    return {
      symbol,
      timeframe,
      source: "Yahoo Finance",
      ohlcv: timestamps
        .map((timestamp, index) => ({
          date: new Date(timestamp * 1000).toISOString(),
          open: Number(quote.open?.[index]),
          high: Number(quote.high?.[index]),
          low: Number(quote.low?.[index]),
          close: Number(quote.close?.[index]),
          volume: Number(quote.volume?.[index] || 0),
        }))
        .filter((item) => Number.isFinite(item.open) && Number.isFinite(item.close)),
    };
  }

  async fetchAlphaVantageData(symbol, timeframe) {
    const intervalMap = {
      "1D": "5min",
      "1W": "30min",
      "1M": "daily",
      "3M": "daily",
      "6M": "daily",
      "1Y": "weekly",
      "2Y": "weekly",
    };
    const interval = intervalMap[timeframe] || "daily";
    let url;
    let timeSeriesKey;

    if (["1min", "5min", "15min", "30min", "60min"].includes(interval)) {
      url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=full&apikey=${this.alphaVantageKey}`;
      timeSeriesKey = `Time Series (${interval})`;
    } else if (interval === "weekly") {
      url = `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=${encodeURIComponent(symbol)}&outputsize=full&apikey=${this.alphaVantageKey}`;
      timeSeriesKey = "Weekly Time Series";
    } else {
      url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=full&apikey=${this.alphaVantageKey}`;
      timeSeriesKey = "Time Series (Daily)";
    }

    const data = await this.fetchJson(url, {
      apiName: "Alpha Vantage",
      endpoint: "TIME_SERIES",
      symbol,
      timeframe,
    });

    if (data.Note || data["Error Message"] || data.Information) {
      throw new Error(data.Note || data["Error Message"] || data.Information);
    }

    const timeSeries = data[timeSeriesKey];
    if (!timeSeries) throw new Error("No Alpha Vantage time series returned");

    return {
      symbol,
      timeframe,
      source: "Alpha Vantage",
      ohlcv: Object.entries(timeSeries)
        .map(([date, values]) => ({
          date,
          open: Number(values["1. open"]),
          high: Number(values["2. high"]),
          low: Number(values["3. low"]),
          close: Number(values["4. close"]),
          volume: Number(values["5. volume"] || values["6. volume"] || 0),
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
    };
  }

  async fetchFundamentalData(symbol) {
    const cacheKey = `fundamentals_${symbol}`;

    // Use async cache get
    const cached = await this.cache.getAsync(cacheKey);
    if (cached) return { ...cached, source: "cache" };

    const source = this.getAvailableSource("fundamentals");
    if (!source) throw new Error("No fundamental data source configured");

    let data;
    if (source === "fmp") data = await this.fetchFMPFundamentals(symbol);
    else if (source === "finnhub") data = await this.fetchFinnhubFundamentals(symbol);
    else data = await this.fetchAlphaVantageFundamentals(symbol);

    // Use async cache set
    await this.cache.setAsync(cacheKey, data, 24 * 60 * 60 * 1000);
    this.incrementUsage(source);
    return data;
  }

  async fetchFMPFundamentals(symbol) {
    const profileUrl = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${this.fmpKey}`;
    const metricsUrl = `https://financialmodelingprep.com/api/v3/key-metrics/${symbol}?apikey=${this.fmpKey}`;
    const [profileResponse, metricsResponse] = await Promise.all([
      this.fetchJson(profileUrl, { apiName: "FMP", endpoint: "PROFILE", symbol }),
      this.fetchJson(metricsUrl, { apiName: "FMP", endpoint: "KEY_METRICS", symbol }),
    ]);

    const profile = profileResponse?.[0];
    const metrics = metricsResponse?.[0];
    if (!profile || !metrics) throw new Error("Invalid FMP response");

    return {
      source: "Financial Modeling Prep",
      overview: {
        PERatio: metrics.peRatio,
        PEGRatio: metrics.pegRatio,
        PriceToBookRatio: metrics.pbRatio,
        ReturnOnEquityTTM: metrics.roe,
        ProfitMargin: profile.mktCap > 0 ? (profile.lastDiv / profile.price) * 100 : null,
        EPS: profile.eps,
      },
    };
  }

  async fetchFinnhubFundamentals(symbol) {
    const url = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${this.finnhubKey}`;
    const data = await this.fetchJson(url, {
      apiName: "Finnhub",
      endpoint: "METRICS",
      symbol,
    });

    if (!data.metric) throw new Error("Invalid Finnhub metrics response");

    return {
      source: "Finnhub",
      overview: {
        PERatio: data.metric.peBasicExclExtraTTM,
        PriceToBookRatio: data.metric.pbQuarterly,
        ReturnOnEquityTTM: data.metric.roeTTM,
        EPS: data.metric.epsBasicExclExtraItemsTTM,
      },
    };
  }

  async fetchAlphaVantageFundamentals(symbol) {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${this.alphaVantageKey}`;
    const data = await this.fetchJson(url, {
      apiName: "Alpha Vantage",
      endpoint: "OVERVIEW",
      symbol,
    });

    if (data.Note || data["Error Message"]) {
      throw new Error(data.Note || data["Error Message"]);
    }

    return {
      source: "Alpha Vantage",
      overview: data,
    };
  }

  async searchSymbols(query) {
    const trimmedQuery = String(query || "").trim();
    if (!trimmedQuery) return { results: [], source: "empty" };

    const cacheKey = `search_${trimmedQuery.toLowerCase()}`;

    // Use async cache get
    const cached = await this.cache.getAsync(cacheKey);
    if (cached) return { ...cached, source: "cache" };

    const source = this.getAvailableSource("search");
    if (!source) {
      return {
        results: this.generateFallbackSearchResults(trimmedQuery),
        source: "fallback",
      };
    }

    try {
      let results;
      if (source === "finnhub") results = await this.searchFinnhub(trimmedQuery);
      else if (source === "twelveData") results = await this.searchTwelveData(trimmedQuery);
      else results = await this.searchAlphaVantage(trimmedQuery);

      // Use async cache set
      await this.cache.setAsync(cacheKey, results, 60 * 60 * 1000);
      this.incrementUsage(source);
      return results;
    } catch (error) {
      this.logger.warn(`Search failed via ${source}:`, error.message);
      return {
        results: this.generateFallbackSearchResults(trimmedQuery),
        source: "fallback",
      };
    }
  }

  async searchFinnhub(query) {
    const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${this.finnhubKey}`;
    const data = await this.fetchJson(url, {
      apiName: "Finnhub",
      endpoint: "SEARCH",
      symbol: query,
    });

    return {
      source: "Finnhub",
      results: Array.isArray(data.result)
        ? data.result.slice(0, 20).map((item) => ({
            symbol: item.symbol,
            name: item.description,
            type: item.type || "Equity",
            region: item.type || "US",
          }))
        : [],
    };
  }

  async searchTwelveData(query) {
    const url = `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${this.twelveDataKey}`;
    const data = await this.fetchJson(url, {
      apiName: "Twelve Data",
      endpoint: "SEARCH",
      symbol: query,
    });

    return {
      source: "Twelve Data",
      results: Array.isArray(data.data)
        ? data.data.slice(0, 20).map((item) => ({
            symbol: item.symbol,
            name: item.instrument_name,
            type: item.instrument_type || "Equity",
            region: item.exchange,
          }))
        : [],
    };
  }

  async searchAlphaVantage(query) {
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${this.alphaVantageKey}`;
    const data = await this.fetchJson(url, {
      apiName: "Alpha Vantage",
      endpoint: "SEARCH",
      symbol: query,
    });

    return {
      source: "Alpha Vantage",
      results: Array.isArray(data.bestMatches)
        ? data.bestMatches.slice(0, 20).map((item) => ({
            symbol: item["1. symbol"],
            name: item["2. name"],
            type: item["3. type"] || "Equity",
            region: item["4. region"],
          }))
        : [],
    };
  }

  generateFallbackSearchResults(query) {
    const normalized = query.toLowerCase();
    return POPULAR_STOCKS.filter(
      (stock) =>
        stock.symbol.toLowerCase().includes(normalized) ||
        stock.name.toLowerCase().includes(normalized)
    ).slice(0, 8);
  }

  generateMockData(symbol, timeframe) {
    const ohlcv = [];
    let price = 100 + Math.random() * 60;
    const dataPointsMap = {
      "1D": 96,
      "1W": 56,
      "1M": 30,
      "3M": 90,
      "6M": 180,
      "1Y": 52,
      "2Y": 104,
    };
    const dataPoints = dataPointsMap[timeframe] || 30;
    const now = Date.now();

    for (let index = 0; index < dataPoints; index += 1) {
      const change = (Math.random() - 0.5) * 4;
      const open = price;
      price += change;
      const high = Math.max(open, price) + Math.random() * 1.4;
      const low = Math.min(open, price) - Math.random() * 1.4;
      const volume = Math.round(850000 + Math.random() * 500000);
      const timestamp = now - (dataPoints - index) * 24 * 60 * 60 * 1000;

      ohlcv.push({
        date: new Date(timestamp).toISOString(),
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(price.toFixed(2)),
        volume,
      });
    }

    return {
      symbol,
      timeframe,
      source: "Mock Data",
      ohlcv,
    };
  }

  getStatus() {
    this.resetCountersIfNeeded();
    return {
      sources: Object.keys(this.usageLimits).map((name) => ({
        name,
        hasApiKey: this.hasApiKey(name),
        usage: this.usageLimits[name].current,
        limit: this.usageLimits[name].daily,
        available: this.canUseSource(name),
      })),
      priorityOrder: this.priorityOrder,
      cacheStats: this.cache.stats(),
      tracking: this.apiTracker.getAPIStatistics(),
    };
  }
}

function createDataSourceManager(options) {
  return new DataSourceManager(options);
}

const dataSourceManagerModule = {
  DataSourceManager,
  createDataSourceManager,
};

export { DataSourceManager, createDataSourceManager };

export default dataSourceManagerModule;
