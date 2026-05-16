/** Normalized OHLCV point from Alpha Vantage time series JSON. */
export type AlphaVantageOhlcPoint = {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

const DAILY_SERIES_KEY = "Time Series (Daily)"
const MONTHLY_SERIES_KEY = "Monthly Time Series"

const parseNumber = (raw: string | undefined): number | null => {
  if (raw === undefined || raw === "") {
    return null
  }
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) ? n : null
}

const parseVolume = (raw: string | undefined): number => {
  const n = parseNumber(raw)
  return n ?? 0
}

const mapEntry = (date: string, bar: unknown): AlphaVantageOhlcPoint | null => {
  if (typeof bar !== "object" || bar === null) {
    return null
  }
  const o = bar as Record<string, string>
  const open = parseNumber(o["1. open"])
  const high = parseNumber(o["2. high"])
  const low = parseNumber(o["3. low"])
  const close = parseNumber(o["4. close"])
  const volume = parseVolume(o["5. volume"])

  if (open === null || high === null || low === null || close === null) {
    return null
  }

  return { date, open, high, low, close, volume }
}

const extractAlphaVantageError = (data: Record<string, unknown>): string | null => {
  const sanitize = (msg: string): string => {
    // Check for rate limit keywords
    const lower = msg.toLowerCase()
    if (lower.includes("rate limit") || lower.includes("api limit") || lower.includes("subscribe to any of the premium plans")) {
      return "Chart temporarily unavailable because the daily API limit has been reached. Please try again later."
    }
    
    // Remove anything that looks like an API key (long hex/alphanumeric strings)
    // and generic "We detected your key" messages
    return msg
      .replace(/your api key \([a-z0-9]+\)/gi, "your API key")
      .replace(/key=[a-z0-9]+/gi, "key=***")
      .replace(/[a-z0-9]{15,}/gi, "***")
  }

  const note = data.Note
  if (typeof note === "string" && note.trim()) {
    return sanitize(note.trim())
  }
  const info = data.Information
  if (typeof info === "string" && info.trim()) {
    return sanitize(info.trim())
  }
  const err = data["Error Message"]
  if (typeof err === "string" && err.trim()) {
    return sanitize(err.trim())
  }
  return null
}

/**
 * Parses Alpha Vantage query JSON into sorted ascending OHLCV points (oldest first).
 */
export const parseAlphaVantageTimeSeries = (
  data: unknown
): { ok: true; series: AlphaVantageOhlcPoint[] } | { ok: false; error: string } => {
  if (typeof data !== "object" || data === null) {
    return { ok: false, error: "Invalid Alpha Vantage response" }
  }

  const obj = data as Record<string, unknown>
  const avError = extractAlphaVantageError(obj)
  if (avError) {
    return { ok: false, error: avError }
  }

  let seriesKey: string | null = null
  if (DAILY_SERIES_KEY in obj && typeof obj[DAILY_SERIES_KEY] === "object") {
    seriesKey = DAILY_SERIES_KEY
  } else if (MONTHLY_SERIES_KEY in obj && typeof obj[MONTHLY_SERIES_KEY] === "object") {
    seriesKey = MONTHLY_SERIES_KEY
  }

  if (!seriesKey) {
    return { ok: false, error: "No time series data in Alpha Vantage response" }
  }

  const rawSeries = obj[seriesKey] as Record<string, unknown>
  const points: AlphaVantageOhlcPoint[] = []

  for (const [date, bar] of Object.entries(rawSeries)) {
    const p = mapEntry(date, bar)
    if (p) {
      points.push(p)
    }
  }

  points.sort((a, b) => a.date.localeCompare(b.date))

  if (points.length === 0) {
    return { ok: false, error: "Empty time series from Alpha Vantage" }
  }

  return { ok: true, series: points }
}
