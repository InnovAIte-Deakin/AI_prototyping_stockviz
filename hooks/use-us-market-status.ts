"use client"

import * as React from "react"

import type { FinnhubMarketStatus } from "@/lib/types"

export type UseUsMarketStatusOptions = {
  /**
   * Poll interval in ms. Omit or pass `null` / `0` to fetch only on mount
   * (and when `refetch` is called).
   */
  refreshIntervalMs?: number | null
}

export type UseUsMarketStatusResult = {
  data: FinnhubMarketStatus | null
  error: string | null
  isLoading: boolean
  refetch: () => Promise<void>
}

/**
 * US equity market status via Finnhub (`exchange=US`), proxied by `/api/market-status`.
 * Requires `FINNHUB_API_KEY` on the server.
 */
export const useUsMarketStatus = (
  options?: UseUsMarketStatusOptions
): UseUsMarketStatusResult => {
  const [data, setData] = React.useState<FinnhubMarketStatus | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const fetchStatus = React.useCallback(async (showLoading: boolean) => {
    try {
      setError(null)
      if (showLoading) {
        setIsLoading(true)
      }
      const res = await fetch("/api/market-status")
      const payload = (await res.json()) as
        | FinnhubMarketStatus
        | { error?: string; details?: string }

      if (!res.ok) {
        const msg =
          "error" in payload && typeof payload.error === "string"
            ? payload.error
            : `Request failed (${res.status})`
        throw new Error(msg)
      }

      setData(payload as FinnhubMarketStatus)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load market status")
      setData(null)
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }, [])

  React.useEffect(() => {
    void fetchStatus(true)
  }, [fetchStatus])

  React.useEffect(() => {
    const ms = options?.refreshIntervalMs
    if (ms == null || ms <= 0) {
      return
    }
    const id = window.setInterval(() => {
      void fetchStatus(false)
    }, ms)
    return () => window.clearInterval(id)
  }, [fetchStatus, options?.refreshIntervalMs])

  const refetch = React.useCallback(() => fetchStatus(false), [fetchStatus])

  return { data, error, isLoading, refetch }
}
