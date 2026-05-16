"use client"

import { AlertCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useFinnhubQuote } from "@/hooks/use-finnhub-stock-data"
import { cn } from "@/lib/utils"

type QuoteWidgetProps = {
  symbol: string
  className?: string
  onBuy?: () => void
  onSell?: () => void
  canSell?: boolean
}
const formatPrice = (n: number | undefined): string => {
  if (n === undefined || !Number.isFinite(n)) {
    return "—"
  }
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

const formatTime = (t: number | undefined): string => {
  if (t === undefined || !Number.isFinite(t)) {
    return "—"
  }
  return new Date(t * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export const QuoteWidget = ({ symbol, className, onBuy, onSell, canSell = true }: QuoteWidgetProps) => {
  const { data, error, isLoading } = useFinnhubQuote(symbol)

  const c = data?.c
  const pc = data?.pc
  const change =
    c !== undefined && pc !== undefined && Number.isFinite(c) && Number.isFinite(pc)
      ? c - pc
      : undefined
  const pctChange =
    change !== undefined && pc !== undefined && pc !== 0
      ? (change / pc) * 100
      : undefined

  return (
    <Card className={cn("border-[#adb3b2]/20 bg-white text-[#2d3433] shadow-md shadow-[#2d3433]/5", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold text-[#5f5e5e]">Quote</CardTitle>
          <CardDescription className="text-[#5a6060]">
            Last trade and session stats (Finnhub).
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {onBuy && (
            <button
              onClick={onBuy}
              className="bg-[#5f5e5e] hover:bg-[#4a4a4a] text-white text-[11px] font-bold h-7 px-3 rounded-lg transition-all shadow-sm"
            >
              Buy Paper Stock
            </button>
          )}
          {onSell && (
            <button
              onClick={onSell}
              disabled={!canSell}
              title={!canSell ? "You do not currently own this stock" : "Sell shares"}
              className={cn(
                "text-[11px] font-bold h-7 px-3 rounded-lg transition-all border",
                canSell 
                  ? "border-[#752121] text-[#752121] hover:bg-rose-50" 
                  : "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed opacity-60"
              )}
            >
              Sell
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-40" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ) : null}

        {error ? (
          <Alert className="border-[#fe8983]/30 bg-[#fe8983]/10 text-[#752121]">
            <AlertCircle className="text-[#752121]" />
            <AlertTitle className="font-bold">Quote unavailable</AlertTitle>
            <AlertDescription className="text-[#752121]/90">
              Live market data for {symbol} is currently unavailable. Please try again in a few minutes.
            </AlertDescription>
          </Alert>
        ) : null}

        {!isLoading && !error && data ? (
          <div className="space-y-4">
            <div>
              <p className="text-[#5a6060] text-xs font-medium">
                Last
              </p>
              <p className="text-4xl font-bold tabular-nums tracking-tight text-[#2d3433]">
                {formatPrice(c)}
              </p>
              {change !== undefined && pctChange !== undefined ? (
                <p
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    change >= 0 ? "text-emerald-600" : "text-rose-600"
                  )}
                >
                  {change >= 0 ? "+" : ""}
                  {formatPrice(change)} ({pctChange >= 0 ? "+" : ""}
                  {pctChange.toFixed(2)}%)
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">Change n/a</p>
              )}
              <p className="text-[#adb3b2] mt-1 text-xs font-medium">
                As of {formatTime(data.t)}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-[#adb3b2]/20 bg-[#f2f4f3]/50 px-3 py-2">
                <dt className="text-[#5a6060] text-xs font-medium">Open</dt>
                <dd className="font-bold tabular-nums text-[#2d3433]">{formatPrice(data.o)}</dd>
              </div>
              <div className="rounded-lg border border-[#adb3b2]/20 bg-[#f2f4f3]/50 px-3 py-2">
                <dt className="text-[#5a6060] text-xs font-medium">High</dt>
                <dd className="font-bold tabular-nums text-[#2d3433]">{formatPrice(data.h)}</dd>
              </div>
              <div className="rounded-lg border border-[#adb3b2]/20 bg-[#f2f4f3]/50 px-3 py-2">
                <dt className="text-[#5a6060] text-xs font-medium">Low</dt>
                <dd className="font-bold tabular-nums text-[#2d3433]">{formatPrice(data.l)}</dd>
              </div>
              <div className="rounded-lg border border-[#adb3b2]/20 bg-[#f2f4f3]/50 px-3 py-2">
                <dt className="text-[#5a6060] text-xs font-medium">Prev close</dt>
                <dd className="font-bold tabular-nums text-[#2d3433]">{formatPrice(data.pc)}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        {!isLoading && !error && !data ? (
          <p className="text-muted-foreground text-sm">No quote data.</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
