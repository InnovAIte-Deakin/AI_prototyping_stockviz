"use client";

import { useApiFetch, type AsyncState } from "@/hooks/use-api-fetch";
import type {
  FinnhubPeersResponse,
  FinnhubQuote,
  FinnhubRecommendationTrend,
  FinnhubStockMetricResponse,
} from "@/lib/types";

export type { AsyncState };

const buildSymbolQuery = (symbol: string): string => {
  const params = new URLSearchParams({ symbol: symbol.trim() });
  return params.toString();
};

const buildSymbolUrl = (path: string, symbol: string): string | null => {
  const trimmed = symbol.trim();
  return trimmed ? `${path}?${buildSymbolQuery(trimmed)}` : null;
};

const isStringArray = (payload: unknown): payload is string[] =>
  Array.isArray(payload) && payload.every((item) => typeof item === "string");

const isRecommendationTrendArray = (
  payload: unknown,
): payload is FinnhubRecommendationTrend[] => Array.isArray(payload);

export const useFinnhubQuote = (symbol: string): AsyncState<FinnhubQuote> => {
  return useApiFetch<FinnhubQuote>({
    errorMessage: "Failed to load quote",
    url: buildSymbolUrl("/api/quote", symbol),
  });
};

export const useFinnhubMetric = (
  symbol: string,
): AsyncState<FinnhubStockMetricResponse> => {
  return useApiFetch<FinnhubStockMetricResponse>({
    errorMessage: "Failed to load metrics",
    url: buildSymbolUrl("/api/stock-metric", symbol),
  });
};

export const useFinnhubPeers = (
  symbol: string,
): AsyncState<FinnhubPeersResponse> => {
  return useApiFetch<FinnhubPeersResponse>({
    errorMessage: "Failed to load peers",
    invalidMessage: "Invalid peers response",
    url: buildSymbolUrl("/api/stock-peers", symbol),
    validate: isStringArray,
  });
};

export const useFinnhubRecommendation = (
  symbol: string,
): AsyncState<FinnhubRecommendationTrend[]> => {
  return useApiFetch<FinnhubRecommendationTrend[]>({
    errorMessage: "Failed to load recommendations",
    invalidMessage: "Invalid recommendation response",
    url: buildSymbolUrl("/api/stock-recommendation", symbol),
    validate: isRecommendationTrendArray,
  });
};
