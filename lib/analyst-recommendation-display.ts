import type { ChartConfig } from "@/components/ui/chart"
import type { FinnhubRecommendationTrend } from "@/lib/types"

/** Stack order: bullish → bearish (left → right on horizontal stacked bar). */
export const RECOMMENDATION_STACK_KEYS = [
  "strongBuy",
  "buy",
  "hold",
  "sell",
  "strongSell",
] as const

export type RecommendationStackKey = (typeof RECOMMENDATION_STACK_KEYS)[number]

export const RECOMMENDATION_CHART_CONFIG = {
  strongBuy: {
    label: "Strong buy",
    theme: {
      light: "oklch(0.4 0.17 155)",
      dark: "oklch(0.72 0.14 158)",
    },
  },
  buy: {
    label: "Buy",
    theme: {
      light: "oklch(0.48 0.14 155)",
      dark: "oklch(0.64 0.12 158)",
    },
  },
  hold: {
    label: "Hold",
    theme: {
      light: "oklch(0.52 0.08 85)",
      dark: "oklch(0.72 0.07 85)",
    },
  },
  sell: {
    label: "Sell",
    theme: {
      light: "oklch(0.52 0.18 35)",
      dark: "oklch(0.68 0.15 35)",
    },
  },
  strongSell: {
    label: "Strong sell",
    theme: {
      light: "oklch(0.45 0.2 25)",
      dark: "oklch(0.62 0.17 25)",
    },
  },
} satisfies ChartConfig

export const parseRecommendationPeriodMs = (
  period: string | undefined
): number => {
  if (!period?.trim()) {
    return Number.NaN
  }
  const p = period.trim()
  const direct = Date.parse(p)
  if (!Number.isNaN(direct)) {
    return direct
  }
  const yyyyMmDd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(p)
  if (yyyyMmDd) {
    return new Date(
      Number(yyyyMmDd[1]),
      Number(yyyyMmDd[2]) - 1,
      Number(yyyyMmDd[3])
    ).getTime()
  }
  const yyyyMm = /^(\d{4})-(\d{2})$/.exec(p)
  if (yyyyMm) {
    return new Date(Number(yyyyMm[1]), Number(yyyyMm[2]) - 1, 1).getTime()
  }
  const q = /^(\d{4})-Q([1-4])$/i.exec(p)
  if (q) {
    const month = (Number(q[2]) - 1) * 3
    return new Date(Number(q[1]), month, 1).getTime()
  }
  return Number.NaN
}

/** Oldest → newest so index 0 is earliest and `length - 1` is most recent. */
export const sortRecommendationsChronologically = (
  rows: FinnhubRecommendationTrend[]
): FinnhubRecommendationTrend[] => {
  const copy = [...rows]
  copy.sort((a, b) => {
    const ta = parseRecommendationPeriodMs(a.period)
    const tb = parseRecommendationPeriodMs(b.period)
    if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) {
      return ta - tb
    }
    return String(a.period ?? "").localeCompare(String(b.period ?? ""))
  })
  return copy
}

export const countForKey = (
  row: FinnhubRecommendationTrend,
  key: RecommendationStackKey
): number => {
  const v = row[key]
  if (v === undefined || !Number.isFinite(v)) {
    return 0
  }
  return Math.max(0, v)
}

export const totalRecommendations = (row: FinnhubRecommendationTrend): number =>
  RECOMMENDATION_STACK_KEYS.reduce((sum, k) => sum + countForKey(row, k), 0)

export type RecommendationChartDatum = {
  /** Short label for the Y axis */
  periodLabel: string
  strongBuy: number
  buy: number
  hold: number
  sell: number
  strongSell: number
}

export const rowToChartDatum = (
  row: FinnhubRecommendationTrend
): RecommendationChartDatum => ({
  /** Single-category bar; period is shown in the card header, not on the axis. */
  periodLabel: " ",
  strongBuy: countForKey(row, "strongBuy"),
  buy: countForKey(row, "buy"),
  hold: countForKey(row, "hold"),
  sell: countForKey(row, "sell"),
  strongSell: countForKey(row, "strongSell"),
})
