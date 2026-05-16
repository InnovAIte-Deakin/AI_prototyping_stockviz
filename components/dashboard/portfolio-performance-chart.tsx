"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
    color: "#5f5e5e",
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
      <Card className={cn("border-[#adb3b2]/20 bg-white text-[#2d3433] shadow-md shadow-[#2d3433]/5 flex flex-col items-center justify-center py-12 text-center", className)}>
        <TrendingUp className="h-10 w-10 text-[#adb3b2] mb-3 opacity-20" />
        <CardTitle className="text-sm font-medium text-[#5a6060]">No trade history yet</CardTitle>
        <CardDescription className="text-xs font-medium text-[#adb3b2] max-w-[240px] mt-1 leading-relaxed">
          Start paper trading by searching for a stock and clicking &quot;Buy&quot; to see your performance trend here.
        </CardDescription>
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[#5f5e5e] hover:text-[#2d3433] transition-colors"
        >
          Find stocks to trade <TrendingUp className="h-3 w-3" />
        </button>
      </Card>
    )
  }

  const firstValue = chartData.length > 0 ? chartData[0].value : 100000
  const totalChange = currentBalance - firstValue
  const totalChangePct = firstValue !== 0 ? (totalChange / firstValue) * 100 : 0
  const isPositive = totalChange >= 0

  return (
    <Card className={cn("border-[#adb3b2]/20 bg-white text-[#2d3433] shadow-md shadow-[#2d3433]/5", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold text-[#5f5e5e]">Portfolio Performance</CardTitle>
          <CardDescription className="text-[#5a6060]">
            30-day estimated value trend
          </CardDescription>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold",
          isPositive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
        )}>
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {isPositive ? "+" : ""}{totalChangePct.toFixed(2)}%
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? "#10b981" : "#5f5e5e"} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={isPositive ? "#10b981" : "#5f5e5e"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#adb3b2" strokeOpacity={0.2} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tickMargin={12}
              tick={{ fontSize: 11, fill: "#adb3b2", fontWeight: 500 }}
              minTickGap={30}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tickMargin={12}
              domain={['auto', 'auto']}
              width={64}
              tick={{ fontSize: 11, fill: "#adb3b2", fontWeight: 500 }}
              tickFormatter={(v) => formatUsd(v)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => value}
                  formatter={(value) => (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-[#5f5e5e]" />
                      <span className="font-medium text-[#2d3433]">
                        {formatUsd(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? "#10b981" : "#5f5e5e"}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
              isAnimationActive={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
            />
          </AreaChart>
        </ChartContainer>
        <div className="mt-6 flex items-center justify-between text-xs font-medium text-[#5a6060] border-t border-[#adb3b2]/10 pt-5">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-[#adb3b2]">Starting Balance</span>
            <span className="text-[#2d3433] text-sm font-bold">$100,000.00</span>
          </div>
          <div className="flex flex-col gap-0.5 text-right">
            <span className="text-xs font-medium text-[#adb3b2]">Total Return</span>
            <span className={cn("text-sm font-bold", isPositive ? "text-emerald-600" : "text-rose-600")}>
              {isPositive ? "+" : ""}{formatUsd(totalChange)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
