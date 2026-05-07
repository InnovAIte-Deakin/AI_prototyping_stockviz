import cacheModule from "../cache/index";
import observabilityModule from "../observability/index.js";
import {
  buildYahooQuoteSummaryUrl,
  buildYahooSearchUrl,
  normalizeYahooFundamentals,
  normalizeYahooSearchResults,
  parseYahooChartResponse,
} from "./yahoo-finance";
import {
  buildProviderOrder,
  getProviderPreferences,
  type ProviderCapability,
  type ProviderId,
} from "./provider-preferences";

type Environment = Record<string, string | undefined>;
type DataType = "stockData" | "fundamentals" | "search";
type Timeframe = string;

type OhlcvPoint = {
  close: number;
  date: string;
  high: number;
  low: number;
  open: number;
  volume: number;
};

type StockDataResult = {
  ohlcv: OhlcvPoint[];
  source: string;
  symbol: string;
  timeframe: string;
};

type SearchResult = {
  name: string;
  region: string;
  symbol: string;
  type: string;
};

type SearchResponse = {
  results: SearchResult[];
  source: string;
};

type FundamentalData = {
  overview: Record<string, unknown>;
  source: string;
};

type CacheLike = {
  getAsync<T = unknown>(key: string): Promise<T | null>;
  setAsync(key: string, data: unknown, ttlMs?: number): Promise<void>;
  stats(): Promise<unknown> | unknown;
};

type ApiTrackerLike = {
  getAPIStatistics(): unknown;
  logAPICall(
    apiName: string,
    endpoint: string,
    symbol?: string | null,
    timeframe?: string | null,
    success?: boolean,
    responseTime?: number,
  ): Promise<void> | void;
};

type LoggerLike = {
  warn(...data: unknown[]): void;
};

type ProviderPreferences = Record<
  string,
  {
    fallbackEnabled?: boolean;
    provider?: string;
  }
>;
type LoadProviderPreferences = () => Promise<ProviderPreferences>;

type FetchJsonOptions = {
  apiName: string;
  endpoint: string;
  symbol?: string | null;
  timeframe?: string | null;
  timeoutMs?: number;
};

type DataSourceManagerOptions = {
  apiTracker?: ApiTrackerLike;
  cache?: CacheLike;
  env?: Environment;
  fetchImpl?: typeof fetch;
  loadProviderPreferences?: LoadProviderPreferences;
  logger?: LoggerLike;
};

type UsageLimit = {
  current: number;
  daily: number;
  resetTime: number;
};

const { createCacheService } = cacheModule as {
  createCacheService: () => CacheLike;
};
const { createApiTracker } = observabilityModule as {
  createApiTracker: () => ApiTrackerLike;
};

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

function getAlphaVantageApiKey(env: Environment = process.env) {
  return env.ALPHA_VANTAGE_API_KEY;
}

const POPULAR_STOCKS: SearchResult[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    type: "Equity",
    region: "United States",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    type: "Equity",
    region: "United States",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    type: "Equity",
    region: "United States",
  },
  {
    symbol: "AMZN",
    name: "Amazon.com, Inc.",
    type: "Equity",
    region: "United States",
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    type: "Equity",
    region: "United States",
  },
  {
    symbol: "META",
    name: "Meta Platforms, Inc.",
    type: "Equity",
    region: "United States",
  },
  {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    type: "Equity",
    region: "United States",
  },
  {
    symbol: "AMD",
    name: "Advanced Micro Devices, Inc.",
    type: "Equity",
    region: "United States",
  },
];

class DataSourceManager {
  private alphaVantageKey: string | undefined;
  private apiTracker: ApiTrackerLike;
  private cache: CacheLike;
  private env: Environment;
  private fetchImpl: typeof fetch;
  private finnhubKey: string | undefined;
  private fmpKey: string | undefined;
  private loadProviderPreferences: LoadProviderPreferences;
  private logger: LoggerLike;
  private polygonKey: string | undefined;
  private priorityOrder: Record<DataType, ProviderId[]>;
  private twelveDataKey: string | undefined;
  private usageLimits: Record<ProviderId, UsageLimit>;

  constructor({
    env = process.env,
    fetchImpl = fetch,
    cache = createCacheService(),
    apiTracker = createApiTracker(),
    logger = console,
    loadProviderPreferences = getProviderPreferences,
  }: DataSourceManagerOptions = {}) {
    this.env = env;
    this.fetchImpl = fetchImpl;
    this.cache = cache;
    this.apiTracker = apiTracker;
    this.logger = logger;
    this.loadProviderPreferences = loadProviderPreferences;

    this.alphaVantageKey = getAlphaVantageApiKey(env);
    this.twelveDataKey = env.TWELVE_DATA_API_KEY;
    this.polygonKey = env.POLYGON_API_KEY;
    this.finnhubKey = env.FINNHUB_API_KEY;
    this.fmpKey = env.FMP_API_KEY;

    this.usageLimits = {
      alphaVantage: {
        daily: 25,
        current: 0,
        resetTime: this.getNextResetTime(),
      },
      twelveData: {
        daily: 800,
        current: 0,
        resetTime: this.getNextResetTime(),
      },
      polygon: { daily: 100, current: 0, resetTime: this.getNextResetTime() },
      finnhub: { daily: 1000, current: 0, resetTime: this.getNextResetTime() },
      fmp: { daily: 250, current: 0, resetTime: this.getNextResetTime() },
      yahooFinance: {
        daily: Number.MAX_SAFE_INTEGER,
        current: 0,
        resetTime: this.getNextResetTime(),
      },
    };

    this.priorityOrder = {
      stockData: ["yahooFinance", "twelveData", "polygon", "alphaVantage"],
      fundamentals: ["yahooFinance", "fmp", "finnhub", "alphaVantage"],
      search: ["yahooFinance", "finnhub", "twelveData", "alphaVantage"],
    };
  }

  getNextResetTime(): number {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  resetCountersIfNeeded(): void {
    const now = Date.now();
    for (const source of Object.keys(this.usageLimits) as ProviderId[]) {
      if (now >= this.usageLimits[source].resetTime) {
        this.usageLimits[source].current = 0;
        this.usageLimits[source].resetTime = this.getNextResetTime();
      }
    }
  }

  hasApiKey(source: ProviderId): boolean {
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

  canUseSource(source: ProviderId): boolean {
    this.resetCountersIfNeeded();
    const limits = this.usageLimits[source];
    return (
      Boolean(limits) && limits.current < limits.daily && this.hasApiKey(source)
    );
  }

  incrementUsage(source: ProviderId): void {
    if (this.usageLimits[source]) {
      this.usageLimits[source].current += 1;
    }
  }

  getAvailableSource(dataType: DataType): ProviderId | null {
    const sources = this.priorityOrder[dataType] || [];
    return sources.find((source) => this.canUseSource(source)) || null;
  }

  getAvailableSources(dataType: DataType): ProviderId[] {
    const sources = this.priorityOrder[dataType] || [];
    return sources.filter((source) => this.canUseSource(source));
  }

  async getAvailableSourcesForCapability(
    dataType: DataType,
    capability: ProviderCapability,
  ): Promise<ProviderId[]> {
    try {
      const preferences = await this.loadProviderPreferences();
      const preference = preferences[capability];
      const ordered = buildProviderOrder(
        capability,
        preference?.provider ?? "",
        preference?.fallbackEnabled !== false,
      );
      return ordered.filter((source) => this.canUseSource(source));
    } catch (error) {
      this.logger.warn(
        `Provider preferences unavailable for ${capability}:`,
        toErrorMessage(error),
      );
      return this.getAvailableSources(dataType);
    }
  }

  async fetchJson<T = Record<string, unknown>>(
    url: string,
    {
      apiName,
      endpoint,
      symbol = null,
      timeframe = null,
      timeoutMs = 15000,
    }: FetchJsonOptions,
  ): Promise<T> {
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

      const data = (await response.json()) as T;
      // Log only after successful completion
      await this.apiTracker.logAPICall(
        apiName,
        endpoint,
        symbol,
        timeframe,
        true,
        responseTime,
      );
      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      // Log only after failure
      await this.apiTracker.logAPICall(
        apiName,
        endpoint,
        symbol,
        timeframe,
        false,
        responseTime,
      );
      throw error;
    }
  }

  async fetchStockData(
    symbol: string,
    timeframe: Timeframe = "1M",
  ): Promise<StockDataResult> {
    const normalizedSymbol = String(symbol || "")
      .trim()
      .toUpperCase();
    const cacheKey = `stock_data_${normalizedSymbol}_${timeframe}`;

    // Use async cache get
    const cached = await this.cache.getAsync<StockDataResult>(cacheKey);
    if (cached) return { ...cached, source: "cache" };

    const sources = await this.getAvailableSourcesForCapability(
      "stockData",
      "stock_ohlcv",
    );
    if (sources.length === 0)
      return this.generateMockData(normalizedSymbol, timeframe);

    for (const source of sources) {
      try {
        let data: StockDataResult;
        if (source === "twelveData")
          data = await this.fetchTwelveData(normalizedSymbol, timeframe);
        else if (source === "polygon")
          data = await this.fetchPolygonData(normalizedSymbol, timeframe);
        else if (source === "alphaVantage")
          data = await this.fetchAlphaVantageData(normalizedSymbol, timeframe);
        else
          data = await this.fetchYahooFinanceData(normalizedSymbol, timeframe);

        if (data?.ohlcv?.length) {
          // Use async cache set
          await this.cache.setAsync(
            cacheKey,
            data,
            timeframe === "1D" ? 5 * 60 * 1000 : 15 * 60 * 1000,
          );
          this.incrementUsage(source);
          return data;
        }
      } catch (error) {
        this.logger.warn(
          `Stock data fetch failed via ${source}:`,
          toErrorMessage(error),
        );
      }
    }

    return this.generateMockData(normalizedSymbol, timeframe);
  }

  async fetchTwelveData(
    symbol: string,
    timeframe: Timeframe,
  ): Promise<StockDataResult> {
    const intervalMap: Record<string, string> = {
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
    const data = await this.fetchJson<{
      message?: string;
      status?: string;
      values?: Array<Record<string, unknown>>;
    }>(url, {
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
        .map((item): OhlcvPoint => ({
          date: String(item.datetime ?? ""),
          open: Number(item.open),
          high: Number(item.high),
          low: Number(item.low),
          close: Number(item.close),
          volume: Number(item.volume || 0),
        }))
        .reverse(),
    };
  }

  async fetchPolygonData(
    symbol: string,
    timeframe: Timeframe,
  ): Promise<StockDataResult> {
    const endDate = new Date();
    const startDate = new Date();
    const daysBack: Record<string, number> = {
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
    const data = await this.fetchJson<{
      results?: Array<Record<string, unknown>>;
      status?: string;
    }>(url, {
      apiName: "Polygon",
      endpoint: "AGGREGATES",
      symbol,
      timeframe,
    });

    if (
      data.status !== "OK" ||
      !Array.isArray(data.results) ||
      data.results.length === 0
    ) {
      throw new Error("No Polygon data returned");
    }

    return {
      symbol,
      timeframe,
      source: "Polygon.io",
      ohlcv: data.results.map((item): OhlcvPoint => ({
        date: new Date(Number(item.t)).toISOString(),
        open: Number(item.o),
        high: Number(item.h),
        low: Number(item.l),
        close: Number(item.c),
        volume: Number(item.v || 0),
      })),
    };
  }

  async fetchYahooFinanceData(
    symbol: string,
    timeframe: Timeframe,
  ): Promise<StockDataResult> {
    const intervalMap: Record<string, string> = {
      "1D": "5m",
      "1W": "30m",
      "1M": "1d",
      "3M": "1d",
      "6M": "1d",
      "1Y": "1wk",
      "2Y": "1wk",
    };
    const daysBack: Record<string, number> = {
      "1D": 1,
      "1W": 7,
      "1M": 30,
      "3M": 90,
      "6M": 180,
      "1Y": 365,
      "2Y": 730,
    };
    const startUnix =
      Math.floor(Date.now() / 1000) -
      (daysBack[timeframe] || 30) * 24 * 60 * 60;
    const endUnix = Math.floor(Date.now() / 1000);
    const interval = intervalMap[timeframe] || "1d";
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startUnix}&period2=${endUnix}&interval=${interval}`;
    const data = await this.fetchJson(url, {
      apiName: "Yahoo Finance",
      endpoint: "CHART",
      symbol,
      timeframe,
    });

    const parsed = parseYahooChartResponse(data);
    if (!parsed.ok) {
      throw new Error(parsed.error);
    }

    return {
      symbol,
      timeframe,
      source: "Yahoo Finance",
      ohlcv: parsed.series.map((item) => ({
        ...item,
        date: new Date(`${item.date}T00:00:00Z`).toISOString(),
      })),
    };
  }

  async fetchAlphaVantageData(
    symbol: string,
    timeframe: Timeframe,
  ): Promise<StockDataResult> {
    const intervalMap: Record<string, string> = {
      "1D": "5min",
      "1W": "30min",
      "1M": "daily",
      "3M": "daily",
      "6M": "daily",
      "1Y": "weekly",
      "2Y": "weekly",
    };
    const interval = intervalMap[timeframe] || "daily";
    let url: string;
    let timeSeriesKey: string;

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

    const data = await this.fetchJson<Record<string, unknown>>(url, {
      apiName: "Alpha Vantage",
      endpoint: "TIME_SERIES",
      symbol,
      timeframe,
    });

    if (data.Note || data["Error Message"] || data.Information) {
      throw new Error(
        String(data.Note || data["Error Message"] || data.Information),
      );
    }

    const timeSeries = data[timeSeriesKey] as
      | Record<string, Record<string, unknown>>
      | undefined;
    if (!timeSeries) throw new Error("No Alpha Vantage time series returned");

    return {
      symbol,
      timeframe,
      source: "Alpha Vantage",
      ohlcv: Object.entries(timeSeries)
        .map(([date, values]): OhlcvPoint => ({
          date,
          open: Number(values["1. open"]),
          high: Number(values["2. high"]),
          low: Number(values["3. low"]),
          close: Number(values["4. close"]),
          volume: Number(values["5. volume"] || values["6. volume"] || 0),
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    };
  }

  async fetchFundamentalData(symbol: string): Promise<FundamentalData> {
    const cacheKey = `fundamentals_${symbol}`;

    // Use async cache get
    const cached = await this.cache.getAsync<FundamentalData>(cacheKey);
    if (cached) return { ...cached, source: "cache" };

    const sources = await this.getAvailableSourcesForCapability(
      "fundamentals",
      "fundamentals",
    );
    if (sources.length === 0)
      throw new Error("No fundamental data source configured");

    for (const source of sources) {
      try {
        let data: FundamentalData;
        if (source === "yahooFinance")
          data = await this.fetchYahooFundamentals(symbol);
        else if (source === "fmp") data = await this.fetchFMPFundamentals(symbol);
        else if (source === "finnhub")
          data = await this.fetchFinnhubFundamentals(symbol);
        else data = await this.fetchAlphaVantageFundamentals(symbol);

        // Use async cache set
        await this.cache.setAsync(cacheKey, data, 24 * 60 * 60 * 1000);
        this.incrementUsage(source);
        return data;
      } catch (error) {
        this.logger.warn(
          `Fundamentals fetch failed via ${source}:`,
          toErrorMessage(error),
        );
      }
    }

    throw new Error("All fundamental data sources failed");
  }

  async fetchYahooFundamentals(symbol: string): Promise<FundamentalData> {
    const data = await this.fetchJson(buildYahooQuoteSummaryUrl(symbol), {
      apiName: "Yahoo Finance",
      endpoint: "QUOTE_SUMMARY",
      symbol,
    });

    return normalizeYahooFundamentals(data);
  }

  async fetchFMPFundamentals(symbol: string): Promise<FundamentalData> {
    const profileUrl = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${this.fmpKey}`;
    const metricsUrl = `https://financialmodelingprep.com/api/v3/key-metrics/${symbol}?apikey=${this.fmpKey}`;
    const [profileResponse, metricsResponse] = await Promise.all([
      this.fetchJson<Array<Record<string, unknown>>>(profileUrl, {
        apiName: "FMP",
        endpoint: "PROFILE",
        symbol,
      }),
      this.fetchJson<Array<Record<string, unknown>>>(metricsUrl, {
        apiName: "FMP",
        endpoint: "KEY_METRICS",
        symbol,
      }),
    ]);

    const profile = profileResponse[0];
    const metrics = metricsResponse[0];
    if (!profile || !metrics) throw new Error("Invalid FMP response");

    return {
      source: "Financial Modeling Prep",
      overview: {
        PERatio: metrics.peRatio,
        PEGRatio: metrics.pegRatio,
        PriceToBookRatio: metrics.pbRatio,
        ReturnOnEquityTTM: metrics.roe,
        ProfitMargin:
          Number(profile.mktCap) > 0
            ? (Number(profile.lastDiv) / Number(profile.price)) * 100
            : null,
        EPS: profile.eps,
      },
    };
  }

  async fetchFinnhubFundamentals(symbol: string): Promise<FundamentalData> {
    const url = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${this.finnhubKey}`;
    const data = await this.fetchJson<{ metric?: Record<string, unknown> }>(url, {
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

  async fetchAlphaVantageFundamentals(symbol: string): Promise<FundamentalData> {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${this.alphaVantageKey}`;
    const data = await this.fetchJson<Record<string, unknown>>(url, {
      apiName: "Alpha Vantage",
      endpoint: "OVERVIEW",
      symbol,
    });

    if (data.Note || data["Error Message"]) {
      throw new Error(String(data.Note || data["Error Message"]));
    }

    return {
      source: "Alpha Vantage",
      overview: data,
    };
  }

  async searchSymbols(query: string): Promise<SearchResponse> {
    const trimmedQuery = String(query || "").trim();
    if (!trimmedQuery) return { results: [], source: "empty" };

    const cacheKey = `search_${trimmedQuery.toLowerCase()}`;

    // Use async cache get
    const cached = await this.cache.getAsync<SearchResponse>(cacheKey);
    if (cached) return { ...cached, source: "cache" };

    const sources = await this.getAvailableSourcesForCapability(
      "search",
      "symbol_search",
    );
    if (sources.length === 0) {
      return {
        results: this.generateFallbackSearchResults(trimmedQuery),
        source: "fallback",
      };
    }

    for (const source of sources) {
      try {
        let results: SearchResponse;
        if (source === "yahooFinance")
          results = await this.searchYahooFinance(trimmedQuery);
        else if (source === "finnhub")
          results = await this.searchFinnhub(trimmedQuery);
        else if (source === "twelveData")
          results = await this.searchTwelveData(trimmedQuery);
        else results = await this.searchAlphaVantage(trimmedQuery);

        // Use async cache set
        await this.cache.setAsync(cacheKey, results, 60 * 60 * 1000);
        this.incrementUsage(source);
        return results;
      } catch (error) {
        this.logger.warn(`Search failed via ${source}:`, toErrorMessage(error));
      }
    }

    return {
      results: this.generateFallbackSearchResults(trimmedQuery),
      source: "fallback",
    };
  }

  async searchYahooFinance(query: string): Promise<SearchResponse> {
    const data = await this.fetchJson(buildYahooSearchUrl(query), {
      apiName: "Yahoo Finance",
      endpoint: "SEARCH",
      symbol: query,
    });

    return normalizeYahooSearchResults(data);
  }

  async searchFinnhub(query: string): Promise<SearchResponse> {
    const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${this.finnhubKey}`;
    const data = await this.fetchJson<{
      result?: Array<{
        description?: string;
        symbol?: string;
        type?: string;
      }>;
    }>(url, {
      apiName: "Finnhub",
      endpoint: "SEARCH",
      symbol: query,
    });

    return {
      source: "Finnhub",
      results: Array.isArray(data.result)
        ? data.result.slice(0, 20).map((item): SearchResult => ({
            symbol: item.symbol ?? "",
            name: item.description ?? item.symbol ?? "",
            type: item.type || "Equity",
            region: item.type || "US",
          }))
        : [],
    };
  }

  async searchTwelveData(query: string): Promise<SearchResponse> {
    const url = `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${this.twelveDataKey}`;
    const data = await this.fetchJson<{
      data?: Array<{
        exchange?: string;
        instrument_name?: string;
        instrument_type?: string;
        symbol?: string;
      }>;
    }>(url, {
      apiName: "Twelve Data",
      endpoint: "SEARCH",
      symbol: query,
    });

    return {
      source: "Twelve Data",
      results: Array.isArray(data.data)
        ? data.data.slice(0, 20).map((item): SearchResult => ({
            symbol: item.symbol ?? "",
            name: item.instrument_name ?? item.symbol ?? "",
            type: item.instrument_type || "Equity",
            region: item.exchange ?? "Twelve Data",
          }))
        : [],
    };
  }

  async searchAlphaVantage(query: string): Promise<SearchResponse> {
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${this.alphaVantageKey}`;
    const data = await this.fetchJson<{
      bestMatches?: Array<Record<string, unknown>>;
    }>(url, {
      apiName: "Alpha Vantage",
      endpoint: "SEARCH",
      symbol: query,
    });

    return {
      source: "Alpha Vantage",
      results: Array.isArray(data.bestMatches)
        ? data.bestMatches.slice(0, 20).map((item): SearchResult => ({
            symbol: String(item["1. symbol"] ?? ""),
            name: String(item["2. name"] ?? item["1. symbol"] ?? ""),
            type: String(item["3. type"] || "Equity"),
            region: String(item["4. region"] || "Alpha Vantage"),
          }))
        : [],
    };
  }

  generateFallbackSearchResults(query: string): SearchResult[] {
    const normalized = query.toLowerCase();
    return POPULAR_STOCKS.filter(
      (stock) =>
        stock.symbol.toLowerCase().includes(normalized) ||
        stock.name.toLowerCase().includes(normalized),
    ).slice(0, 8);
  }

  generateMockData(
    symbol: string,
    timeframe: Timeframe,
  ): StockDataResult {
    const ohlcv: OhlcvPoint[] = [];
    let price = 100 + Math.random() * 60;
    const dataPointsMap: Record<string, number> = {
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
      sources: (Object.keys(this.usageLimits) as ProviderId[]).map((name) => ({
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

function createDataSourceManager(options?: DataSourceManagerOptions) {
  return new DataSourceManager(options);
}

const dataSourceManagerModule = {
  DataSourceManager,
  createDataSourceManager,
};

export { DataSourceManager, createDataSourceManager };

export default dataSourceManagerModule;
