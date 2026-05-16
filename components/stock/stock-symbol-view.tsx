"use client"

import * as React from "react"
import { BasicFinancialsWidget } from "@/components/stock/widgets/basic-financials-widget"
import { PeersWidget } from "@/components/stock/widgets/peers-widget"
import { PriceHistoryChart } from "@/components/stock/widgets/price-history-chart"
import { TechnicalAnalysisPanel } from "@/components/stock/widgets/technical-analysis-panel"
import { QuoteWidget } from "@/components/stock/widgets/quote-widget"
import { RecommendationWidget } from "@/components/stock/widgets/recommendation-widget"
import { cn } from "@/lib/utils"
import { WishlistStar } from "@/components/ui/wishlist-star"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown } from "lucide-react"
import { TradeStockDialog } from "@/components/stock/trade-stock-dialog"
import { useFinnhubQuote } from "@/hooks/use-finnhub-stock-data"

type StockSymbolViewProps = {
  symbol: string
  className?: string
  paperCashUsd?: number
  initialSharesOwned?: number
}

export const StockSymbolView = ({ 
  symbol, 
  className, 
  paperCashUsd = 100000,
  initialSharesOwned = 0
}: StockSymbolViewProps) => {
  const [isBuyOpen, setIsBuyOpen] = React.useState(false)
  const [isSellOpen, setIsSellOpen] = React.useState(false)
  
  const { data: quote } = useFinnhubQuote(symbol)
  const currentPrice = quote?.c ?? null

  return (
    <div className={cn("min-h-screen bg-[#f9f9f8] text-[#2d3433] selection:bg-[#e4e2e1] selection:text-[#525251]")}>
      <div className={cn("mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6", className)}>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-[#2d3433] md:text-4xl">
                {symbol}
              </h1>
              <WishlistStar symbol={symbol} className="size-9 rounded-full bg-white border border-[#adb3b2]/20 shadow-sm" iconClassName="size-5" />
            </div>
            <p className="text-[#5a6060] text-sm font-medium leading-relaxed max-w-lg">
              Comprehensive analysis for {symbol}. Live quotes, technical indicators, and paper trading.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button 
              onClick={() => setIsBuyOpen(true)}
              className="bg-[#f2f4f3] hover:bg-[#e4e2e1] text-[#2d3433] font-bold h-8 px-3 rounded-lg border border-[#adb3b2]/20 transition-all text-xs"
            >
              <TrendingUp className="mr-1.5 size-3" /> Buy Paper Stock
            </Button>
            <Button 
              onClick={() => setIsSellOpen(true)}
              disabled={initialSharesOwned <= 0}
              title={initialSharesOwned <= 0 ? "You do not currently own this stock" : "Sell shares"}
              className={cn(
                "font-bold h-8 px-3 rounded-lg border transition-all text-xs",
                initialSharesOwned > 0 
                  ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200" 
                  : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
              )}
            >
              <TrendingDown className="mr-1.5 size-3" /> Sell
            </Button>
          </div>
        </header>

      <QuoteWidget 
        symbol={symbol} 
        onBuy={() => setIsBuyOpen(true)}
        onSell={() => setIsSellOpen(true)}
        canSell={initialSharesOwned > 0}
      />

      <TechnicalAnalysisPanel symbol={symbol} />

      <PriceHistoryChart symbol={symbol} />

      <div className="grid gap-6 md:grid-cols-2">
        <BasicFinancialsWidget symbol={symbol} className="min-h-0 md:col-span-1" />
        <RecommendationWidget symbol={symbol} className="min-h-0 md:col-span-1" />
      </div>

      <PeersWidget symbol={symbol} />

      <TradeStockDialog 
        isOpen={isBuyOpen} 
        onOpenChange={setIsBuyOpen} 
        mode="buy" 
        symbol={symbol} 
        currentPrice={currentPrice} 
        availableCash={paperCashUsd} 
        sharesOwned={initialSharesOwned}
      />
      <TradeStockDialog 
        isOpen={isSellOpen} 
        onOpenChange={setIsSellOpen} 
        mode="sell" 
        symbol={symbol} 
        currentPrice={currentPrice} 
        availableCash={paperCashUsd} 
        sharesOwned={initialSharesOwned}
      />
      </div>
    </div>
  )
}
