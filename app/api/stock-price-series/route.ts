import { NextResponse } from "next/server";

import { parseAlphaVantageTimeSeries } from "@/lib/alphavantage/parse-time-series";
import {
  buildYahooChartUrl,
  parseYahooChartResponse,
} from "@/lib/market/yahoo-finance";
import {
  buildProviderOrder,
  getProviderPreferences,
  type ProviderId,
} from "@/lib/market/provider-preferences";
import { enforceRateLimit } from "@/lib/rate-limit";

const validateSymbol = (raw: string | null): string | null => {
  const s = raw?.trim() ?? "";
  if (!s || s.length > 32) {
    return null;
  }
  if (!/^[\w.:^-]+$/i.test(s)) {
    return null;
  }
  return s;
};

const validateInterval = (raw: string | null): "daily" | "monthly" | null => {
  const v = raw?.trim().toLowerCase() ?? "";
  if (v === "daily" || v === "monthly") {
    return v;
  }
  return null;
};

const alphaVantageFunctionForInterval = (interval: "daily" | "monthly") =>
  interval === "daily" ? "TIME_SERIES_DAILY" : "TIME_SERIES_MONTHLY";

const canUsePriceSeriesProvider = (provider: ProviderId): boolean => {
  if (provider === "yahooFinance") {
    return true;
  }
  if (provider === "alphaVantage") {
    return Boolean(
      process.env.ALPHA_VANTAGE_API_KEY &&
        !process.env.ALPHA_VANTAGE_API_KEY.includes("your-"),
    );
  }
  return false;
};

const fetchYahooSeries = async (
  symbol: string,
  interval: "daily" | "monthly",
) => {
  const url = buildYahooChartUrl(symbol, interval);
  const revalidate = interval === "daily" ? 120 : 3600;
  const upstream = await fetch(url, {
    next: { revalidate },
  });

  if (!upstream.ok) {
    const body = await upstream.text();
    throw new Error(`Yahoo Finance chart request failed: ${body}`);
  }

  const parsed = parseYahooChartResponse(await upstream.json());
  if (!parsed.ok) {
    throw new Error(parsed.error);
  }

  return parsed.series;
};

const fetchAlphaVantageSeries = async (
  symbol: string,
  interval: "daily" | "monthly",
) => {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    throw new Error("ALPHA_VANTAGE_API_KEY is not configured");
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    function: alphaVantageFunctionForInterval(interval),
    outputsize: interval === "daily" ? "compact" : "full",
    symbol,
  });
  const upstream = await fetch(`https://www.alphavantage.co/query?${params}`, {
    next: { revalidate: interval === "daily" ? 120 : 3600 },
  });

  if (!upstream.ok) {
    const body = await upstream.text();
    throw new Error(`Alpha Vantage time series request failed: ${body}`);
  }

  const parsed = parseAlphaVantageTimeSeries(await upstream.json());
  if (!parsed.ok) {
    throw new Error(parsed.error);
  }

  return parsed.series;
};

/** Proxies preferred daily or monthly chart series with fallback. */
export async function GET(request: Request) {
  const limited = enforceRateLimit(request);
  if (limited) {
    return limited;
  }

  const { searchParams } = new URL(request.url);
  const symbol = validateSymbol(searchParams.get("symbol"));
  const interval = validateInterval(searchParams.get("interval"));

  if (!symbol) {
    return NextResponse.json(
      { error: "Missing or invalid query parameter symbol" },
      { status: 400 },
    );
  }

  if (!interval) {
    return NextResponse.json(
      { error: "Missing or invalid query parameter interval (daily|monthly)" },
      { status: 400 },
    );
  }

  const preferences = await getProviderPreferences();
  const preference = preferences.stock_price_series;
  const providers = buildProviderOrder(
    "stock_price_series",
    preference.provider,
    preference.fallbackEnabled,
  ).filter(canUsePriceSeriesProvider);

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      const series =
        provider === "alphaVantage"
          ? await fetchAlphaVantageSeries(symbol, interval)
          : await fetchYahooSeries(symbol, interval);

      return NextResponse.json({ series });
    } catch (error) {
      errors.push(
        `${provider}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  console.warn("Stock price series providers failed", { errors });
  return NextResponse.json(
    { error: "All stock price series providers failed" },
    { status: 502 },
  );
}
