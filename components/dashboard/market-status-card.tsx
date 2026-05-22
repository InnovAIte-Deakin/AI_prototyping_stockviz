"use client"

import * as React from "react"
import { Clock, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useUsMarketStatus } from "@/hooks/use-us-market-status"
import { cn } from "@/lib/utils"

export const MarketStatusCard = ({ className }: { className?: string }) => {
  const { data, isLoading, error } = useUsMarketStatus({ refreshIntervalMs: 60000 })

  return (
    <Card className={cn("border-border/20 bg-card text-foreground shadow-md shadow-foreground/5 overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-primary flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Market Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-xs font-medium text-rose-600/80">
            <AlertCircle className="h-3.5 w-3.5" />
            Connectivity limited
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">US Markets</span>
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                data?.isOpen
                  ? "bg-finance-success/10 text-finance-success border border-finance-success/20"
                  : "bg-muted text-primary border border-border/20"
              )}>
                {data?.isOpen ? (
                  <>
                    <div className="h-1.5 w-1.5 rounded-full bg-finance-success animate-pulse" />
                    Open
                  </>
                ) : (
                  <>
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    Closed
                  </>
                )}
              </div>
            </div>
            {data?.holiday ? (
              <p className="text-[10px] text-muted-foreground font-medium mt-1">
                Holiday: <span className="text-foreground">{data.holiday}</span>
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground font-medium mt-1 italic">
                Exchange: <span className="text-foreground not-italic">New York</span>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
