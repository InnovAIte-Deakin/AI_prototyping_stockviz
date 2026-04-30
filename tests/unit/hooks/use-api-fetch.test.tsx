// @vitest-environment happy-dom

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useApiFetch } from "@/hooks/use-api-fetch";

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

describe("useApiFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("skips fetches when the URL is null", () => {
    const fetchMock = mockFetchJson({ ok: true });

    const { result } = renderHook(() =>
      useApiFetch<{ ok: boolean }>({
        errorMessage: "Failed",
        url: null,
      }),
    );

    expect(result.current).toEqual({
      data: null,
      error: null,
      isLoading: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads successful JSON responses", async () => {
    mockFetchJson({ ok: true });

    const { result } = renderHook(() =>
      useApiFetch<{ ok: boolean }>({
        errorMessage: "Failed",
        url: "/api/example",
      }),
    );

    await waitFor(() => expect(result.current.data).toEqual({ ok: true }));
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("aborts in-flight fetches when unmounted", async () => {
    let signal: AbortSignal | null | undefined;
    const fetchMock = vi.fn<MockedFetch>(
      (_input, init) =>
        new Promise<Response>(() => {
          signal = init?.signal;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = renderHook(() =>
      useApiFetch({
        errorMessage: "Failed",
        url: "/api/example",
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    unmount();

    expect(signal?.aborted).toBe(true);
  });
});
