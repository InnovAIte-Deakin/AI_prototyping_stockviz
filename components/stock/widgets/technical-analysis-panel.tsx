"use client"

import * as React from "react"
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useAlphaVantageSeries } from "@/hooks/use-alpha-vantage-series"
import { computeTaFromOhlc, type TaBar } from "@/lib/ta/indicators-from-ohlc"
import { cn } from "@/lib/utils"

type FinnhubAggregatePayload = {
  error?: string
  technicalAnalysis?: {
    count?: { buy?: number; neutral?: number; sell?: number }
    signal?: string
  }
  trend?: { adx?: number; trending?: boolean }
}

const priceMacdConfig = {
  close: { label: "Close", color: "hsl(220 14% 96%)" },
  sma20: { label: "SMA 20", color: "hsl(217 91% 60%)" },
  sma50: { label: "SMA 50", color: "hsl(280 65% 60%)" },
  bbUpper: { label: "BB upper", color: "hsl(215 16% 47%)" },
  bbLower: { label: "BB lower", color: "hsl(215 16% 47%)" },
} satisfies ChartConfig

const rsiConfig = {
  rsi: { label: "RSI (14)", color: "hsl(38 92% 50%)" },
} satisfies ChartConfig

const macdConfig = {
  macd: { label: "MACD", color: "hsl(217 91% 60%)" },
  signal: { label: "Signal", color: "hsl(280 65% 60%)" },
  hist: { label: "Histogram", color: "hsl(142 71% 45%)" },
} satisfies ChartConfig

const obvConfig = {
  obv: { label: "OBV", color: "hsl(199 89% 48%)" },
} satisfies ChartConfig

const formatAxisDate = (d: string): string => {
  const dt = new Date(`${d}T12:00:00Z`)
  if (Number.isNaN(dt.getTime())) return d
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

const formatTooltipDate = (d: string): string => {
  const dt = new Date(`${d}T12:00:00Z`)
  if (Number.isNaN(dt.getTime())) return d
  return dt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

type ChartRow = TaBar

const toChartRows = (bars: TaBar[]): ChartRow[] => {
  const ready = bars.filter(
    (b) =>
      b.rsi14 !== null &&
      b.sma50 !== null &&
      b.macdLine !== null &&
      b.bbUpper !== null &&
      b.obv !== null
  )
  return ready.slice(-160)
}

type TechnicalAnalysisPanelProps = {
  symbol: string
  className?: string
}

export const TechnicalAnalysisPanel = ({ symbol, className }: TechnicalAnalysisPanelProps) => {
  const trimmed = symbol.trim()
  const { daily, errorDaily, isLoadingDaily } = useAlphaVantageSeries(trimmed, "daily")

  const [aggregate, setAggregate] = React.useState<FinnhubAggregatePayload | null>(null)
  const [aggregateError, setAggregateError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!trimmed) {
      return
    }
    let cancelled = false
    setAggregate(null)
    setAggregateError(null)

    void (async () => {
      try {
        const res = await fetch(
          `/api/stock-aggregate-technical?${new URLSearchParams({ symbol: trimmed, resolution: "D" })}`
        )
        const json: unknown = await res.json().catch(() => null)
        if (cancelled) return
        if (!res.ok) {
          const msg =
            json &&
            typeof json === "object" &&
            "error" in json &&
            typeof (json as { error?: string }).error === "string"
              ? (json as { error: string }).error
              : `Finnhub aggregate request failed (${res.status})`
          setAggregateError(msg)
          return
        }
        const payload = json as FinnhubAggregatePayload
        if (payload.error && typeof payload.error === "string") {
          setAggregateError(payload.error)
          return
        }
        setAggregate(payload)
      } catch {
        if (!cancelled) {
          setAggregateError("Could not load Finnhub aggregate scan.")
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [trimmed])

  const chartRows = React.useMemo(() => {
    if (!daily?.length) return []
    return toChartRows(computeTaFromOhlc(daily))
  }, [daily])

  const latest = chartRows.length > 0 ? chartRows[chartRows.length - 1] : null

  const signalLabel = aggregate?.technicalAnalysis?.signal
  const counts = aggregate?.technicalAnalysis?.count
  const adx = aggregate?.trend?.adx
  const trending = aggregate?.trend?.trending

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Technical analysis</CardTitle>
        <CardDescription>
          SMA / Bollinger / MACD / RSI / ATR / OBV computed from Alpha Vantage daily OHLC
          (same series as price history). Finnhub aggregate indicator scan is shown when your API
          plan allows it (see docs Technical Analysis).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {aggregate || aggregateError ? (
          <div
            className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2"
            role="region"
            aria-label="Finnhub aggregate technical scan"
          >
            {aggregateError ? (
              <p className="text-xs text-muted-foreground">{aggregateError}</p>
            ) : (
              <>
                {signalLabel ? (
                  <Badge variant="outline" className="font-medium capitalize">
                    Finnhub signal: {signalLabel}
                  </Badge>
                ) : null}
                {counts ? (
                  <span className="text-xs text-muted-foreground">
                    Buy {counts.buy ?? "—"} · Neutral {counts.neutral ?? "—"} · Sell{" "}
                    {counts.sell ?? "—"}
                  </span>
                ) : null}
                {adx !== undefined && Number.isFinite(adx) ? (
                  <span className="text-xs text-muted-foreground">
                    ADX {adx.toFixed(1)}
                    {trending !== undefined ? (
                      <span className="ml-1">({trending ? "trending" : "range"})</span>
                    ) : null}
                  </span>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        {isLoadingDaily ? (
          <div className="space-y-3" aria-busy aria-live="polite">
            <Skeleton className="h-[280px] w-full" />
            <Skeleton className="h-[120px] w-full" />
            <Skeleton className="h-[140px] w-full" />
          </div>
        ) : null}

        {!isLoadingDaily && errorDaily ? (
          <p className="text-sm text-destructive">{errorDaily}</p>
        ) : null}

        {!isLoadingDaily && !errorDaily && chartRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not enough daily bars to plot indicators.</p>
        ) : null}

        {!isLoadingDaily && !errorDaily && chartRows.length > 0 ? (
          <>
            {latest ? (
              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                <p>
                  RSI (14):{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {latest.rsi14?.toFixed(2) ?? "—"}
                  </span>
                </p>
                <p>
                  MACD / Sig / Hist:{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {latest.macdLine?.toFixed(3) ?? "—"} / {latest.macdSignal?.toFixed(3) ?? "—"} /{" "}
                    {latest.macdHist?.toFixed(3) ?? "—"}
                  </span>
                </p>
                <p>
                  ATR (14):{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {latest.atr14?.toFixed(3) ?? "—"}
                  </span>
                </p>
                <p>
                  Close vs SMA50:{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {latest.sma50 !== null
                      ? `${(((latest.close - latest.sma50) / latest.sma50) * 100).toFixed(2)}%`
                      : "—"}
                  </span>
                </p>
              </div>
            ) : null}

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Price &amp; bands
              </p>
              <ChartContainer
                config={priceMacdConfig}
                className="aspect-auto h-[min(320px,45vh)] w-full [&_.recharts-surface]:outline-none"
              >
                <ComposedChart
                  data={chartRows}
                  margin={{ left: 8, right: 8, top: 8, bottom: 4 }}
                  accessibilityLayer
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                    tickFormatter={(v) => (typeof v === "string" ? formatAxisDate(v) : String(v))}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    domain={["auto", "auto"]}
                    tickFormatter={(v) => (typeof v === "number" ? v.toFixed(2) : String(v))}
                    width={56}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, p) => {
                          const row = p?.[0]?.payload as ChartRow | undefined
                          return row?.date ? formatTooltipDate(row.date) : ""
                        }}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="bbUpper"
                    stroke="var(--color-bbUpper)"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="bbLower"
                    stroke="var(--color-bbLower)"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="sma20"
                    stroke="var(--color-sma20)"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="sma50"
                    stroke="var(--color-sma50)"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke="var(--color-close)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </ComposedChart>
              </ChartContainer>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                RSI (14)
              </p>
              <ChartContainer
                config={rsiConfig}
                className="aspect-auto h-[140px] w-full [&_.recharts-surface]:outline-none"
              >
                <ComposedChart
                  data={chartRows}
                  margin={{ left: 8, right: 8, top: 4, bottom: 0 }}
                  accessibilityLayer
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" hide />
                  <YAxis domain={[0, 100]} width={36} tickLine={false} axisLine={false} />
                  <ReferenceArea y1={70} y2={100} fill="hsl(var(--destructive) / 0.12)" />
                  <ReferenceArea y1={0} y2={30} fill="hsl(142 71% 45% / 0.12)" />
                  <ReferenceLine y={70} stroke="hsl(var(--muted-foreground) / 0.5)" strokeDasharray="4 4" />
                  <ReferenceLine y={30} stroke="hsl(var(--muted-foreground) / 0.5)" strokeDasharray="4 4" />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, p) => {
                          const row = p?.[0]?.payload as ChartRow | undefined
                          return row?.date ? formatTooltipDate(row.date) : ""
                        }}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="rsi14"
                    stroke="var(--color-rsi)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ChartContainer>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">MACD</p>
              <ChartContainer
                config={macdConfig}
                className="aspect-auto h-[160px] w-full [&_.recharts-surface]:outline-none"
              >
                <ComposedChart
                  data={chartRows}
                  margin={{ left: 8, right: 8, top: 4, bottom: 0 }}
                  accessibilityLayer
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" hide />
                  <YAxis tickLine={false} axisLine={false} width={48} domain={["auto", "auto"]} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, p) => {
                          const row = p?.[0]?.payload as ChartRow | undefined
                          return row?.date ? formatTooltipDate(row.date) : ""
                        }}
                      />
                    }
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" />
                  <Bar dataKey="macdHist" isAnimationActive={false}>
                    {chartRows.map((row, i) => (
                      <Cell
                        key={`macd-h-${row.date}-${i}`}
                        fill={
                          row.macdHist === null
                            ? "transparent"
                            : row.macdHist >= 0
                              ? "hsl(142 71% 40%)"
                              : "hsl(0 72% 51%)"
                        }
                      />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="macdLine"
                    stroke="var(--color-macd)"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="macdSignal"
                    stroke="var(--color-signal)"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ChartContainer>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                On-balance volume
              </p>
              <ChartContainer
                config={obvConfig}
                className="aspect-auto h-[100px] w-full [&_.recharts-surface]:outline-none"
              >
                <ComposedChart
                  data={chartRows}
                  margin={{ left: 8, right: 8, top: 2, bottom: 0 }}
                  accessibilityLayer
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" hide />
                  <YAxis tickLine={false} axisLine={false} width={52} domain={["auto", "auto"]} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, p) => {
                          const row = p?.[0]?.payload as ChartRow | undefined
                          return row?.date ? formatTooltipDate(row.date) : ""
                        }}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="obv"
                    stroke="var(--color-obv)"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ChartContainer>
            </div>

            <p className="text-[10px] leading-snug text-muted-foreground">
              For education only. Alpha Vantage uses TIME_SERIES_DAILY (compact). Indicator math
              follows common textbook definitions; values may differ slightly from other platforms.
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
