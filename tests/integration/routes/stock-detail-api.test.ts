import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getQuote } from "@/app/api/quote/route";
import { GET as getStockMetric } from "@/app/api/stock-metric/route";
import { GET as getStockPeers } from "@/app/api/stock-peers/route";
import { GET as getStockPriceSeries } from "@/app/api/stock-price-series/route";
import { GET as getStockRecommendation } from "@/app/api/stock-recommendation/route";

type RouteHandler = (request: Request) => Promise<Response>;
type MockedFetch = (
  input: RequestInfo | URL,
  init?: unknown,
) => Promise<Response>;

const originalEnv = { ...process.env };

const requestFor = (path: string) => new Request(`http://localhost${path}`);

const mockFetchJson = (payload: unknown, init?: ResponseInit) => {
  const fetchMock = vi.fn<MockedFetch>(async () =>
    Response.json(payload, init),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const getFirstFetchUrl = (fetchMock: ReturnType<typeof mockFetchJson>): URL => {
  const firstCall = fetchMock.mock.calls.at(0);
  if (!firstCall) {
    throw new Error("Expected fetch to have been called");
  }

  return new URL(String(firstCall[0]));
};

const finnhubRoutes: Array<{
  handler: RouteHandler;
  name: string;
  path: string;
  revalidate: number;
}> = [
  {
    handler: getQuote,
    name: "quote",
    path: "/api/quote?symbol=AAPL",
    revalidate: 30,
  },
  {
    handler: getStockMetric,
    name: "stock metric",
    path: "/api/stock-metric?symbol=AAPL",
    revalidate: 300,
  },
  {
    handler: getStockPeers,
    name: "stock peers",
    path: "/api/stock-peers?symbol=AAPL",
    revalidate: 3600,
  },
  {
    handler: getStockRecommendation,
    name: "stock recommendation",
    path: "/api/stock-recommendation?symbol=AAPL",
    revalidate: 3600,
  },
];

describe("stock detail API routes", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    process.env = {
      ...originalEnv,
      ALPHA_VANTAGE_API_KEY: "alpha-test-key",
      FINNHUB_API_KEY: "finnhub-test-key",
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it.each(finnhubRoutes)(
    "rejects invalid symbols before calling Finnhub for $name",
    async ({ handler, path }) => {
      const fetchMock = mockFetchJson({});
      const response = await handler(
        requestFor(path.replace("symbol=AAPL", "symbol=bad symbol")),
      );

      await expect(response.json()).resolves.toEqual({
        error: "Missing or invalid query parameter symbol",
      });
      expect(response.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each(finnhubRoutes)(
    "proxies $name requests to Finnhub with the server token",
    async ({ handler, path, revalidate }) => {
      const payload = { ok: true };
      const fetchMock = mockFetchJson(payload);

      const response = await handler(requestFor(path));

      await expect(response.json()).resolves.toEqual(payload);
      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("https://finnhub.io/api/v1/"),
        { next: { revalidate } },
      );

      const url = getFirstFetchUrl(fetchMock);
      expect(url.searchParams.get("symbol")).toBe("AAPL");
      expect(url.searchParams.get("token")).toBe("finnhub-test-key");
    },
  );

  it("adds the all-metrics flag for the basic financials route", async () => {
    const fetchMock = mockFetchJson({ metric: {} });

    await getStockMetric(requestFor("/api/stock-metric?symbol=AAPL"));

    const url = getFirstFetchUrl(fetchMock);
    expect(url.searchParams.get("metric")).toBe("all");
  });

  it("normalizes Yahoo Finance daily price series for stock detail charts", async () => {
    const fetchMock = mockFetchJson({
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
    });

    const response = await getStockPriceSeries(
      requestFor("/api/stock-price-series?symbol=AAPL&interval=daily"),
    );

    await expect(response.json()).resolves.toEqual({
      series: [
        {
          close: 104.25,
          date: "2026-04-24",
          high: 105,
          low: 99.5,
          open: 100,
          volume: 123456,
        },
      ],
    });
    expect(response.status).toBe(200);

    const url = getFirstFetchUrl(fetchMock);
    expect(url.origin).toBe("https://query1.finance.yahoo.com");
    expect(url.pathname).toBe("/v8/finance/chart/AAPL");
    expect(url.searchParams.get("range")).toBe("3mo");
    expect(url.searchParams.get("interval")).toBe("1d");
  });

  it("uses Yahoo monthly chart settings for monthly price series", async () => {
    const fetchMock = mockFetchJson({
      chart: {
        result: [
          {
            timestamp: [1767225600],
            indicators: {
              quote: [
                {
                  close: [250],
                  high: [260],
                  low: [240],
                  open: [245],
                  volume: [999999],
                },
              ],
            },
          },
        ],
      },
    });

    const response = await getStockPriceSeries(
      requestFor("/api/stock-price-series?symbol=AAPL&interval=monthly"),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.series).toHaveLength(1);

    const url = getFirstFetchUrl(fetchMock);
    expect(url.searchParams.get("range")).toBe("max");
    expect(url.searchParams.get("interval")).toBe("1mo");
  });

  it("rejects invalid price-series intervals before calling Yahoo Finance", async () => {
    const fetchMock = mockFetchJson({});

    const response = await getStockPriceSeries(
      requestFor("/api/stock-price-series?symbol=AAPL&interval=weekly"),
    );

    await expect(response.json()).resolves.toEqual({
      error: "Missing or invalid query parameter interval (daily|monthly)",
    });
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
