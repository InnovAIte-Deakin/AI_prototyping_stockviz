import { beforeEach, describe, expect, it, vi } from "vitest";

import dataServiceModule from "@/lib/market/data-service.js";
import dataSourceManagerModule from "@/lib/market/data-source-manager.js";

const { createDataService } = dataServiceModule;
const { createDataSourceManager } = dataSourceManagerModule;

type FetchMock = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

const createCache = () => ({
  getAsync: vi.fn(async () => null),
  setAsync: vi.fn(async () => undefined),
  stats: vi.fn(() => ({ expired: 0, size: 0, valid: 0 })),
});

const createApiTracker = () => ({
  getAPIStatistics: vi.fn(() => ({})),
  logAPICall: vi.fn(async () => undefined),
});

const createProviderPreferences = (overrides = {}) => ({
  fundamentals: {
    capability: "fundamentals",
    fallbackEnabled: true,
    provider: "yahooFinance",
    updatedAt: null,
    updatedBy: null,
  },
  sentiment_news: {
    capability: "sentiment_news",
    fallbackEnabled: true,
    provider: "alphaVantage",
    updatedAt: null,
    updatedBy: null,
  },
  stock_ohlcv: {
    capability: "stock_ohlcv",
    fallbackEnabled: true,
    provider: "yahooFinance",
    updatedAt: null,
    updatedBy: null,
  },
  stock_price_series: {
    capability: "stock_price_series",
    fallbackEnabled: true,
    provider: "yahooFinance",
    updatedAt: null,
    updatedBy: null,
  },
  symbol_search: {
    capability: "symbol_search",
    fallbackEnabled: true,
    provider: "yahooFinance",
    updatedAt: null,
    updatedBy: null,
  },
  ...overrides,
});

describe("market data service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes Twelve Data time series and writes it to cache", async () => {
    const cache = createCache();
    const apiTracker = createApiTracker();
    const fetchImpl = vi.fn<FetchMock>(async () =>
      Response.json({
        values: [
          {
            close: "104.25",
            datetime: "2026-04-24",
            high: "105.00",
            low: "99.50",
            open: "100.00",
            volume: "123456",
          },
          {
            close: "101.25",
            datetime: "2026-04-23",
            high: "102.00",
            low: "98.50",
            open: "99.00",
            volume: "654321",
          },
        ],
      }),
    );
    const manager = createDataSourceManager({
      apiTracker,
      cache,
      env: { TWELVE_DATA_API_KEY: "twelve-test-key" },
      fetchImpl,
      loadProviderPreferences: async () =>
        createProviderPreferences({
          stock_ohlcv: {
            capability: "stock_ohlcv",
            fallbackEnabled: true,
            provider: "twelveData",
            updatedAt: null,
            updatedBy: null,
          },
        }),
    });

    await expect(manager.fetchStockData(" aapl ", "1M")).resolves.toEqual({
      ohlcv: [
        {
          close: 101.25,
          date: "2026-04-23",
          high: 102,
          low: 98.5,
          open: 99,
          volume: 654321,
        },
        {
          close: 104.25,
          date: "2026-04-24",
          high: 105,
          low: 99.5,
          open: 100,
          volume: 123456,
        },
      ],
      source: "Twelve Data",
      symbol: "AAPL",
      timeframe: "1M",
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("https://api.twelvedata.com/time_series"),
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(String(fetchImpl.mock.calls[0][0])).toContain("symbol=AAPL");
    expect(String(fetchImpl.mock.calls[0][0])).toContain(
      "apikey=twelve-test-key",
    );
    expect(cache.setAsync).toHaveBeenCalledWith(
      "stock_data_AAPL_1M",
      expect.objectContaining({ source: "Twelve Data" }),
      15 * 60 * 1000,
    );
    expect(apiTracker.logAPICall).toHaveBeenCalledWith(
      "Twelve Data",
      "TIME_SERIES",
      "AAPL",
      "1M",
      true,
      expect.any(Number),
    );
  });

  it("uses Yahoo Finance as the primary stock data provider when no keyed providers are configured", async () => {
    const cache = createCache();
    const apiTracker = createApiTracker();
    const fetchImpl = vi.fn<FetchMock>(async () =>
      Response.json({
        chart: {
          result: [
            {
              timestamp: [1776988800],
              indicators: {
                quote: [
                  {
                    close: [104.25],
                    high: [105],
                    low: [99.5],
                    open: [100],
                    volume: [123456],
                  },
                ],
              },
            },
          ],
        },
      }),
    );
    const manager = createDataSourceManager({
      apiTracker,
      cache,
      env: {},
      fetchImpl,
    });

    await expect(manager.fetchStockData(" aapl ", "1M")).resolves.toEqual({
      ohlcv: [
        {
          close: 104.25,
          date: "2026-04-24T00:00:00.000Z",
          high: 105,
          low: 99.5,
          open: 100,
          volume: 123456,
        },
      ],
      source: "Yahoo Finance",
      symbol: "AAPL",
      timeframe: "1M",
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining(
        "https://query1.finance.yahoo.com/v8/finance/chart/AAPL",
      ),
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(apiTracker.logAPICall).toHaveBeenCalledWith(
      "Yahoo Finance",
      "CHART",
      "AAPL",
      "1M",
      true,
      expect.any(Number),
    );
  });

  it("uses the selected stock OHLCV provider before the default order", async () => {
    const cache = createCache();
    const apiTracker = createApiTracker();
    const fetchImpl = vi.fn<FetchMock>(async () =>
      Response.json({
        values: [
          {
            close: "104.25",
            datetime: "2026-04-24",
            high: "105.00",
            low: "99.50",
            open: "100.00",
            volume: "123456",
          },
        ],
      }),
    );
    const manager = createDataSourceManager({
      apiTracker,
      cache,
      env: { TWELVE_DATA_API_KEY: "twelve-test-key" },
      fetchImpl,
      loadProviderPreferences: async () =>
        createProviderPreferences({
          stock_ohlcv: {
            capability: "stock_ohlcv",
            fallbackEnabled: true,
            provider: "twelveData",
            updatedAt: null,
            updatedBy: null,
          },
        }),
    });

    await expect(manager.fetchStockData("AAPL", "1M")).resolves.toMatchObject({
      source: "Twelve Data",
      symbol: "AAPL",
    });

    expect(String(fetchImpl.mock.calls[0][0])).toContain("api.twelvedata.com");
  });

  it("falls through to Twelve Data when Yahoo stock data fails and Twelve Data is configured", async () => {
    const cache = createCache();
    const apiTracker = createApiTracker();
    const fetchImpl = vi
      .fn<FetchMock>()
      .mockResolvedValueOnce(Response.json({ chart: { result: null } }))
      .mockResolvedValueOnce(
        Response.json({
          values: [
            {
              close: "104.25",
              datetime: "2026-04-24",
              high: "105.00",
              low: "99.50",
              open: "100.00",
              volume: "123456",
            },
          ],
        }),
      );
    const manager = createDataSourceManager({
      apiTracker,
      cache,
      env: { TWELVE_DATA_API_KEY: "twelve-test-key" },
      fetchImpl,
    });

    await expect(manager.fetchStockData("AAPL", "1M")).resolves.toMatchObject({
      source: "Twelve Data",
      symbol: "AAPL",
      timeframe: "1M",
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(String(fetchImpl.mock.calls[0][0])).toContain(
      "query1.finance.yahoo.com",
    );
    expect(String(fetchImpl.mock.calls[1][0])).toContain("api.twelvedata.com");
  });

  it("uses Yahoo Finance as the primary fundamentals provider", async () => {
    const cache = createCache();
    const apiTracker = createApiTracker();
    const fetchImpl = vi.fn<FetchMock>(async () =>
      Response.json({
        quoteSummary: {
          result: [
            {
              defaultKeyStatistics: {
                priceToBook: { raw: 12.1 },
                trailingEps: { raw: 6.43 },
              },
              financialData: {
                profitMargins: { raw: 0.2631 },
                returnOnEquity: { raw: 1.4725 },
              },
              summaryDetail: {
                trailingPE: { raw: 31.5 },
              },
            },
          ],
        },
      }),
    );
    const manager = createDataSourceManager({
      apiTracker,
      cache,
      env: {},
      fetchImpl,
    });

    await expect(manager.fetchFundamentalData("AAPL")).resolves.toEqual({
      source: "Yahoo Finance",
      overview: {
        EPS: 6.43,
        PERatio: 31.5,
        PriceToBookRatio: 12.1,
        ProfitMargin: 26.31,
        ReturnOnEquityTTM: 147.25,
      },
    });

    expect(String(fetchImpl.mock.calls[0][0])).toContain(
      "https://query2.finance.yahoo.com/v10/finance/quoteSummary/AAPL",
    );
  });

  it("uses the selected fundamentals provider before the default order", async () => {
    const cache = createCache();
    const apiTracker = createApiTracker();
    const fetchImpl = vi.fn<FetchMock>(async () =>
      Response.json([
        {
          currentRatioTTM: 1.2,
          debtEquityRatioTTM: 20,
          dividendYieldTTM: 0.01,
          netProfitMarginTTM: 0.25,
          operatingProfitMarginTTM: 0.3,
          peRatioTTM: 22,
          pegRatioTTM: 1.4,
          priceToBookRatioTTM: 4,
          returnOnEquityTTM: 0.35,
        },
      ]),
    );
    const manager = createDataSourceManager({
      apiTracker,
      cache,
      env: { FMP_API_KEY: "fmp-test-key" },
      fetchImpl,
      loadProviderPreferences: async () =>
        createProviderPreferences({
          fundamentals: {
            capability: "fundamentals",
            fallbackEnabled: true,
            provider: "fmp",
            updatedAt: null,
            updatedBy: null,
          },
        }),
    });

    await expect(manager.fetchFundamentalData("AAPL")).resolves.toMatchObject({
      source: "Financial Modeling Prep",
    });

    expect(String(fetchImpl.mock.calls[0][0])).toContain(
      "financialmodelingprep.com",
    );
  });

  it("returns deterministic service fallback when a source manager throws", async () => {
    const logger = { error: vi.fn() };
    const fallback = {
      ohlcv: [],
      source: "Mock Data",
      symbol: "MSFT",
      timeframe: "3M",
    };
    const manager = {
      fetchStockData: vi.fn(async () => {
        throw new Error("provider down");
      }),
      generateMockData: vi.fn(() => fallback),
    };
    const service = createDataService({
      dataSourceManager: manager,
      logger,
    });

    await expect(service.fetchStockData("MSFT", "3M")).resolves.toEqual(
      fallback,
    );

    expect(manager.generateMockData).toHaveBeenCalledWith("MSFT", "3M");
    expect(logger.error).toHaveBeenCalledWith(
      "Error fetching stock data:",
      expect.any(Error),
    );
  });
});
