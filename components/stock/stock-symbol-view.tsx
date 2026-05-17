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
import { PriceTriggerPanel } from "@/components/stock/price-trigger-panel"
import EarningsCalendarWidget from "@/components/stock/widgets/earnings-calendar-widget"

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
    <div className={cn("min-h-screen bg-background text-foreground selection:bg-accent selection:text-accent-foreground")}>
      <div className={cn("mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6", className)}>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-4xl">
                {symbol}
              </h1>
              <WishlistStar symbol={symbol} className="size-9 rounded-full bg-card border border-border/20 shadow-sm" iconClassName="size-5" />
            </div>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-lg">
              Comprehensive analysis for {symbol}. Live quotes, technical indicators, and paper trading.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button 
              onClick={() => setIsBuyOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-8 px-3 rounded-lg border border-border/20 transition-all text-xs"
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
                  ? "bg-finance-danger/10 text-finance-danger border-finance-danger/20 hover:bg-finance-danger/20" 
                  : "bg-muted/20 text-muted-foreground border-muted cursor-not-allowed opacity-60"
              )}
            >
              <TrendingDown className="mr-1.5 size-3" /> Sell
            </Button>
          </div>
        </header>

        <QuoteWidget symbol={symbol} />

        <TechnicalAnalysisPanel symbol={symbol} />

        <PriceHistoryChart symbol={symbol} />

        <PriceTriggerPanel symbol={symbol} currentPrice={currentPrice} />

        <div className="grid gap-6 md:grid-cols-2">
          <BasicFinancialsWidget symbol={symbol} className="min-h-0 md:col-span-1" />
          <RecommendationWidget symbol={symbol} className="min-h-0 md:col-span-1" />
        </div>

        <PeersWidget symbol={symbol} />

        <EarningsCalendarWidget symbol={symbol} />

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