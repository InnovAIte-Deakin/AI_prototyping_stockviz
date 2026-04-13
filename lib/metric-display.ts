/** Maps common Finnhub `stock/metric` keys to short labels for the UI. */
const METRIC_LABELS: Record<string, string> = {
  beta: "Beta",
  peNormalizedAnnual: "P/E (TTM)",
  peAnnual: "P/E",
  pbAnnual: "P/B",
  psAnnual: "P/S",
  dividendPerShareAnnual: "Dividend / share (annual)",
  dividendYieldIndicatedAnnual: "Dividend yield",
  "52WeekHigh": "52-week high",
  "52WeekHighDate": "52-week high date",
  "52WeekLow": "52-week low",
  "52WeekLowDate": "52-week low date",
  marketCapitalization: "Market cap",
  epsAnnual: "EPS (annual)",
  epsNormalizedAnnual: "EPS (normalized)",
  revenueGrowthAnnual5Y: "Revenue growth (5Y)",
  netMarginAnnual: "Net margin",
  operatingMarginAnnual: "Operating margin",
  grossMarginAnnual: "Gross margin",
  roeAnnual: "ROE",
  roaAnnual: "ROA",
  assetTurnoverAnnual: "Asset turnover",
  inventoryTurnoverAnnual: "Inventory turnover",
  currentRatioAnnual: "Current ratio",
  quickRatioAnnual: "Quick ratio",
  netInterestCoverageAnnual: "Interest coverage",
}

const humanizeKey = (key: string): string => {
  const spaced = key.replace(/([A-Z0-9])/g, " $1").replace(/^./, (c) => c.toUpperCase())
  return spaced.replace(/\s+/g, " ").trim()
}

export const labelForMetricKey = (key: string): string => {
  return METRIC_LABELS[key] ?? humanizeKey(key)
}

export const formatMetricValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === "") {
    return "—"
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return "—"
    }
    if (Math.abs(value) >= 1e12) {
      return value.toExponential(2)
    }
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 4,
    }).format(value)
  }
  const s = String(value).trim()
  const num = Number(s)
  if (s !== "" && !Number.isNaN(num) && /^-?\d/.test(s)) {
    return formatMetricValue(num)
  }
  return s
}
