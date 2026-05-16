"use client"

import * as React from "react"

import type {
  FinnhubPeersResponse,
  FinnhubQuote,
  FinnhubRecommendationTrend,
  FinnhubStockMetricResponse,
} from "@/lib/types"

export type AsyncState<T> = {
  data: T | null
  error: string | null
  isLoading: boolean
}

const buildSymbolQuery = (symbol: string): string => {
  const params = new URLSearchParams({ symbol: symbol.trim() })
  return params.toString()
}

export const useFinnhubQuote = (symbol: string): AsyncState<FinnhubQuote> => {
  const [data, setData] = React.useState<FinnhubQuote | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    const trimmed = symbol.trim()
    if (!trimmed) {
      setData(null)
      setError(null)
      setIsLoading(false)
      return
    }

    let aborted = false
    const controller = new AbortController()

    void (async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/quote?${buildSymbolQuery(trimmed)}`, {
          signal: controller.signal,
        })
        const payload = (await res.json()) as
          | FinnhubQuote
          | { error?: string }

        if (aborted) {
          return
        }

        if (!res.ok) {
          const msg =
            "error" in payload && typeof payload.error === "string"
              ? payload.error
              : `Request failed (${res.status})`
          throw new Error(msg)
        }

        setData(payload as FinnhubQuote)
      } catch (e) {
        if (aborted) {
          return
        }
        if (e instanceof DOMException && e.name === "AbortError") {
          return
        }
        setError(e instanceof Error ? e.message : "Failed to load quote")
        setData(null)
      } finally {
        if (!aborted) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      aborted = true
      controller.abort()
    }
  }, [symbol])

  return { data, error, isLoading }
}

export const useFinnhubMetric = (
  symbol: string
): AsyncState<FinnhubStockMetricResponse> => {
  const [data, setData] = React.useState<FinnhubStockMetricResponse | null>(
    null
  )
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    const trimmed = symbol.trim()
    if (!trimmed) {
      setData(null)
      setError(null)
      setIsLoading(false)
      return
    }

    let aborted = false
    const controller = new AbortController()

    void (async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/stock-metric?${buildSymbolQuery(trimmed)}`, {
          signal: controller.signal,
        })
        const payload = (await res.json()) as
          | FinnhubStockMetricResponse
          | { error?: string }

        if (aborted) {
          return
        }

        if (!res.ok) {
          const msg =
            "error" in payload && typeof payload.error === "string"
              ? payload.error
              : `Request failed (${res.status})`
          throw new Error(msg)
        }

        setData(payload as FinnhubStockMetricResponse)
      } catch (e) {
        if (aborted) {
          return
        }
        if (e instanceof DOMException && e.name === "AbortError") {
          return
        }
        setError(e instanceof Error ? e.message : "Failed to load metrics")
        setData(null)
      } finally {
        if (!aborted) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      aborted = true
      controller.abort()
    }
  }, [symbol])

  return { data, error, isLoading }
}

export const useFinnhubPeers = (
  symbol: string
): AsyncState<FinnhubPeersResponse> => {
  const [data, setData] = React.useState<FinnhubPeersResponse | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    const trimmed = symbol.trim()
    if (!trimmed) {
      setData(null)
      setError(null)
      setIsLoading(false)
      return
    }

    let aborted = false
    const controller = new AbortController()

    void (async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/stock-peers?${buildSymbolQuery(trimmed)}`, {
          signal: controller.signal,
        })
        const payload = (await res.json()) as
          | FinnhubPeersResponse
          | { error?: string }

        if (aborted) {
          return
        }

        if (!res.ok) {
          const msg =
            "error" in payload && typeof payload.error === "string"
              ? payload.error
              : `Request failed (${res.status})`
          throw new Error(msg)
        }

        if (!Array.isArray(payload)) {
          throw new Error("Invalid peers response")
        }

        setData(payload as FinnhubPeersResponse)
      } catch (e) {
        if (aborted) {
          return
        }
        if (e instanceof DOMException && e.name === "AbortError") {
          return
        }
        setError(e instanceof Error ? e.message : "Failed to load peers")
        setData(null)
      } finally {
        if (!aborted) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      aborted = true
      controller.abort()
    }
  }, [symbol])

  return { data, error, isLoading }
}

export const useFinnhubRecommendation = (
  symbol: string
): AsyncState<FinnhubRecommendationTrend[]> => {
  const [data, setData] = React.useState<FinnhubRecommendationTrend[] | null>(
    null
  )
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    const trimmed = symbol.trim()
    if (!trimmed) {
      setData(null)
      setError(null)
      setIsLoading(false)
      return
    }

    let aborted = false
    const controller = new AbortController()

    void (async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/stock-recommendation?${buildSymbolQuery(trimmed)}`,
          { signal: controller.signal }
        )
        const payload = (await res.json()) as
          | FinnhubRecommendationTrend[]
          | { error?: string }

        if (aborted) {
          return
        }

        if (!res.ok) {
          const msg =
            "error" in payload && typeof payload.error === "string"
              ? payload.error
              : `Request failed (${res.status})`
          throw new Error(msg)
        }

        if (!Array.isArray(payload)) {
          throw new Error("Invalid recommendation response")
        }

        setData(payload as FinnhubRecommendationTrend[])
      } catch (e) {
        if (aborted) {
          return
        }
        if (e instanceof DOMException && e.name === "AbortError") {
          return
        }
        setError(
          e instanceof Error ? e.message : "Failed to load recommendations"
        )
        setData(null)
      } finally {
        if (!aborted) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      aborted = true
      controller.abort()
    }
  }, [symbol])

  return { data, error, isLoading }
}
