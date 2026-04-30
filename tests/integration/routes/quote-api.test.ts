import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getQuote } from "@/app/api/quote/route";
import { resetRateLimitForTests } from "@/lib/rate-limit";

type MockedFetch = (
  input: RequestInfo | URL,
  init?: unknown,
) => Promise<Response>;

const originalEnv = { ...process.env };

const requestFor = (path: string, ip = "203.0.113.20") =>
  new Request(`http://localhost${path}`, {
    headers: { "x-forwarded-for": ip },
  });

const mockFetchJson = (payload: unknown, init?: ResponseInit) => {
  const fetchMock = vi.fn<MockedFetch>(async () =>
    Response.json(payload, init),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("quote API route", () => {
  beforeEach(() => {
    resetRateLimitForTests();
    vi.unstubAllGlobals();
    process.env = { ...originalEnv, FINNHUB_API_KEY: "finnhub-test-key" };
  });

  afterEach(() => {
    resetRateLimitForTests();
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it("returns missing-key errors before calling Finnhub", async () => {
    delete process.env.FINNHUB_API_KEY;
    const fetchMock = mockFetchJson({});

    const response = await getQuote(requestFor("/api/quote?symbol=AAPL"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "FINNHUB_API_KEY is not configured",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects bad symbols before calling Finnhub", async () => {
    const fetchMock = mockFetchJson({});

    const response = await getQuote(requestFor("/api/quote?symbol=bad symbol"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing or invalid query parameter symbol",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 429 for the request over the per-IP limit", async () => {
    mockFetchJson({ c: 100 });

    for (let i = 0; i < 60; i += 1) {
      const response = await getQuote(requestFor("/api/quote?symbol=AAPL"));
      expect(response.status).toBe(200);
    }

    const response = await getQuote(requestFor("/api/quote?symbol=AAPL"));

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    await expect(response.json()).resolves.toEqual({
      error: "Too many requests",
    });
  });
});
