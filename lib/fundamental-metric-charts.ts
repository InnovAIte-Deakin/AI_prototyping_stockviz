import { formatMetricValue, labelForMetricKey } from "@/lib/metric-display"

export type FundamentalChartRow = {
  key: string
  label: string
  /** Bar length */
  display: number
  raw: number
  tooltip: string
}

const SKIP = new Set(["_symbol", "period"])

export const isSkippableMetricKey = (key: string): boolean => SKIP.has(key)

const shouldTreatAsFractionPercent = (key: string, raw: number): boolean => {
  if (!Number.isFinite(raw) || raw === 0) {
    return false
  }
  if (Math.abs(raw) > 1.25) {
    return false
  }
  return /margin|Margin|roe|Roe|roa|Roa|yield|Yield|growth|Growth/i.test(key)
}

export const formatFundamentalTooltip = (key: string, raw: number): string => {
  if (shouldTreatAsFractionPercent(key, raw)) {
    return `${(raw * 100).toFixed(2).replace(/\.?0+$/, "")}%`
  }
  return formatMetricValue(raw)
}

export const toDisplayValue = (key: string, raw: number): number => {
  if (shouldTreatAsFractionPercent(key, raw)) {
    return raw * 100
  }
  return raw
}

export const parseMetricNumber = (
  value: string | number | null | undefined
): number | null => {
  if (value === null || value === undefined || value === "") {
    return null
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }
  const s = String(value).trim()
  const n = Number(s)
  if (s === "" || Number.isNaN(n)) {
    return null
  }
  return n
}

export type MetricGroupId =
  | "valuation"
  | "profitability"
  | "liquidity"
  | "turnoverCoverage"

export const METRIC_GROUPS: Record<
  MetricGroupId,
  { title: string; description: string; keys: readonly string[] }
> = {
  valuation: {
    title: "Valuation",
    description: "Multiples and price sensitivity versus fundamentals.",
    keys: [
      "peAnnual",
      "peNormalizedAnnual",
      "pbAnnual",
      "psAnnual",
      "beta",
    ],
  },
  profitability: {
    title: "Profitability",
    description:
      "Margins and returns. Values between −1 and 1.25 are shown as % on the chart when they look like fractions.",
    keys: [
      "grossMarginAnnual",
      "operatingMarginAnnual",
      "netMarginAnnual",
      "roeAnnual",
      "roaAnnual",
    ],
  },
  liquidity: {
    title: "Liquidity",
    description: "Short-term solvency ratios.",
    keys: ["currentRatioAnnual", "quickRatioAnnual"],
  },
  turnoverCoverage: {
    title: "Efficiency & coverage",
    description: "Turnover and interest coverage (higher coverage is generally stronger).",
    keys: [
      "assetTurnoverAnnual",
      "inventoryTurnoverAnnual",
      "netInterestCoverageAnnual",
    ],
  },
}

/** Keys shown as headline tiles (first matches win; order is display priority). */
export const HIGHLIGHT_METRIC_KEYS: readonly string[] = [
  "marketCapitalization",
  "peNormalizedAnnual",
  "peAnnual",
  "pbAnnual",
  "dividendYieldIndicatedAnnual",
  "roeAnnual",
  "netMarginAnnual",
  "epsAnnual",
]

export const buildRowsForKeys = (
  metric: Record<string, string | number | null | undefined>,
  keys: readonly string[]
): FundamentalChartRow[] => {
  const rows: FundamentalChartRow[] = []
  for (const key of keys) {
    const raw = parseMetricNumber(metric[key])
    if (raw === null) {
      continue
    }
    rows.push({
      key,
      label: labelForMetricKey(key),
      raw,
      display: toDisplayValue(key, raw),
      tooltip: formatFundamentalTooltip(key, raw),
    })
  }
  return rows
}
