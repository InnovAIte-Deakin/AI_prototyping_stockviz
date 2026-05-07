import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getMarketStatus } from "@/app/api/market-status/route";
import { resetRateLimitForTests } from "@/lib/rate-limit";

type RouteHandler = (request: Request) => Promise<Response>;
type MockedFetch = (
  input: RequestInfo | URL,
  init?: unknown,
) => Promise<Response>;

const originalEnv = { ...process.env };
const getMarketStatusRoute = getMarketStatus as RouteHandler;

const requestFor = () =>
  new Request("http://localhost/api/market-status", {
    headers: { "x-forwarded-for": "203.0.113.21" },
  });

const mockFetchJson = (payload: unknown, init?: ResponseInit) => {
  const fetchMock = vi.fn<MockedFetch>(async () =>
    Response.json(payload, init),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("market status API route", () => {
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

    const response = await getMarketStatusRoute(requestFor());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "FINNHUB_API_KEY is not configured",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("proxies US market status requests with the server token", async () => {
    const fetchMock = mockFetchJson({ isOpen: true });

    const response = await getMarketStatusRoute(requestFor());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ isOpen: true });

    const firstCall = fetchMock.mock.calls.at(0);
    if (!firstCall) {
      throw new Error("Expected fetch to have been called");
    }

    const url = new URL(String(firstCall[0]));
    expect(url.searchParams.get("exchange")).toBe("US");
    expect(url.searchParams.get("token")).toBe("finnhub-test-key");
  });

  it("does not expose upstream error details to clients", async () => {
    mockFetchJson({ token: "secret-upstream-body" }, { status: 502 });

    const response = await getMarketStatusRoute(requestFor());

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body).toMatchObject({ error: expect.any(String) });
    expect(body).not.toHaveProperty("details");
  });
});
