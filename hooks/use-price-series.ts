"use client";

import * as React from "react";

import { aggregateMonthlyToYearly } from "@/lib/market/aggregate-yearly";
import type { OhlcPoint } from "@/lib/market/yahoo-finance";

export type PriceHistoryTab = "daily" | "monthly" | "yearly";

export type PriceSeriesState = {
  daily: OhlcPoint[] | null;
  monthly: OhlcPoint[] | null;
  yearly: ReturnType<typeof aggregateMonthlyToYearly>;
  errorDaily: string | null;
  errorMonthly: string | null;
  isLoadingDaily: boolean;
  isLoadingMonthly: boolean;
};

const buildQuery = (symbol: string, interval: "daily" | "monthly"): string => {
  const params = new URLSearchParams({
    symbol: symbol.trim(),
    interval,
  });
  return params.toString();
};

type SeriesResponse = { series: OhlcPoint[] } | { error?: string };

/**
 * Loads daily and/or monthly OHLC from the app proxy. Monthly is shared for Monthly + Yearly tabs;
 * yearly bars are derived client-side from monthly data.
 *
 * Loading flags are intentionally omitted from effect dependency arrays: including them caused
 * abort -> finally clears loading -> effect re-runs -> endless requests (NS_BINDING_ABORTED).
 */
export const usePriceSeries = (
  symbol: string,
  activeTab: PriceHistoryTab,
): PriceSeriesState => {
  const [daily, setDaily] = React.useState<OhlcPoint[] | null>(null);
  const [monthly, setMonthly] = React.useState<OhlcPoint[] | null>(null);
  const [errorDaily, setErrorDaily] = React.useState<string | null>(null);
  const [errorMonthly, setErrorMonthly] = React.useState<string | null>(null);
  const [isLoadingDaily, setIsLoadingDaily] = React.useState(false);
  const [isLoadingMonthly, setIsLoadingMonthly] = React.useState(false);

  const trimmed = symbol.trim();

  const yearly = React.useMemo(
    () => (monthly ? aggregateMonthlyToYearly(monthly) : []),
    [monthly],
  );

  React.useEffect(() => {
    setDaily(null);
    setMonthly(null);
    setErrorDaily(null);
    setErrorMonthly(null);
    setIsLoadingDaily(false);
    setIsLoadingMonthly(false);
  }, [trimmed]);

  React.useEffect(() => {
    if (!trimmed) {
      return;
    }
    if (activeTab !== "daily") {
      return;
    }
    if (daily !== null) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setIsLoadingDaily(true);
    setErrorDaily(null);

    void (async () => {
      try {
        const res = await fetch(
          `/api/stock-price-series?${buildQuery(trimmed, "daily")}`,
          { signal: controller.signal },
        );
        const payload = (await res.json()) as SeriesResponse;

        if (cancelled) {
          return;
        }

        if (!res.ok) {
          const msg =
            "error" in payload && typeof payload.error === "string"
              ? payload.error
              : `Request failed (${res.status})`;
          throw new Error(msg);
        }

        if (!("series" in payload) || !Array.isArray(payload.series)) {
          throw new Error("Unexpected response shape");
        }

        setDaily(payload.series);
      } catch (e) {
        if (cancelled) {
          return;
        }
        if (e instanceof DOMException && e.name === "AbortError") {
          return;
        }
        setErrorDaily(
          e instanceof Error ? e.message : "Failed to load daily series",
        );
        setDaily(null);
      } finally {
        if (!cancelled) {
          setIsLoadingDaily(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      setIsLoadingDaily(false);
    };
  }, [trimmed, activeTab, daily]);

  React.useEffect(() => {
    if (!trimmed) {
      return;
    }
    if (activeTab === "daily") {
      return;
    }
    if (monthly !== null) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setIsLoadingMonthly(true);
    setErrorMonthly(null);

    void (async () => {
      try {
        const res = await fetch(
          `/api/stock-price-series?${buildQuery(trimmed, "monthly")}`,
          { signal: controller.signal },
        );
        const payload = (await res.json()) as SeriesResponse;

        if (cancelled) {
          return;
        }

        if (!res.ok) {
          const msg =
            "error" in payload && typeof payload.error === "string"
              ? payload.error
              : `Request failed (${res.status})`;
          throw new Error(msg);
        }

        if (!("series" in payload) || !Array.isArray(payload.series)) {
          throw new Error("Unexpected response shape");
        }

        setMonthly(payload.series);
      } catch (e) {
        if (cancelled) {
          return;
        }
        if (e instanceof DOMException && e.name === "AbortError") {
          return;
        }
        setErrorMonthly(
          e instanceof Error ? e.message : "Failed to load monthly series",
        );
        setMonthly(null);
      } finally {
        if (!cancelled) {
          setIsLoadingMonthly(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      setIsLoadingMonthly(false);
    };
  }, [trimmed, activeTab, monthly]);

  return {
    daily,
    monthly,
    yearly,
    errorDaily,
    errorMonthly,
    isLoadingDaily,
    isLoadingMonthly,
  };
};
