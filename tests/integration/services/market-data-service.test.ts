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
