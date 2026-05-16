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
    <Card className={cn("border-[#adb3b2]/20 bg-white text-[#2d3433] shadow-md shadow-[#2d3433]/5", className)}>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-[#5f5e5e]">Technical analysis</CardTitle>
        <CardDescription className="text-[#5a6060]">
          SMA / Bollinger / MACD / RSI / ATR / OBV computed from Alpha Vantage daily OHLC
          (same series as price history). Finnhub aggregate indicator scan is shown when your API
          plan allows it (see docs Technical Analysis).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {aggregate || aggregateError ? (
          <div
            className="flex flex-wrap items-center gap-2 rounded-lg border border-[#adb3b2]/20 bg-[#f2f4f3]/50 px-3 py-2"
            role="region"
            aria-label="Finnhub aggregate technical scan"
          >
            {aggregateError ? (
              <p className="text-xs text-[#adb3b2] font-medium">Indicator scan temporarily unavailable.</p>
            ) : (
              <>
                {signalLabel ? (
                  <Badge variant="outline" className="font-bold capitalize border-[#adb3b2]/30 bg-white text-[#5f5e5e]">
                    Finnhub signal: {signalLabel}
                  </Badge>
                ) : null}
                {counts ? (
                  <span className="text-xs text-[#5a6060] font-bold">
                    Buy {counts.buy ?? "—"} · Neutral {counts.neutral ?? "—"} · Sell{" "}
                    {counts.sell ?? "—"}
                  </span>
                ) : null}
                {adx !== undefined && Number.isFinite(adx) ? (
                  <span className="text-xs text-[#5a6060] font-bold">
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
            <Skeleton className="h-[280px] w-full bg-[#f2f4f3]" />
            <Skeleton className="h-[120px] w-full bg-[#f2f4f3]" />
            <Skeleton className="h-[140px] w-full bg-[#f2f4f3]" />
          </div>
        ) : null}

        {!isLoadingDaily && errorDaily ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-4 text-center">
            <p className="text-sm font-bold text-rose-700">Indicators unavailable</p>
            <p className="text-xs text-rose-600 mt-1">Unable to compute technicals due to API limits. Please try again later.</p>
          </div>
        ) : null}

        {!isLoadingDaily && !errorDaily && chartRows.length === 0 ? (
          <div className="rounded-lg border border-[#adb3b2]/10 bg-[#f9f9f8] p-6 text-center">
            <p className="text-sm font-bold text-[#5a6060]">No indicators found</p>
            <p className="text-xs text-[#adb3b2] mt-1">Not enough daily price bars available to plot technical indicators for this symbol.</p>
          </div>
        ) : null}

        {!isLoadingDaily && !errorDaily && chartRows.length > 0 ? (
          <>
            {latest ? (
              <div className="grid gap-2 text-xs font-medium text-[#5a6060] sm:grid-cols-2 lg:grid-cols-4">
                <p>
                  RSI (14):{" "}
                  <span className="font-bold tabular-nums text-[#2d3433]">
                    {latest.rsi14?.toFixed(2) ?? "—"}
                  </span>
                </p>
                <p>
                  MACD / Sig / Hist:{" "}
                  <span className="font-bold tabular-nums text-[#2d3433]">
                    {latest.macdLine?.toFixed(3) ?? "—"} / {latest.macdSignal?.toFixed(3) ?? "—"} /{" "}
                    {latest.macdHist?.toFixed(3) ?? "—"}
                  </span>
                </p>
                <p>
                  ATR (14):{" "}
                  <span className="font-bold tabular-nums text-[#2d3433]">
                    {latest.atr14?.toFixed(3) ?? "—"}
                  </span>
                </p>
                <p>
                  Close vs SMA50:{" "}
                  <span className="font-bold tabular-nums text-[#2d3433]">
                    {latest.sma50 !== null
                      ? `${(((latest.close - latest.sma50) / latest.sma50) * 100).toFixed(2)}%`
                      : "—"}
                  </span>
                </p>
              </div>
            ) : null}

            <div className="space-y-1">
              <p className="text-xs font-medium text-[#5a6060]">
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#adb3b2" strokeOpacity={0.2} />
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
              <p className="text-xs font-medium text-[#5a6060]">
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#adb3b2" strokeOpacity={0.2} />
                  <XAxis dataKey="date" hide />
                  <YAxis domain={[0, 100]} width={36} tickLine={false} axisLine={false} />
                  <ReferenceArea y1={70} y2={100} fill="#fe8983" fillOpacity={0.15} />
                  <ReferenceArea y1={0} y2={30} fill="#10b981" fillOpacity={0.15} />
                  <ReferenceLine y={70} stroke="#adb3b2" strokeOpacity={0.5} strokeDasharray="4 4" />
                  <ReferenceLine y={30} stroke="#adb3b2" strokeOpacity={0.5} strokeDasharray="4 4" />
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
              <p className="text-xs font-medium text-[#5a6060]">MACD</p>
              <ChartContainer
                config={macdConfig}
                className="aspect-auto h-[160px] w-full [&_.recharts-surface]:outline-none"
              >
                <ComposedChart
                  data={chartRows}
                  margin={{ left: 8, right: 8, top: 4, bottom: 0 }}
                  accessibilityLayer
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#adb3b2" strokeOpacity={0.2} />
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
              <p className="text-xs font-medium text-[#5a6060]">
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#adb3b2" strokeOpacity={0.2} />
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

            <p className="text-[10px] font-medium leading-snug text-[#adb3b2]">
              For education only. Alpha Vantage uses TIME_SERIES_DAILY (compact). Indicator math
              follows common textbook definitions; values may differ slightly from other platforms.
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
