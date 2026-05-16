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
    color: "var(--color-finance-success)",
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
        "border-border/20 bg-card text-foreground shadow-md shadow-foreground/5",
        className
      )}
    >
      <CardHeader className="flex flex-col gap-2 space-y-0 pb-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-bold text-finance-success">
            Today&apos;s Spotlight Gainer
          </p>
          <CardTitle className="font-mono text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {symbol}
          </CardTitle>
          <CardDescription className="line-clamp-2 text-base text-muted-foreground">{companyName}</CardDescription>
          <p className="text-sm font-bold tabular-nums text-finance-success">
            {formatPct(changePct)} <span className="text-xs font-medium text-muted-foreground">session</span>
          </p>
        </div>
        <Link
          href={`/stock/${encodeURIComponent(symbol)}`}
          className="shrink-0 text-sm font-bold text-primary underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          View {symbol} →
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoadingDaily ? (
          <div className="space-y-3 pt-2" aria-busy aria-live="polite">
            <Skeleton className="h-[220px] w-full rounded-lg bg-muted" />
            <p className="text-center text-xs text-muted-foreground">Loading price history…</p>
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-[var(--border)]/30" />
              <XAxis
                dataKey="period"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                tickFormatter={(v) => (typeof v === "string" ? formatPeriodLabel(v) : String(v))}
                className="text-[10px] font-medium text-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={["auto", "auto"]}
                width={52}
                tickFormatter={(v) => (typeof v === "number" ? formatUsd(v) : String(v))}
                className="text-[10px] font-medium text-muted-foreground"
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
          <p className="text-sm text-muted-foreground">No intraday history available for this symbol.</p>
        ) : null}

        <p className="mt-3 text-[10px] font-medium leading-snug text-muted-foreground">
          Daily closes via Alpha Vantage (compact). Not financial advice.
        </p>
      </CardContent>
    </Card>
  )
}
