// @vitest-environment happy-dom

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  useFinnhubPeers,
  useFinnhubQuote,
} from "@/hooks/use-finnhub-stock-data";

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

describe("useFinnhub stock data hooks", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("skips quote fetches for empty symbols", () => {
    const fetchMock = mockFetchJson({});

    const { result } = renderHook(() => useFinnhubQuote("   "));

    expect(result.current).toEqual({
      data: null,
      error: null,
      isLoading: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads quote data for a symbol", async () => {
    const fetchMock = mockFetchJson({ c: 195.12 });

    const { result } = renderHook(() => useFinnhubQuote(" AAPL "));

    await waitFor(() => expect(result.current.data).toEqual({ c: 195.12 }));
    expect(result.current.error).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith("/api/quote?symbol=AAPL", {
      signal: expect.any(AbortSignal),
    });
  });

  it("surfaces API errors", async () => {
    mockFetchJson({ error: "Missing key" }, { status: 503 });

    const { result } = renderHook(() => useFinnhubQuote("AAPL"));

    await waitFor(() => expect(result.current.error).toBe("Missing key"));
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("validates peers response shape", async () => {
    mockFetchJson({ result: [] });

    const { result } = renderHook(() => useFinnhubPeers("AAPL"));

    await waitFor(() =>
      expect(result.current.error).toBe("Invalid peers response"),
    );
  });

  it("aborts in-flight quote fetches when the symbol changes", async () => {
    let signal: AbortSignal | null | undefined;
    const fetchMock = vi.fn<MockedFetch>(
      (_input, init) =>
        new Promise<Response>(() => {
          signal = init?.signal;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { rerender } = renderHook(
      ({ symbol }) => useFinnhubQuote(symbol),
      { initialProps: { symbol: "AAPL" } },
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    rerender({ symbol: "" });

    expect(signal?.aborted).toBe(true);
  });
});
