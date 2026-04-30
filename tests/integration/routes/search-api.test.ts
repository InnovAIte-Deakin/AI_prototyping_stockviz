import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import runtime from "@/lib/analysis/runtime";
import { GET as getSearch } from "@/app/api/search/route";
import { resetRateLimitForTests } from "@/lib/rate-limit";

vi.mock("@/lib/analysis/runtime", () => ({
  default: {
    searchService: {
      searchSymbols: vi.fn(),
    },
  },
}));

const mockedSearchSymbols = vi.mocked(runtime.searchService.searchSymbols);

const requestFor = (path: string, ip = "203.0.113.22") =>
  new NextRequest(new URL(path, "http://localhost"), {
    headers: { "x-forwarded-for": ip },
  });

describe("search API route", () => {
  beforeEach(() => {
    resetRateLimitForTests();
    mockedSearchSymbols.mockResolvedValue({
      query: "AAPL",
      results: [{ name: "Apple Inc.", symbol: "AAPL" }],
      source: "test",
      status: "success",
    });
  });

  afterEach(() => {
    resetRateLimitForTests();
    vi.clearAllMocks();
  });

  it("returns normalized search service results", async () => {
    const response = await getSearch(requestFor("/api/search?query=AAPL"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      query: "AAPL",
      results: [{ name: "Apple Inc.", symbol: "AAPL" }],
      source: "test",
      status: "success",
    });
    expect(mockedSearchSymbols).toHaveBeenCalledWith("AAPL");
  });

  it("maps search service errors to 400 responses", async () => {
    mockedSearchSymbols.mockResolvedValueOnce({
      message: "Query must not be empty",
      results: [],
      status: "error",
    });

    const response = await getSearch(requestFor("/api/search?query="));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Query must not be empty",
      results: [],
      status: "error",
    });
  });
});
