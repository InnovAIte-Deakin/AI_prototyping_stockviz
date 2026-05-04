"use client"

import * as React from "react"

import type {
  FinnhubMarketNewsCategory,
  FinnhubMarketNewsItem,
} from "@/lib/types"

export type UseMarketNewsOptions = {
  category: FinnhubMarketNewsCategory
  /** Finnhub: return only news with id greater than this. */
  minId?: number
  /**
   * Max number of newest articles to return. Defaults to `5`.
   * Pass `null` to return the full list from Finnhub (no slice).
   */
  limit?: number | null
  /**
   * Poll interval in ms. Omit or pass `null` / `0` to fetch only on mount
   * and when `refetch` is called.
   */
  refreshIntervalMs?: number | null
}

export type UseMarketNewsResult = {
  items: FinnhubMarketNewsItem[]
  error: string | null
  isLoading: boolean
  refetch: () => Promise<void>
}

const buildQuery = (options: {
  category: FinnhubMarketNewsCategory
  minId?: number
  limit?: number | null
}): string => {
  const params = new URLSearchParams({ category: options.category })
  if (options.minId != null && options.minId >= 0) {
    params.set("minId", String(options.minId))
  }
  if (options.limit !== null && options.limit !== undefined) {
    params.set("limit", String(options.limit))
  }
  return params.toString()
}

/**
 * Market news via Finnhub (`/news`), proxied by `/api/market-news`.
 * Requires `FINNHUB_API_KEY` on the server.
 */
export const useMarketNews = (
  options: UseMarketNewsOptions
): UseMarketNewsResult => {
  const { category, minId, refreshIntervalMs } = options
  const limit =
    options.limit === undefined ? 5 : options.limit === null ? null : options.limit

  const [items, setItems] = React.useState<FinnhubMarketNewsItem[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const queryString = React.useMemo(
    () =>
      buildQuery({
        category,
        minId,
        limit,
      }),
    [category, minId, limit]
  )

  const fetchNews = React.useCallback(
    async (showLoading: boolean) => {
      try {
        setError(null)
        if (showLoading) {
          setIsLoading(true)
        }
        const res = await fetch(`/api/market-news?${queryString}`)
        const payload = (await res.json()) as
          | FinnhubMarketNewsItem[]
          | { error?: string }

        if (!res.ok) {
          const msg =
            "error" in payload && typeof payload.error === "string"
              ? payload.error
              : `Request failed (${res.status})`
          throw new Error(msg)
        }

        if (!Array.isArray(payload)) {
          throw new Error("Invalid market news response")
        }

        setItems(payload)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load market news")
        setItems([])
      } finally {
        if (showLoading) {
          setIsLoading(false)
        }
      }
    },
    [queryString]
  )

  React.useEffect(() => {
    void fetchNews(true)
  }, [fetchNews])

  React.useEffect(() => {
    const ms = refreshIntervalMs
    if (ms == null || ms <= 0) {
      return
    }
    const id = window.setInterval(() => {
      void fetchNews(false)
    }, ms)
    return () => window.clearInterval(id)
  }, [fetchNews, refreshIntervalMs])

  const refetch = React.useCallback(() => fetchNews(false), [fetchNews])

  return { items, error, isLoading, refetch }
}
