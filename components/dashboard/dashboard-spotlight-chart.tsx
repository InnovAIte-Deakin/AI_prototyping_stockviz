"use client"

import * as React from "react"
import Link from "next/link"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { AlertCircle } from "lucide-react"

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
import { Skeleton } from "@/components/ui/skeleton"
import { useAlphaVantageSeries } from "@/hooks/use-alpha-vantage-series"
import { cn } from "@/lib/utils"

const chartConfig = {
  close: {
    label: "Close",
    color: "hsl(142 71% 45%)",
  },
} satisfies ChartConfig

const formatUsd = (n: number): string =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

const formatPct = (n: number | null): string => {
  if (n === null) return "—"
  if (n > 0) return `+${n.toFixed(2)}%`
  return `${n.toFixed(2)}%`
}

const formatPeriodLabel = (period: string): string => {
  const d = new Date(`${period}T12:00:00Z`)
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })
  }
  return period
}

type DashboardSpotlightChartProps = {
  symbol: string
  companyName: string
  changePct: number | null
  className?: string
}

export const DashboardSpotlightChart = ({
  symbol,
  companyName,
  changePct,
  className,
}: DashboardSpotlightChartProps) => {
  const { daily, errorDaily, isLoadingDaily } = useAlphaVantageSeries(symbol, "daily")

  const chartRows = React.useMemo(() => {
    if (!daily?.length) return []
    return daily.slice(-90).map((p) => ({
      period: p.date,
      close: p.close,
    }))
  }, [daily])

  return (
    <Card
      className={cn(
        "border-[#adb3b2]/20 bg-white text-[#2d3433] shadow-md shadow-[#2d3433]/5",
        className
      )}
    >
      <CardHeader className="flex flex-col gap-2 space-y-0 pb-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-bold text-emerald-600">
            Today&apos;s Spotlight Gainer
          </p>
          <CardTitle className="font-mono text-xl font-bold tracking-tight text-[#2d3433] sm:text-2xl">
            {symbol}
          </CardTitle>
          <CardDescription className="line-clamp-2 text-base text-[#5a6060]">{companyName}</CardDescription>
          <p className="text-sm font-bold tabular-nums text-emerald-600">
            {formatPct(changePct)} <span className="text-xs font-medium text-[#5a6060]">session</span>
          </p>
        </div>
        <Link
          href={`/stock/${encodeURIComponent(symbol)}`}
          className="shrink-0 text-sm font-bold text-[#5f5e5e] underline-offset-4 hover:text-[#2d3433] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f5e5e] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          View {symbol} →
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoadingDaily ? (
          <div className="space-y-3 pt-2" aria-busy aria-live="polite">
            <Skeleton className="h-[220px] w-full rounded-lg bg-[#f2f4f3]" />
            <p className="text-center text-xs text-[#5a6060]">Loading price history…</p>
          </div>
        ) : null}

        {!isLoadingDaily && errorDaily ? (
          <div className="mt-2 space-y-3 rounded-lg border border-rose-200 bg-rose-50/50 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-rose-700">Unable to load chart</p>
                <p className="line-clamp-3 text-[11px] leading-relaxed text-rose-600/90">
                  Chart temporarily unavailable because the daily API limit has been reached. Please try again later.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {!isLoadingDaily && !errorDaily && chartRows.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[220px] w-full [&_.recharts-surface]:outline-none"
          >
            <LineChart
              accessibilityLayer
              data={chartRows}
              margin={{ left: 4, right: 8, top: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-[#adb3b2]/30" />
              <XAxis
                dataKey="period"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                tickFormatter={(v) => (typeof v === "string" ? formatPeriodLabel(v) : String(v))}
                className="text-[10px] font-medium text-[#adb3b2]"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={["auto", "auto"]}
                width={52}
                tickFormatter={(v) => (typeof v === "number" ? formatUsd(v) : String(v))}
                className="text-[10px] font-medium text-[#adb3b2]"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const p = payload?.[0]?.payload as { period?: string } | undefined
                      const raw = p?.period ?? ""
                      return formatPeriodLabel(raw)
                    }}
                    formatter={(value) =>
                      typeof value === "number" ? formatUsd(value) : String(value)
                    }
                  />
                }
              />
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
        ) : null}

        {!isLoadingDaily && !errorDaily && chartRows.length === 0 ? (
          <p className="text-sm text-[#5a6060]">No intraday history available for this symbol.</p>
        ) : null}

        <p className="mt-3 text-[10px] font-medium leading-snug text-[#adb3b2]">
          Daily closes via Alpha Vantage (compact). Not financial advice.
        </p>
      </CardContent>
    </Card>
  )
}
