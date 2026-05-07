"use client";

import * as React from "react";

import type { FinnhubSymbolLookupInfo, SearchResultItem } from "@/lib/types";

export type UseSymbolSearchOptions = {
  /** Current search text (e.g. controlled input value). */
  query: string;
  /** Retained for compatibility; provider-backed search currently ignores exchange filters. */
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

const buildQuery = (query: string): string =>
  new URLSearchParams({ query }).toString();

const toLookupResult = (item: SearchResultItem): FinnhubSymbolLookupInfo => ({
  description: item.name,
  displaySymbol: item.symbol,
  symbol: item.symbol,
  type: item.type,
});

/**
 * Debounced symbol lookup via `/api/search`, backed by the active provider
 * preferences and Yahoo Finance by default.
 */
export const useSymbolSearch = (
  options: UseSymbolSearchOptions,
): UseSymbolSearchResult => {
  const { query, minQueryLength = 2, debounceMs = 300 } = options;

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
          const qs = buildQuery(trimmed);
          const res = await fetch(`/api/search?${qs}`, {
            signal: fetchController!.signal,
          });
          const payload = (await res.json()) as
            | {
                message?: string;
                results?: SearchResultItem[];
                status?: string;
              }
            | { error?: string };

          if (aborted) {
            return;
          }

          if (!res.ok) {
            const msg =
              "error" in payload && typeof payload.error === "string"
                ? payload.error
                : "message" in payload && typeof payload.message === "string"
                  ? payload.message
                : `Request failed (${res.status})`;
            throw new Error(msg);
          }

          if (!("results" in payload) || !Array.isArray(payload.results)) {
            throw new Error("Invalid symbol search response");
          }

          setResults(payload.results.map(toLookupResult));
          setCount(payload.results.length);
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
  }, [query, minQueryLength, debounceMs]);

  return { results, count, error, isLoading };
};
