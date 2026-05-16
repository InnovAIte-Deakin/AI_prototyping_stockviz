"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { TrendingUp, TrendingDown } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

const formatUsd = (n: number): string =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)

const chartConfig = {
  value: {
    label: "Portfolio Value",
    color: "var(--primary)",
  },
} satisfies ChartConfig

import { PortfolioHistoryPoint } from "@/lib/portfolio/data"

type PortfolioPerformanceChartProps = {
  currentBalance: number
  history: PortfolioHistoryPoint[]
  className?: string
}

export const PortfolioPerformanceChart = ({ currentBalance, history, className }: PortfolioPerformanceChartProps) => {
  const chartData = React.useMemo(() => {
    return history.map(p => ({
      date: new Date(p.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: p.total_value_usd
    }))
  }, [history])

  if (history.length === 0) {
    return (
      <Card className={cn("border-border/20 bg-card text-foreground shadow-md shadow-foreground/5 flex flex-col items-center justify-center py-12 text-center", className)}>
        <CardTitle className="text-sm font-medium text-muted-foreground">No trade history yet</CardTitle>
        <CardDescription className="text-xs font-medium text-muted-foreground max-w-[240px] mt-1 leading-relaxed">
          Start paper trading by searching for a stock and clicking &quot;Buy&quot; to see your performance trend here.
        </CardDescription>
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-foreground transition-colors"
        >
          Find stocks to trade
        </button>
      </Card>
    )
  }

  const firstValue = chartData.length > 0 ? chartData[0].value : 1000000
  const totalChange = currentBalance - firstValue
  const totalChangePct = firstValue !== 0 ? (totalChange / firstValue) * 100 : 0
  const isPositive = totalChange >= 0

  return (
    <Card className={cn("border-border/20 bg-card text-foreground shadow-md shadow-foreground/5", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold text-primary">Portfolio Performance</CardTitle>
          <CardDescription className="text-muted-foreground">
            30-day estimated value trend
          </CardDescription>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold",
          isPositive ? "bg-finance-success/10 text-finance-success border border-finance-success/20" : "bg-finance-danger/10 text-finance-danger border border-finance-danger/20"
        )}>
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {isPositive ? "+" : ""}{totalChangePct.toFixed(2)}%
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[320px] w-full [&_.recharts-surface]:outline-none">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.2} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tickMargin={12}
              tick={{ fontSize: 11, fill: "var(--border)", fontWeight: 500 }}
              minTickGap={30}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tickMargin={12}
              domain={['auto', 'auto']}
              width={64}
              tick={{ fontSize: 11, fill: "var(--border)", fontWeight: 500 }}
              tickFormatter={(v) => formatUsd(v)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => value}
                  formatter={(value) => (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="font-medium text-foreground">
                        {formatUsd(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={isPositive ? "var(--color-finance-success)" : "var(--color-primary)"}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
            />
          </LineChart>
        </ChartContainer>
        <div className="mt-6 flex items-center justify-between text-xs font-medium text-muted-foreground border-t border-border/10 pt-5">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-muted-foreground">Starting Balance</span>
            <span className="text-foreground text-sm font-bold">{new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(firstValue)}</span>
          </div>
          <div className="flex flex-col gap-0.5 text-right">
            <span className="text-xs font-medium text-muted-foreground">Total Return</span>
            <span className={cn("text-sm font-bold", isPositive ? "text-finance-success" : "text-finance-danger")}>
              {isPositive ? "+" : ""}{formatUsd(totalChange)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
