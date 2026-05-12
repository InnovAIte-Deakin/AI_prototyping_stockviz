"use client"

import * as React from "react"
import Link from "next/link"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

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
        "border-zinc-800 bg-zinc-950/80 text-zinc-100 shadow-lg shadow-black/20",
        className
      )}
    >
      <CardHeader className="flex flex-col gap-2 space-y-0 pb-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-400/90">
            Today&apos;s spotlight gainer
          </p>
          <CardTitle className="font-mono text-xl tracking-tight text-white sm:text-2xl">
            {symbol}
          </CardTitle>
          <CardDescription className="line-clamp-2 text-zinc-400">{companyName}</CardDescription>
          <p className="text-sm font-semibold tabular-nums text-emerald-400">
            {formatPct(changePct)} <span className="text-xs font-normal text-zinc-500">session</span>
          </p>
        </div>
        <Link
          href={`/stock/${encodeURIComponent(symbol)}`}
          className="shrink-0 text-sm font-medium text-sky-400 underline-offset-4 hover:text-sky-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          View {symbol} →
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoadingDaily ? (
          <div className="space-y-3 pt-2" aria-busy aria-live="polite">
            <Skeleton className="h-[220px] w-full rounded-lg bg-zinc-900" />
            <p className="text-center text-xs text-zinc-500">Loading price history…</p>
          </div>
        ) : null}

        {!isLoadingDaily && errorDaily ? (
          <p className="rounded-lg border border-amber-900/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
            {errorDaily}
          </p>
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-zinc-800" />
              <XAxis
                dataKey="period"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                tickFormatter={(v) => (typeof v === "string" ? formatPeriodLabel(v) : String(v))}
                className="text-[10px] text-zinc-500"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={["auto", "auto"]}
                width={52}
                tickFormatter={(v) => (typeof v === "number" ? formatUsd(v) : String(v))}
                className="text-[10px] text-zinc-500"
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
          <p className="text-sm text-zinc-500">No intraday history available for this symbol.</p>
        ) : null}

        <p className="mt-3 text-[10px] leading-snug text-zinc-600">
          Daily closes via Alpha Vantage (compact). Not financial advice.
        </p>
      </CardContent>
    </Card>
  )
}
