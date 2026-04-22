"use client";

import * as React from "react";

import type { FinnhubSymbolLookupInfo } from "@/lib/types";

export type UseSymbolSearchOptions = {
  /** Current search text (e.g. controlled input value). */
  query: string;
  /** Optional exchange filter (e.g. `US`). */
  exchange?: string;
  /**
   * Minimum trimmed length before calling the API. Default `2` to limit requests.
   */
  minQueryLength?: number;
  /** Debounce delay in ms before requesting. Default `300`. */
  debounceMs?: number;
};

export type UseSymbolSearchResult = {
  results: FinnhubSymbolLookupInfo[];
  count: number | null;
  error: string | null;
  isLoading: boolean;
};

const buildQuery = (q: string, exchange?: string): string => {
  const params = new URLSearchParams({ q });
  if (exchange) {
    params.set("exchange", exchange);
  }
  return params.toString();
};

/**
 * Debounced Finnhub symbol lookup via `/api/symbol-search` (`GET /search`).
 * Requires `FINNHUB_API_KEY` on the server.
 */
export const useSymbolSearch = (
  options: UseSymbolSearchOptions,
): UseSymbolSearchResult => {
  const { query, exchange, minQueryLength = 2, debounceMs = 300 } = options;

  const [results, setResults] = React.useState<FinnhubSymbolLookupInfo[]>([]);
  const [count, setCount] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < minQueryLength) {
      setResults([]);
      setCount(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let aborted = false;
    let fetchController: AbortController | null = null;

    const timerId = window.setTimeout(() => {
      fetchController = new AbortController();
      void (async () => {
        setIsLoading(true);
        setError(null);
        try {
          const qs = buildQuery(trimmed, exchange);
          const res = await fetch(`/api/symbol-search?${qs}`, {
            signal: fetchController!.signal,
          });
          const payload = (await res.json()) as
            | { count?: number; result?: FinnhubSymbolLookupInfo[] }
            | { error?: string };

          if (aborted) {
            return;
          }

          if (!res.ok) {
            const msg =
              "error" in payload && typeof payload.error === "string"
                ? payload.error
                : `Request failed (${res.status})`;
            throw new Error(msg);
          }

          if (!("result" in payload) || !Array.isArray(payload.result)) {
            throw new Error("Invalid symbol search response");
          }

          setResults(payload.result);
          setCount(
            typeof payload.count === "number"
              ? payload.count
              : payload.result.length,
          );
        } catch (e) {
          if (aborted) {
            return;
          }
          if (e instanceof DOMException && e.name === "AbortError") {
            return;
          }
          setError(e instanceof Error ? e.message : "Failed to search symbols");
          setResults([]);
          setCount(null);
        } finally {
          if (!aborted) {
            setIsLoading(false);
          }
        }
      })();
    }, debounceMs);

    return () => {
      aborted = true;
      window.clearTimeout(timerId);
      fetchController?.abort();
    };
  }, [query, exchange, minQueryLength, debounceMs]);

  return { results, count, error, isLoading };
};
