// @vitest-environment happy-dom

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { usePriceSeries } from "@/hooks/use-price-series";

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

describe("usePriceSeries", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads daily price series from the stock-price-series API", async () => {
    const fetchMock = mockFetchJson({
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

    const { result } = renderHook(() => usePriceSeries(" AAPL ", "daily"));

    await waitFor(() => expect(result.current.daily).toHaveLength(1));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/stock-price-series?symbol=AAPL&interval=daily",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(result.current.errorDaily).toBeNull();
    expect(result.current.isLoadingDaily).toBe(false);
  });

  it("derives yearly bars from monthly price series", async () => {
    mockFetchJson({
      series: [
        {
          close: 110,
          date: "2025-01-31",
          high: 112,
          low: 98,
          open: 100,
          volume: 10,
        },
        {
          close: 130,
          date: "2025-12-31",
          high: 135,
          low: 120,
          open: 125,
          volume: 20,
        },
      ],
    });

    const { result } = renderHook(() => usePriceSeries("AAPL", "yearly"));

    await waitFor(() =>
      expect(result.current.yearly).toEqual([
        {
          close: 130,
          high: 135,
          low: 98,
          open: 100,
          volume: 30,
          year: "2025",
        },
      ]),
    );
  });
});
