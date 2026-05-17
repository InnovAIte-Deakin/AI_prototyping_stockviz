"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type EnhancedHolding = {
  symbol: string
  value: number
}

type PortfolioAllocationChartProps = {
  holdings: EnhancedHolding[]
  cash: number
}

const formatPct = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n / 100)

const formatUsd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)

export function PortfolioAllocationChart({ holdings, cash }: PortfolioAllocationChartProps) {
  const data = holdings.map((h) => ({
    name: h.symbol,
    value: h.value,
  }))

  if (cash > 0) {
    data.push({
      name: "Cash",
      value: cash,
    })
  }

  // Sort by value descending
  data.sort((a, b) => b.value - a.value)

  const totalValue = data.reduce((acc, curr) => acc + curr.value, 0)

  if (totalValue === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <p className="text-sm font-medium text-muted-foreground">No allocation data.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 w-full h-full p-4 overflow-y-auto max-h-[300px] scrollbar-thin">
      {data.map((item) => {
        const pct = totalValue > 0 ? (item.value / totalValue) * 100 : 0
        const isCash = item.name === "Cash"
        return (
          <div key={item.name} className="flex flex-col gap-1.5 group">
            <div className="flex justify-between items-center text-sm">
              <span className={cn("font-bold tracking-tight", isCash ? "text-finance-success" : "text-foreground")}>
                {item.name}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground font-medium text-xs hidden sm:inline-block">
                  {formatUsd(item.value)}
                </span>
                <span className="font-bold text-foreground tabular-nums min-w-[60px] text-right">
                  {formatPct(pct)}
                </span>
              </div>
            </div>
            <div className="h-2.5 w-full bg-muted/40 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isCash ? "bg-finance-success" : "bg-primary"
                )}
                style={{ width: `${Math.max(pct, 0.5)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
