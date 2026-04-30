// @vitest-environment happy-dom

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useMarketNews } from "@/hooks/use-market-news";

type MockedFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

const mockFetchJson = (payload: unknown, init?: ResponseInit) => {
  const fetchMock = vi.fn<MockedFetch>(async () =>
    Response.json(payload, init),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("useMarketNews", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads market news with the expected query string", async () => {
    const fetchMock = mockFetchJson([{ headline: "Market opens higher" }]);

    const { result } = renderHook(() =>
      useMarketNews({ category: "general", limit: 1, minId: 10 }),
    );

    await waitFor(() =>
      expect(result.current.items).toEqual([
        { headline: "Market opens higher" },
      ]),
    );
    expect(result.current.error).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/market-news?category=general&minId=10&limit=1",
    );
  });

  it("surfaces market news API errors", async () => {
    mockFetchJson({ error: "Missing key" }, { status: 503 });

    const { result } = renderHook(() =>
      useMarketNews({ category: "general" }),
    );

    await waitFor(() => expect(result.current.error).toBe("Missing key"));
    expect(result.current.items).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
