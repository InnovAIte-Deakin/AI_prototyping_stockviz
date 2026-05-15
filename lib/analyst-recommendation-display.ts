import type { ChartConfig } from "@/components/ui/chart";
import type { FinnhubRecommendationTrend } from "@/lib/types";

export const RECOMMENDATION_STACK_KEYS = [
  "strongBuy",
  "buy",
  "hold",
  "sell",
  "strongSell",
] as const;

export type RecommendationStackKey =
  (typeof RECOMMENDATION_STACK_KEYS)[number];

export const RECOMMENDATION_CHART_CONFIG = {
  buy: {
    label: "Buy",
    theme: {
      dark: "oklch(0.64 0.12 158)",
      light: "oklch(0.48 0.14 155)",
    },
  },
  hold: {
    label: "Hold",
    theme: {
      dark: "oklch(0.72 0.07 85)",
      light: "oklch(0.52 0.08 85)",
    },
  },
  sell: {
    label: "Sell",
    theme: {
      dark: "oklch(0.68 0.15 35)",
      light: "oklch(0.52 0.18 35)",
    },
  },
  strongBuy: {
    label: "Strong buy",
    theme: {
      dark: "oklch(0.72 0.14 158)",
      light: "oklch(0.4 0.17 155)",
    },
  },
  strongSell: {
    label: "Strong sell",
    theme: {
      dark: "oklch(0.62 0.17 25)",
      light: "oklch(0.45 0.2 25)",
    },
  },
} satisfies ChartConfig;

export const parseRecommendationPeriodMs = (
  period: string | undefined,
): number => {
  if (!period?.trim()) return Number.NaN;

  const trimmed = period.trim();
  const direct = Date.parse(trimmed);
  if (!Number.isNaN(direct)) return direct;

  const yyyyMmDd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (yyyyMmDd) {
    return new Date(
      Number(yyyyMmDd[1]),
      Number(yyyyMmDd[2]) - 1,
      Number(yyyyMmDd[3]),
    ).getTime();
  }

  const yyyyMm = /^(\d{4})-(\d{2})$/.exec(trimmed);
  if (yyyyMm) {
    return new Date(Number(yyyyMm[1]), Number(yyyyMm[2]) - 1, 1).getTime();
  }

  const quarter = /^(\d{4})-Q([1-4])$/i.exec(trimmed);
  if (quarter) {
    return new Date(
      Number(quarter[1]),
      (Number(quarter[2]) - 1) * 3,
      1,
    ).getTime();
  }

  return Number.NaN;
};

export const sortRecommendationsChronologically = (
  rows: FinnhubRecommendationTrend[],
): FinnhubRecommendationTrend[] => {
  const copy = [...rows];

  copy.sort((a, b) => {
    const aTime = parseRecommendationPeriodMs(a.period);
    const bTime = parseRecommendationPeriodMs(b.period);

    if (!Number.isNaN(aTime) && !Number.isNaN(bTime) && aTime !== bTime) {
      return aTime - bTime;
    }

    return String(a.period ?? "").localeCompare(String(b.period ?? ""));
  });

  return copy;
};

export const countForKey = (
  row: FinnhubRecommendationTrend,
  key: RecommendationStackKey,
): number => {
  const value = row[key];
  if (value === undefined || !Number.isFinite(value)) return 0;

  return Math.max(0, value);
};

export const totalRecommendations = (
  row: FinnhubRecommendationTrend,
): number =>
  RECOMMENDATION_STACK_KEYS.reduce(
    (sum, key) => sum + countForKey(row, key),
    0,
  );

export type RecommendationChartDatum = {
  periodLabel: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
};

export const rowToChartDatum = (
  row: FinnhubRecommendationTrend,
): RecommendationChartDatum => ({
  buy: countForKey(row, "buy"),
  hold: countForKey(row, "hold"),
  periodLabel: " ",
  sell: countForKey(row, "sell"),
  strongBuy: countForKey(row, "strongBuy"),
  strongSell: countForKey(row, "strongSell"),
});
