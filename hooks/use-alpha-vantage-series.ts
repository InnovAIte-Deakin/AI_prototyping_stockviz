"use client"

import * as React from "react"

import { aggregateMonthlyToYearly } from "@/lib/alphavantage/aggregate-yearly"
import { loadPriceSeriesShared } from "@/lib/alphavantage/shared-price-series-fetch"
import type { AlphaVantageOhlcPoint } from "@/lib/alphavantage/parse-time-series"

export type PriceHistoryTab = "daily" | "monthly" | "yearly"

export type AlphaVantageSeriesState = {
  daily: AlphaVantageOhlcPoint[] | null
  monthly: AlphaVantageOhlcPoint[] | null
  yearly: ReturnType<typeof aggregateMonthlyToYearly>
  errorDaily: string | null
  errorMonthly: string | null
  isLoadingDaily: boolean
  isLoadingMonthly: boolean
}

/**
 * Loads daily and/or monthly OHLC from the app proxy. Monthly is shared for Monthly + Yearly tabs;
 * yearly bars are derived client-side from monthly data.
 *
 * Loading flags are intentionally omitted from effect dependency arrays: including them caused
 * abort → finally clears loading → effect re-runs → endless requests (NS_BINDING_ABORTED).
 */
export const useAlphaVantageSeries = (
  symbol: string,
  activeTab: PriceHistoryTab
): AlphaVantageSeriesState => {
  const [daily, setDaily] = React.useState<AlphaVantageOhlcPoint[] | null>(null)
  const [monthly, setMonthly] = React.useState<AlphaVantageOhlcPoint[] | null>(
    null
  )
  const [errorDaily, setErrorDaily] = React.useState<string | null>(null)
  const [errorMonthly, setErrorMonthly] = React.useState<string | null>(null)
  const [isLoadingDaily, setIsLoadingDaily] = React.useState(false)
  const [isLoadingMonthly, setIsLoadingMonthly] = React.useState(false)

  const trimmed = symbol.trim()

  const yearly = React.useMemo(
    () => (monthly ? aggregateMonthlyToYearly(monthly) : []),
    [monthly]
  )

  React.useEffect(() => {
    setDaily(null)
    setMonthly(null)
    setErrorDaily(null)
    setErrorMonthly(null)
    setIsLoadingDaily(false)
    setIsLoadingMonthly(false)
  }, [trimmed])

  React.useEffect(() => {
    if (!trimmed) {
      return
    }
    if (activeTab !== "daily") {
      return
    }
    if (daily !== null) {
      return
    }

    let cancelled = false

    setIsLoadingDaily(true)
    setErrorDaily(null)

    void (async () => {
      const result = await loadPriceSeriesShared(trimmed, "daily")
      if (cancelled) {
        return
      }
      if (result.ok) {
        setDaily(result.series)
        setErrorDaily(null)
      } else {
        setDaily(null)
        setErrorDaily(result.error)
      }
      setIsLoadingDaily(false)
    })()

    return () => {
      cancelled = true
      setIsLoadingDaily(false)
    }
  }, [trimmed, activeTab, daily])

  React.useEffect(() => {
    if (!trimmed) {
      return
    }
    if (activeTab === "daily") {
      return
    }
    if (monthly !== null) {
      return
    }

    let cancelled = false

    setIsLoadingMonthly(true)
    setErrorMonthly(null)

    void (async () => {
      const result = await loadPriceSeriesShared(trimmed, "monthly")
      if (cancelled) {
        return
      }
      if (result.ok) {
        setMonthly(result.series)
        setErrorMonthly(null)
      } else {
        setMonthly(null)
        setErrorMonthly(result.error)
      }
      setIsLoadingMonthly(false)
    })()

    return () => {
      cancelled = true
      setIsLoadingMonthly(false)
    }
  }, [trimmed, activeTab, monthly])

  return {
    daily,
    monthly,
    yearly,
    errorDaily,
    errorMonthly,
    isLoadingDaily,
    isLoadingMonthly,
  }
}
