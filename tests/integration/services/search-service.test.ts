import { beforeEach, describe, expect, it, vi } from "vitest";

import dataSourceManagerModule from "@/lib/market/data-source-manager.js";
import searchServiceModule from "@/lib/market/search-service.js";

const { createDataSourceManager } = dataSourceManagerModule;
const { createSearchService } = searchServiceModule;

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

describe("search service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects blank queries before calling the data source manager", async () => {
    const manager = {
      searchSymbols: vi.fn(),
    };
    const service = createSearchService({ dataSourceManager: manager });

    await expect(service.searchSymbols("   ")).resolves.toEqual({
      message: "Query parameter is required and must be at least 1 character",
      results: [],
      status: "error",
    });
    expect(manager.searchSymbols).not.toHaveBeenCalled();
  });

  it("trims queries and normalizes Finnhub search results", async () => {
    const cache = createCache();
    const apiTracker = createApiTracker();
    const fetchImpl = vi.fn<FetchMock>(async () =>
      Response.json({
        result: [
          {
            description: "Apple Inc",
            symbol: "AAPL",
            type: "Common Stock",
          },
        ],
      }),
    );
    const manager = createDataSourceManager({
      apiTracker,
      cache,
      env: { FINNHUB_API_KEY: "finnhub-test-key" },
      fetchImpl,
    });
    manager.priorityOrder.search = ["finnhub"];
    const service = createSearchService({ dataSourceManager: manager });

    await expect(service.searchSymbols(" apple ")).resolves.toEqual({
      query: "apple",
      results: [
        {
          name: "Apple Inc",
          region: "Common Stock",
          symbol: "AAPL",
          type: "Common Stock",
        },
      ],
      source: "Finnhub",
      status: "success",
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("https://finnhub.io/api/v1/search"),
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(String(fetchImpl.mock.calls[0][0])).toContain("q=apple");
    expect(String(fetchImpl.mock.calls[0][0])).toContain(
      "token=finnhub-test-key",
    );
    expect(cache.setAsync).toHaveBeenCalledWith(
      "search_apple",
      expect.objectContaining({ source: "Finnhub" }),
      60 * 60 * 1000,
    );
    expect(apiTracker.logAPICall).toHaveBeenCalledWith(
      "Finnhub",
      "SEARCH",
      "apple",
      null,
      true,
      expect.any(Number),
    );
  });

  it("uses Yahoo Finance as the primary symbol search provider", async () => {
    const cache = createCache();
    const apiTracker = createApiTracker();
    const fetchImpl = vi.fn<FetchMock>(async () =>
      Response.json({
        quotes: [
          {
            exchDisp: "NASDAQ",
            longname: "Apple Inc.",
            quoteType: "EQUITY",
            symbol: "AAPL",
          },
        ],
      }),
    );
    const manager = createDataSourceManager({
      apiTracker,
      cache,
      env: {},
      fetchImpl,
    });
    const service = createSearchService({ dataSourceManager: manager });

    await expect(service.searchSymbols(" apple ")).resolves.toEqual({
      query: "apple",
      results: [
        {
          name: "Apple Inc.",
          region: "NASDAQ",
          symbol: "AAPL",
          type: "EQUITY",
        },
      ],
      source: "Yahoo Finance",
      status: "success",
    });

    expect(String(fetchImpl.mock.calls[0][0])).toContain(
      "https://query2.finance.yahoo.com/v1/finance/search",
    );
  });

  it("falls through to Finnhub when Yahoo search fails and Finnhub is configured", async () => {
    const cache = createCache();
    const apiTracker = createApiTracker();
    const fetchImpl = vi
      .fn<FetchMock>()
      .mockRejectedValueOnce(new Error("Yahoo unavailable"))
      .mockResolvedValueOnce(
        Response.json({
          result: [
            {
              description: "Apple Inc",
              symbol: "AAPL",
              type: "Common Stock",
            },
          ],
        }),
      );
    const manager = createDataSourceManager({
      apiTracker,
      cache,
      env: { FINNHUB_API_KEY: "finnhub-test-key" },
      fetchImpl,
    });
    const service = createSearchService({ dataSourceManager: manager });

    await expect(service.searchSymbols("apple")).resolves.toMatchObject({
      source: "Finnhub",
      status: "success",
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(String(fetchImpl.mock.calls[0][0])).toContain(
      "query2.finance.yahoo.com",
    );
    expect(String(fetchImpl.mock.calls[1][0])).toContain("finnhub.io");
  });

  it("falls back to curated symbols when provider search fails", async () => {
    const logger = { error: vi.fn() };
    const manager = {
      generateFallbackSearchResults: vi.fn(() => [
        {
          name: "Apple Inc.",
          region: "United States",
          symbol: "AAPL",
          type: "Equity",
        },
      ]),
      searchSymbols: vi.fn(async () => {
        throw new Error("search unavailable");
      }),
    };
    const service = createSearchService({
      dataSourceManager: manager,
      logger,
    });

    await expect(service.searchSymbols("AAPL")).resolves.toEqual({
      query: "AAPL",
      results: [
        {
          name: "Apple Inc.",
          region: "United States",
          symbol: "AAPL",
          type: "Equity",
        },
      ],
      source: "fallback",
      status: "success",
    });

    expect(manager.generateFallbackSearchResults).toHaveBeenCalledWith("AAPL");
    expect(logger.error).toHaveBeenCalledWith(
      "Search error:",
      expect.any(Error),
    );
  });
});
