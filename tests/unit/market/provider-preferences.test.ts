import { describe, expect, it } from "vitest";

import {
  buildProviderOrder,
  DEFAULT_PROVIDER_PREFERENCES,
  normalizeProviderPreferenceRows,
  PROVIDER_CAPABILITY_OPTIONS,
} from "@/lib/market/provider-preferences";

describe("provider preferences", () => {
  it("defines supported providers for each capability", () => {
    expect(PROVIDER_CAPABILITY_OPTIONS.stock_ohlcv.map((p) => p.id)).toEqual([
      "yahooFinance",
      "twelveData",
      "polygon",
      "alphaVantage",
    ]);
    expect(
      PROVIDER_CAPABILITY_OPTIONS.stock_price_series.map((p) => p.id),
    ).toEqual(["yahooFinance", "alphaVantage"]);
    expect(PROVIDER_CAPABILITY_OPTIONS.fundamentals.map((p) => p.id)).toEqual([
      "yahooFinance",
      "fmp",
      "finnhub",
      "alphaVantage",
    ]);
    expect(PROVIDER_CAPABILITY_OPTIONS.symbol_search.map((p) => p.id)).toEqual([
      "yahooFinance",
      "finnhub",
      "twelveData",
      "alphaVantage",
    ]);
    expect(PROVIDER_CAPABILITY_OPTIONS.sentiment_news.map((p) => p.id)).toEqual([
      "alphaVantage",
    ]);
  });

  it("moves the selected provider to the front while preserving fallback order", () => {
    expect(buildProviderOrder("stock_ohlcv", "twelveData", true)).toEqual([
      "twelveData",
      "yahooFinance",
      "polygon",
      "alphaVantage",
    ]);
  });

  it("uses only the selected provider when fallback is disabled", () => {
    expect(buildProviderOrder("fundamentals", "fmp", false)).toEqual(["fmp"]);
  });

  it("falls back to defaults when a stored provider is invalid for the capability", () => {
    expect(buildProviderOrder("stock_price_series", "fmp", true)).toEqual([
      "yahooFinance",
      "alphaVantage",
    ]);
  });

  it("prefers Alpha Vantage over Yahoo Finance for fundamentals by default", () => {
    expect(DEFAULT_PROVIDER_PREFERENCES.fundamentals.provider).toBe(
      "alphaVantage",
    );
    expect(buildProviderOrder("fundamentals", "", true)).toEqual([
      "alphaVantage",
      "yahooFinance",
      "fmp",
      "finnhub",
    ]);
  });

  it("normalizes database rows over defaults", () => {
    const normalized = normalizeProviderPreferenceRows([
      {
        capability: "stock_ohlcv",
        fallback_enabled: true,
        provider: "twelveData",
        updated_at: "2026-05-05T00:00:00.000Z",
        updated_by: "user-1",
      },
      {
        capability: "stock_price_series",
        fallback_enabled: true,
        provider: "fmp",
        updated_at: "2026-05-05T00:00:00.000Z",
        updated_by: null,
      },
    ]);

    expect(normalized.stock_ohlcv.provider).toBe("twelveData");
    expect(normalized.stock_ohlcv.updatedBy).toBe("user-1");
    expect(normalized.stock_price_series).toEqual(
      DEFAULT_PROVIDER_PREFERENCES.stock_price_series,
    );
    expect(normalized.sentiment_news.provider).toBe("alphaVantage");
  });
});
