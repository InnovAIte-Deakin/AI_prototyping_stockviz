// @vitest-environment happy-dom

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useSymbolSearch } from "@/hooks/use-symbol-search";

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

describe("useSymbolSearch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("skips fetches below the minimum query length", () => {
    const fetchMock = mockFetchJson({ result: [] });

    const { result } = renderHook(() => useSymbolSearch({ query: "A" }));

    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads debounced symbol results", async () => {
    const fetchMock = mockFetchJson({
      count: 1,
      result: [{ description: "Apple Inc.", symbol: "AAPL" }],
    });

    const { result } = renderHook(() =>
      useSymbolSearch({ debounceMs: 0, exchange: "US", query: "AAPL" }),
    );

    await waitFor(() =>
      expect(result.current.results).toEqual([
        { description: "Apple Inc.", symbol: "AAPL" },
      ]),
    );
    expect(result.current.count).toBe(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/symbol-search?q=AAPL&exchange=US",
      { signal: expect.any(AbortSignal) },
    );
  });

  it("aborts pending searches when the query changes", async () => {
    let signal: AbortSignal | null | undefined;
    const fetchMock = vi.fn<MockedFetch>(
      (_input, init) =>
        new Promise<Response>(() => {
          signal = init?.signal;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { rerender } = renderHook(
      ({ query }) => useSymbolSearch({ debounceMs: 0, query }),
      { initialProps: { query: "AAPL" } },
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    rerender({ query: "A" });

    expect(signal?.aborted).toBe(true);
  });
});
