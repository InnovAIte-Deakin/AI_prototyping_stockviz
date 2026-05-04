"use client"

import { BasicFinancialsWidget } from "@/components/stock/widgets/basic-financials-widget"
import { PeersWidget } from "@/components/stock/widgets/peers-widget"
import { PaperTradeWidget } from "@/components/stock/paper-trade-widget"
import { PriceHistoryChart } from "@/components/stock/widgets/price-history-chart"
import { QuoteWidget } from "@/components/stock/widgets/quote-widget"
import { RecommendationWidget } from "@/components/stock/widgets/recommendation-widget"
import { cn } from "@/lib/utils"
import { WishlistStar } from "@/components/ui/wishlist-star"

type StockSymbolViewProps = {
  symbol: string
  className?: string
  /** When set, shows paper trading card with this cash balance. */
  paperCashUsd?: number
}

export const StockSymbolView = ({ symbol, className, paperCashUsd }: StockSymbolViewProps) => {
  return (
    <div className={cn("mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6", className)}>
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {symbol}
          </h1>
          <WishlistStar symbol={symbol} className="size-8 rounded-full bg-muted/50" iconClassName="size-5" />
        </div>
        <p className="text-muted-foreground text-sm">
          Quote, metrics, peers, and analyst data via Finnhub; historical prices
          via Alpha Vantage.
        </p>
      </header>

      <QuoteWidget symbol={symbol} />

      {paperCashUsd !== undefined ? <PaperTradeWidget symbol={symbol} initialPaperCashUsd={paperCashUsd} /> : null}

      <PriceHistoryChart symbol={symbol} />

      <div className="grid gap-6 md:grid-cols-2">
        <BasicFinancialsWidget symbol={symbol} className="min-h-0 md:col-span-1" />
        <RecommendationWidget symbol={symbol} className="min-h-0 md:col-span-1" />
      </div>

      <PeersWidget symbol={symbol} />
    </div>
  )
}
