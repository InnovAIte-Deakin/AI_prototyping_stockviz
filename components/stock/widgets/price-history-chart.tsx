"use client"

import * as React from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  XAxis,
  YAxis,
} from "recharts"
import { AlertCircle, RefreshCw, X } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  type PriceHistoryTab,
  useAlphaVantageSeries,
} from "@/hooks/use-alpha-vantage-series"
import {
  computeSelectedRangeStats,
  findChartIndicesForUserDates,
  type ChartBarForRange,
  type SelectedRangePayload,
} from "@/lib/stocks/compute-price-range-stats"
import type { RangeExplanation } from "@/lib/stocks/explain-range-schema"
import { cn } from "@/lib/utils"

type PriceHistoryChartProps = {
  symbol: string
  companyName?: string
  className?: string
}

const chartConfig = {
  close: {
    label: "Close",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const formatUsd = (n: number): string =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

const toRowsFromDailyMonthly = (
  points: Array<{
    date: string
    open: number
    high: number
    low: number
    close: number
    volume: number
  }>
): ChartBarForRange[] =>
  points.map((p) => ({
    period: p.date,
    open: p.open,
    high: p.high,
    low: p.low,
    close: p.close,
    volume: p.volume,
  }))

const toRowsFromYearly = (
  points: Array<{
    year: string
    open: number
    high: number
    low: number
    close: number
    volume: number
  }>
): ChartBarForRange[] =>
  points.map((p) => ({
    period: p.year,
    open: p.open,
    high: p.high,
    low: p.low,
    close: p.close,
    volume: p.volume,
  }))

const formatPeriodLabel = (tab: PriceHistoryTab, period: string): string => {
  if (tab === "yearly") {
    return period
  }
  if (tab === "monthly") {
    const d = new Date(`${period}T12:00:00Z`)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
      })
    }
  }
  const d = new Date(`${period}T12:00:00Z`)
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }
  return period
}

const formatShortRange = (from: string, to: string): string => {
  const d0 = new Date(`${from}T12:00:00Z`)
  const d1 = new Date(`${to}T12:00:00Z`)
  if (Number.isNaN(d0.getTime()) || Number.isNaN(d1.getTime())) {
    return `${from} – ${to}`
  }
  const o: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
  return `${d0.toLocaleDateString(undefined, o)} – ${d1.toLocaleDateString(undefined, o)}`
}

const readActiveIndex = (state: unknown): number | null => {
  if (!state || typeof state !== "object") {
    return null
  }
  const idx = (state as { activeTooltipIndex?: number }).activeTooltipIndex
  if (typeof idx !== "number" || idx < 0) {
    return null
  }
  return idx
}

const cacheKeyForRange = (
  symbol: string,
  payload: SelectedRangePayload
): string =>
  `${symbol.trim().toUpperCase()}:${payload.from}:${payload.to}:${payload.percentageChange.toFixed(2)}`

type CommittedSelection = { lo: number; hi: number }

const ExplainRangePopoverBody = ({
  symbol,
  companyName,
  rangeStats,
  tab,
  explanation,
  isLoading,
  errorMessage,
  onRetry,
  onClose,
}: {
  symbol: string
  companyName?: string
  rangeStats: SelectedRangePayload
  tab: PriceHistoryTab
  explanation: RangeExplanation | null
  isLoading: boolean
  errorMessage: string | null
  onRetry: () => void
  onClose: () => void
}) => {
  const dir = rangeStats.direction
  const badgeVariant =
    dir === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : dir === "down"
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground"

  return (
    <div className="flex max-h-[min(70vh,520px)] flex-col gap-3 overflow-y-auto">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-sm font-semibold">{symbol}</p>
          {companyName ? (
            <p className="text-muted-foreground text-xs">{companyName}</p>
          ) : null}
          <p className="text-muted-foreground mt-1 text-xs">
            {formatShortRange(rangeStats.from, rangeStats.to)}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="shrink-0"
          aria-label="Close explanation"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="outline" className="tabular-nums">
          Start {formatUsd(rangeStats.startClose)}
        </Badge>
        <Badge variant="outline" className="tabular-nums">
          End {formatUsd(rangeStats.endClose)}
        </Badge>
        <Badge variant="outline" className={cn("tabular-nums", badgeVariant)}>
          {rangeStats.absoluteChange >= 0 ? "+" : ""}
          {formatUsd(rangeStats.absoluteChange)} (
          {rangeStats.percentageChange >= 0 ? "+" : ""}
          {rangeStats.percentageChange.toFixed(2)}%)
        </Badge>
        <Badge variant="secondary" className={cn("capitalize", badgeVariant)}>
          {dir}
        </Badge>
        {explanation ? (
          <Badge variant="outline" className="capitalize">
            Model confidence: {explanation.confidence}
          </Badge>
        ) : null}
      </div>

      {tab === "yearly" ? (
        <p className="text-muted-foreground text-xs">
          Yearly bars span a full calendar year; explanations may be less precise than daily
          or monthly views.
        </p>
      ) : null}

      <Separator />

      {errorMessage ? (
        <div className="space-y-2">
          <p className="text-destructive text-sm">{errorMessage}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onRetry}
          >
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : null}

      {!errorMessage && isLoading ? (
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">
            Analyzing {symbol} from {formatShortRange(rangeStats.from, rangeStats.to)}…
          </p>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : null}

      {!errorMessage && !isLoading && explanation ? (
        <div className="space-y-3 text-sm">
          <p>{explanation.summary}</p>

          {explanation.mainDrivers.length > 0 ? (
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                Main drivers
              </p>
              <ul className="list-inside list-disc space-y-1.5 text-xs">
                {explanation.mainDrivers.map((d, i) => (
                  <li key={i}>
                    <span className="font-medium">{d.category.replaceAll("_", " ")}</span>{" "}
                    <span className="text-muted-foreground">({d.confidence})</span> —{" "}
                    {d.explanation}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {explanation.importantDates.length > 0 ? (
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                Important dates
              </p>
              <ul className="space-y-2 text-xs">
                {explanation.importantDates.map((e, i) => (
                  <li key={i} className="rounded-md border border-border/60 bg-muted/20 p-2">
                    <p className="font-medium">{e.date}</p>
                    <p>{e.event}</p>
                    <p className="text-muted-foreground">{e.priceAction}</p>
                    <p className="text-muted-foreground">{e.relevance}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {explanation.evidence.length > 0 ? (
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                Evidence
              </p>
              <ul className="space-y-2 text-xs">
                {explanation.evidence.map((ev, i) => (
                  <li key={i}>
                    {ev.url ? (
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary font-medium underline-offset-2 hover:underline"
                      >
                        {ev.headline}
                      </a>
                    ) : (
                      <span className="font-medium">{ev.headline}</span>
                    )}
                    <span className="text-muted-foreground">
                      {" "}
                      {ev.source ? `· ${ev.source}` : ""}
                      {ev.publishedDate ? ` · ${ev.publishedDate}` : ""}
                    </span>
                    <p className="text-muted-foreground mt-0.5">{ev.relevance}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="text-muted-foreground text-xs">{explanation.caveat}</p>
          <p className="text-muted-foreground text-[0.7rem] leading-snug">
            AI-generated explanation. Not financial advice.
          </p>
        </div>
      ) : null}
    </div>
  )
}

const SelectableChartSection = ({
  tab,
  chartRows,
  symbol,
  companyName,
  showLoading,
  showError,
  errorMessage,
}: {
  tab: PriceHistoryTab
  chartRows: ChartBarForRange[]
  symbol: string
  companyName?: string
  showLoading: boolean
  showError: boolean
  errorMessage: string | null
}) => {
  const [isSelecting, setIsSelecting] = React.useState(false)
  const isSelectingRef = React.useRef(false)
  const dragRef = React.useRef({ a: 0, b: 0 })
  const [dragTick, setDragTick] = React.useState(0)
  const [committed, setCommitted] = React.useState<CommittedSelection | null>(null)
  const [popoverOpen, setPopoverOpen] = React.useState(false)

  const [rangeStats, setRangeStats] = React.useState<SelectedRangePayload | null>(null)
  const [explanation, setExplanation] = React.useState<RangeExplanation | null>(null)
  const [explainLoading, setExplainLoading] = React.useState(false)
  const [explainError, setExplainError] = React.useState<string | null>(null)
  const explainCache = React.useRef(
    new Map<string, RangeExplanation>()
  )
  const abortRef = React.useRef<AbortController | null>(null)

  const [mobileFrom, setMobileFrom] = React.useState("")
  const [mobileTo, setMobileTo] = React.useState("")

  const isYearlyTab = tab === "yearly"

  React.useEffect(() => {
    isSelectingRef.current = isSelecting
  }, [isSelecting])

  const bumpDrag = React.useCallback(() => {
    setDragTick((t) => t + 1)
  }, [])

  const clearSelection = React.useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    isSelectingRef.current = false
    setIsSelecting(false)
    setCommitted(null)
    setPopoverOpen(false)
    setRangeStats(null)
    setExplanation(null)
    setExplainError(null)
    setExplainLoading(false)
  }, [])

  React.useEffect(() => {
    clearSelection()
  }, [tab, symbol, clearSelection])

  const runExplainRequest = React.useCallback(
    async (stats: SelectedRangePayload) => {
      const key = cacheKeyForRange(symbol, stats)
      const cached = explainCache.current.get(key)
      if (cached) {
        setExplanation(cached)
        setExplainLoading(false)
        setExplainError(null)
        return
      }

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setExplainLoading(true)
      setExplainError(null)
      setExplanation(null)

      try {
        const res = await fetch("/api/stocks/explain-range", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            symbol: symbol.trim().toUpperCase(),
            companyName: companyName?.trim() || undefined,
            ...stats,
          }),
        })
        const json = (await res.json()) as RangeExplanation | { error?: string }

        if (controller.signal.aborted) {
          return
        }

        if (!res.ok) {
          const msg =
            typeof (json as { error?: string }).error === "string"
              ? (json as { error: string }).error
              : "Couldn’t generate explanation right now."
          setExplainError(msg)
          setExplanation(null)
          return
        }

        if ("summary" in json && "mainDrivers" in json) {
          explainCache.current.set(key, json as RangeExplanation)
          setExplanation(json as RangeExplanation)
        } else {
          setExplainError("Couldn’t generate explanation right now.")
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          return
        }
        setExplainError("Couldn’t generate explanation right now.")
      } finally {
        if (!controller.signal.aborted) {
          setExplainLoading(false)
        }
      }
    },
    [symbol, companyName]
  )

  const finalizeDrag = React.useCallback(() => {
    if (!isSelectingRef.current) {
      return
    }
    isSelectingRef.current = false
    setIsSelecting(false)
    const lo = Math.min(dragRef.current.a, dragRef.current.b)
    const hi = Math.max(dragRef.current.a, dragRef.current.b)
    if (hi - lo < 1) {
      return
    }
    const stats = computeSelectedRangeStats(chartRows, lo, hi, isYearlyTab)
    if (!stats) {
      return
    }
    setCommitted({ lo, hi })
    setRangeStats(stats)
    setPopoverOpen(true)

    const key = cacheKeyForRange(symbol, stats)
    const cached = explainCache.current.get(key)
    if (cached) {
      setExplanation(cached)
      setExplainLoading(false)
      setExplainError(null)
      return
    }
    void runExplainRequest(stats)
  }, [chartRows, isYearlyTab, symbol, runExplainRequest])

  React.useEffect(() => {
    if (!isSelecting) {
      return
    }
    const handleWindowPointerEnd = () => {
      finalizeDrag()
    }
    window.addEventListener("mouseup", handleWindowPointerEnd)
    window.addEventListener("touchend", handleWindowPointerEnd)
    return () => {
      window.removeEventListener("mouseup", handleWindowPointerEnd)
      window.removeEventListener("touchend", handleWindowPointerEnd)
    }
  }, [isSelecting, finalizeDrag])

  const handleChartMouseDown = React.useCallback(
    (state: unknown) => {
      const idx = readActiveIndex(state)
      if (idx === null || idx >= chartRows.length) {
        return
      }
      dragRef.current = { a: idx, b: idx }
      isSelectingRef.current = true
      setIsSelecting(true)
      bumpDrag()
    },
    [chartRows.length, bumpDrag]
  )

  const handleChartMouseMove = React.useCallback(
    (state: unknown) => {
      if (!isSelectingRef.current) {
        return
      }
      const idx = readActiveIndex(state)
      if (idx === null || idx >= chartRows.length) {
        return
      }
      dragRef.current.b = idx
      bumpDrag()
    },
    [chartRows.length, bumpDrag]
  )

  const handleRetry = React.useCallback(() => {
    if (!rangeStats) {
      return
    }
    void runExplainRequest(rangeStats)
  }, [rangeStats, runExplainRequest])

  const handlePopoverOpenChange = React.useCallback((open: boolean) => {
    setPopoverOpen(open)
  }, [])

  const handleClosePopover = React.useCallback(() => {
    setPopoverOpen(false)
  }, [])

  const showEmpty =
    !showLoading && !showError && chartRows.length === 0

  const handleApplyMobileRange = React.useCallback(() => {
    if (!mobileFrom || !mobileTo) {
      return
    }
    const fromIso =
      tab === "monthly" ? `${mobileFrom}-01` : tab === "yearly" ? `${mobileFrom}-01-01` : mobileFrom
    const toIso =
      tab === "monthly"
        ? `${mobileTo}-01`
        : tab === "yearly"
          ? `${mobileTo}-12-31`
          : mobileTo
    const found = findChartIndicesForUserDates(chartRows, tab, fromIso, toIso)
    if (!found) {
      return
    }
    const stats = computeSelectedRangeStats(
      chartRows,
      found.start,
      found.end,
      isYearlyTab
    )
    if (!stats) {
      return
    }
    setCommitted({ lo: Math.min(found.start, found.end), hi: Math.max(found.start, found.end) })
    setRangeStats(stats)
    setPopoverOpen(true)
    const key = cacheKeyForRange(symbol, stats)
    const cached = explainCache.current.get(key)
    if (cached) {
      setExplanation(cached)
      setExplainLoading(false)
      setExplainError(null)
      return
    }
    void runExplainRequest(stats)
  }, [mobileFrom, mobileTo, tab, chartRows, isYearlyTab, symbol, runExplainRequest])

  void dragTick
  const provisionalLoHi: { lo: number; hi: number } | null = isSelecting
    ? {
        lo: Math.min(dragRef.current.a, dragRef.current.b),
        hi: Math.max(dragRef.current.a, dragRef.current.b),
      }
    : committed

  if (showLoading) {
    return (
      <div className="space-y-3 pt-2">
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </div>
    )
  }

  if (showError && errorMessage) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Could not load price history</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    )
  }

  if (showEmpty) {
    return (
      <p className="text-muted-foreground text-sm">No price data for this range.</p>
    )
  }

  const refArea =
    provisionalLoHi && provisionalLoHi.hi > provisionalLoHi.lo ? (
      <ReferenceArea
        x1={chartRows[provisionalLoHi.lo].period}
        x2={chartRows[provisionalLoHi.hi].period}
        strokeOpacity={0.4}
        fill="var(--chart-1)"
        fillOpacity={0.12}
      />
    ) : null

  return (
    <div className="relative space-y-3">
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[min(360px,50vh)] w-full [&_.recharts-surface]:outline-none"
      >
        <LineChart
          accessibilityLayer
          data={chartRows}
          margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
          onMouseDown={handleChartMouseDown}
          onMouseMove={handleChartMouseMove}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="period"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
            tickFormatter={(v) =>
              typeof v === "string" ? formatPeriodLabel(tab, v) : String(v)
            }
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            domain={["auto", "auto"]}
            tickFormatter={(v) =>
              typeof v === "number" ? formatUsd(v) : String(v)
            }
            width={56}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  const p = payload?.[0]?.payload as ChartBarForRange | undefined
                  const raw = p?.period ?? ""
                  return formatPeriodLabel(tab, raw)
                }}
                formatter={(value) =>
                  typeof value === "number" ? formatUsd(value) : String(value)
                }
              />
            }
          />
          {refArea}
          <Line
            type="monotone"
            dataKey="close"
            stroke="var(--color-close)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-xs">
          Drag across the chart to explain a move.
        </p>
        <div className="flex flex-wrap gap-2">
          {rangeStats && !popoverOpen ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setPopoverOpen(true)}
            >
              View explanation
            </Button>
          ) : null}
          {committed ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearSelection}
            >
              Clear selection
            </Button>
          ) : null}
        </div>
      </div>

      <div className="border-border/60 space-y-2 rounded-lg border bg-muted/10 p-3 md:hidden">
        <p className="text-muted-foreground text-xs font-medium">
          Or pick a range ({tab === "daily" ? "dates" : tab === "monthly" ? "months" : "years"})
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          {tab === "daily" ? (
            <>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">From</span>
                <input
                  type="date"
                  value={mobileFrom}
                  onChange={(e) => setMobileFrom(e.target.value)}
                  className="border-input bg-background h-8 rounded-md border px-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">To</span>
                <input
                  type="date"
                  value={mobileTo}
                  onChange={(e) => setMobileTo(e.target.value)}
                  className="border-input bg-background h-8 rounded-md border px-2 text-sm"
                />
              </label>
            </>
          ) : null}
          {tab === "monthly" ? (
            <>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">From</span>
                <input
                  type="month"
                  value={mobileFrom}
                  onChange={(e) => setMobileFrom(e.target.value)}
                  className="border-input bg-background h-8 rounded-md border px-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">To</span>
                <input
                  type="month"
                  value={mobileTo}
                  onChange={(e) => setMobileTo(e.target.value)}
                  className="border-input bg-background h-8 rounded-md border px-2 text-sm"
                />
              </label>
            </>
          ) : null}
          {tab === "yearly" ? (
            <>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">From year</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1900}
                  max={2100}
                  placeholder="e.g. 2020"
                  value={mobileFrom}
                  onChange={(e) => setMobileFrom(e.target.value)}
                  className="border-input bg-background h-8 rounded-md border px-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">To year</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1900}
                  max={2100}
                  placeholder="e.g. 2024"
                  value={mobileTo}
                  onChange={(e) => setMobileTo(e.target.value)}
                  className="border-input bg-background h-8 rounded-md border px-2 text-sm"
                />
              </label>
            </>
          ) : null}
          <Button
            type="button"
            size="sm"
            className="w-full sm:w-auto"
            onClick={handleApplyMobileRange}
          >
            Explain range
          </Button>
        </div>
      </div>

      {rangeStats ? (
        <Popover open={popoverOpen} onOpenChange={handlePopoverOpenChange}>
          <PopoverAnchor className="pointer-events-none absolute top-2 right-2 h-1 w-1" />
          <PopoverContent
            align="end"
            side="left"
            sideOffset={8}
            className="w-[420px] max-w-[calc(100vw-2rem)] gap-0 p-4"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <ExplainRangePopoverBody
              symbol={symbol}
              companyName={companyName}
              rangeStats={rangeStats}
              tab={tab}
              explanation={explanation}
              isLoading={explainLoading}
              errorMessage={explainError}
              onRetry={handleRetry}
              onClose={handleClosePopover}
            />
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  )
}

export const PriceHistoryChart = ({
  symbol,
  companyName,
  className,
}: PriceHistoryChartProps) => {
  const [tab, setTab] = React.useState<PriceHistoryTab>("daily")
  const {
    daily,
    monthly,
    yearly,
    errorDaily,
    errorMonthly,
    isLoadingDaily,
    isLoadingMonthly,
  } = useAlphaVantageSeries(symbol, tab)

  const handleTabChange = (value: string) => {
    if (value === "daily" || value === "monthly" || value === "yearly") {
      setTab(value)
    }
  }

  const dailyRows = React.useMemo(
    () => (daily ? toRowsFromDailyMonthly(daily) : []),
    [daily]
  )
  const monthlyRows = React.useMemo(
    () => (monthly ? toRowsFromDailyMonthly(monthly) : []),
    [monthly]
  )
  const yearlyRows = React.useMemo(
    () => (yearly.length > 0 ? toRowsFromYearly(yearly) : []),
    [yearly]
  )

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Price history</CardTitle>
        <CardDescription>
          Historical OHLC from Alpha Vantage (daily compact, monthly; yearly aggregated from
          monthly). Drag a range to get an AI explanation using FMP news (server-side).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList aria-label="Price history range">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-4 min-h-[320px]">
            <SelectableChartSection
              tab="daily"
              chartRows={dailyRows}
              symbol={symbol}
              companyName={companyName}
              showLoading={isLoadingDaily}
              showError={Boolean(errorDaily)}
              errorMessage={errorDaily}
            />
          </TabsContent>
          <TabsContent value="monthly" className="mt-4 min-h-[320px]">
            <SelectableChartSection
              tab="monthly"
              chartRows={monthlyRows}
              symbol={symbol}
              companyName={companyName}
              showLoading={isLoadingMonthly}
              showError={Boolean(errorMonthly)}
              errorMessage={errorMonthly}
            />
          </TabsContent>
          <TabsContent value="yearly" className="mt-4 min-h-[320px]">
            <SelectableChartSection
              tab="yearly"
              chartRows={yearlyRows}
              symbol={symbol}
              companyName={companyName}
              showLoading={isLoadingMonthly}
              showError={Boolean(errorMonthly)}
              errorMessage={errorMonthly}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
