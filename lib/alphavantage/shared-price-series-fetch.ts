import type { AlphaVantageOhlcPoint } from "@/lib/alphavantage/parse-time-series"

type SeriesOk = { ok: true; series: AlphaVantageOhlcPoint[] }
type SeriesErr = { ok: false; error: string }
export type SharedPriceSeriesResult = SeriesOk | SeriesErr

const buildQuery = (symbol: string, interval: "daily" | "monthly"): string => {
  const params = new URLSearchParams({
    symbol: symbol.trim(),
    interval,
  })
  return params.toString()
}

const inflight = new Map<string, Promise<SharedPriceSeriesResult>>()

/**
 * Deduplicates concurrent `/api/stock-price-series` requests for the same
 * symbol+interval (e.g. price history + technical panel on the stock page).
 */
export const loadPriceSeriesShared = async (
  symbol: string,
  interval: "daily" | "monthly"
): Promise<SharedPriceSeriesResult> => {
  const trimmed = symbol.trim()
  if (!trimmed) {
    return { ok: false, error: "Missing symbol" }
  }
  const key = `${interval}:${trimmed.toUpperCase()}`
  const existing = inflight.get(key)
  if (existing) {
    return existing
  }

  const promise = (async (): Promise<SharedPriceSeriesResult> => {
    try {
      const res = await fetch(`/api/stock-price-series?${buildQuery(trimmed, interval)}`)
      const payload = (await res.json()) as
        | { series: AlphaVantageOhlcPoint[] }
        | { error?: string }

      if (!res.ok) {
        const msg =
          "error" in payload && typeof payload.error === "string"
            ? payload.error
            : `Request failed (${res.status})`
        return { ok: false, error: msg }
      }

      if (!("series" in payload) || !Array.isArray(payload.series)) {
        return { ok: false, error: "Unexpected response shape" }
      }

      return { ok: true, series: payload.series }
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Failed to load series",
      }
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, promise)
  return promise
}
