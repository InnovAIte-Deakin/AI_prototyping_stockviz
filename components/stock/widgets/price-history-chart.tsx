"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { AlertCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { cn } from "@/lib/utils"

type PriceHistoryChartProps = {
  symbol: string
  className?: string
}

type ChartRow = {
  period: string
  open: number
  high: number
  low: number
  close: number
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
  }>
): ChartRow[] =>
  points.map((p) => ({
    period: p.date,
    open: p.open,
    high: p.high,
    low: p.low,
    close: p.close,
  }))

const toRowsFromYearly = (
  points: Array<{
    year: string
    open: number
    high: number
    low: number
    close: number
  }>
): ChartRow[] =>
  points.map((p) => ({
    period: p.year,
    open: p.open,
    high: p.high,
    low: p.low,
    close: p.close,
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

export const PriceHistoryChart = ({
  symbol,
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
          Historical OHLC from Alpha Vantage (daily compact, monthly; yearly
          aggregated from monthly).
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
            {renderChartBody({
              tab: "daily",
              showLoading: isLoadingDaily,
              showError: Boolean(errorDaily),
              errorMessage: errorDaily,
              chartRows: dailyRows,
            })}
          </TabsContent>
          <TabsContent value="monthly" className="mt-4 min-h-[320px]">
            {renderChartBody({
              tab: "monthly",
              showLoading: isLoadingMonthly,
              showError: Boolean(errorMonthly),
              errorMessage: errorMonthly,
              chartRows: monthlyRows,
            })}
          </TabsContent>
          <TabsContent value="yearly" className="mt-4 min-h-[320px]">
            {renderChartBody({
              tab: "yearly",
              showLoading: isLoadingMonthly,
              showError: Boolean(errorMonthly),
              errorMessage: errorMonthly,
              chartRows: yearlyRows,
            })}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

const renderChartBody = ({
  tab,
  showLoading,
  showError,
  errorMessage,
  chartRows,
}: {
  tab: PriceHistoryTab
  showLoading: boolean
  showError: boolean
  errorMessage: string | null
  chartRows: ChartRow[]
}) => {
  const showEmpty =
    !showLoading && !showError && chartRows.length === 0

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

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[min(360px,50vh)] w-full"
    >
      <LineChart
        accessibilityLayer
        data={chartRows}
        margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
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
                const p = payload?.[0]?.payload as ChartRow | undefined
                const raw = p?.period ?? ""
                return formatPeriodLabel(tab, raw)
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
        />
      </LineChart>
    </ChartContainer>
  )
}
