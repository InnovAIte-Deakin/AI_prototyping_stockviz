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
  new Intl.NumberFormat("en-US", {
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
  const [range, setRange] = React.useState("1M")

  const chartData = React.useMemo(() => {
    // 1. Sort history chronologically
    const data = [...history].map(p => ({
      time: new Date(p.recorded_at).getTime(),
      value: p.total_value_usd
    })).sort((a, b) => a.time - b.time)

    const nowTime = new Date().getTime()
    
    let startTime = data.length > 0 ? data[0].time : nowTime
    let interval = 24 * 60 * 60 * 1000 // 1 day
    
    if (range === "1D") {
      startTime = nowTime - 24 * 60 * 60 * 1000
      interval = 60 * 60 * 1000 // 1 hour
    } else if (range === "1W") {
      startTime = nowTime - 7 * 24 * 60 * 60 * 1000
    } else if (range === "1M") {
      startTime = nowTime - 30 * 24 * 60 * 60 * 1000
    } else if (range === "3M") {
      startTime = nowTime - 90 * 24 * 60 * 60 * 1000
    } else if (range === "All") {
      if (nowTime - startTime < 2 * 24 * 60 * 60 * 1000) {
        startTime = nowTime - 2 * 24 * 60 * 60 * 1000 // At least show 2 days for "All"
      }
    }

    const result = []
    let currentTime = startTime
    
    const getValueAtTime = (t: number) => {
      let val = 1000000 // default starting balance
      for (let i = 0; i < data.length; i++) {
        if (data[i].time <= t) {
          val = data[i].value
        } else {
          break
        }
      }
      return val
    }

    // Generate points
    while (currentTime <= nowTime) {
      const dateObj = new Date(currentTime)
      result.push({
        timestamp: currentTime,
        date: range === "1D" 
          ? dateObj.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
          : dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value: getValueAtTime(currentTime)
      })
      currentTime += interval
    }

    // Replace the last point's value with the live currentBalance
    if (result.length > 0) {
      result[result.length - 1].value = currentBalance
      result[result.length - 1].date = "Now"
    }

    return result
  }, [history, range, currentBalance])

  if (history.length === 0) {
    return (
      <Card className={cn("border-border/20 bg-card text-foreground shadow-md shadow-foreground/5 flex flex-col items-center justify-center py-12 text-center", className)}>
        <CardTitle className="text-sm font-medium text-muted-foreground">No portfolio activity yet</CardTitle>
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
            {range === "1D" ? "24-hour" : range === "1W" ? "7-day" : range === "1M" ? "30-day" : range === "3M" ? "90-day" : "All-time"} estimated value trend
          </CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/10">
            {["1D", "1W", "1M", "3M", "All"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors",
                  range === r 
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold",
            isPositive ? "bg-finance-success/10 text-finance-success border border-finance-success/20" : "bg-finance-danger/10 text-finance-danger border border-finance-danger/20"
          )}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {isPositive ? "+" : ""}{totalChangePct.toFixed(2)}%
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Mobile range buttons */}
        <div className="sm:hidden flex items-center justify-between gap-1 bg-muted/50 p-1 rounded-lg border border-border/10 mb-6">
          {["1D", "1W", "1M", "3M", "All"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "flex-1 py-1 text-[10px] font-bold rounded-md transition-colors",
                range === r 
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {r}
            </button>
          ))}
        </div>
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

        {Math.abs(totalChangePct) < 0.1 && chartData.length > 0 && (
          <div className="mt-4 bg-muted/30 border border-border/10 rounded-lg p-3 text-center">
            <p className="text-xs font-medium text-muted-foreground">
              Your portfolio is currently stable because current prices are close to your average buy prices.
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between text-xs font-medium text-muted-foreground border-t border-border/10 pt-5">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-muted-foreground">Starting Balance</span>
            <span className="text-foreground text-sm font-bold">{new Intl.NumberFormat("en-US", { style: 'currency', currency: 'USD' }).format(firstValue)}</span>
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
