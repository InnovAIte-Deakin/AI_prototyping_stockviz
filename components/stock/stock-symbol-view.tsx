"use client";

import { PaperTradeWidget } from "@/components/stock/paper-trade-widget";
import { BasicFinancialsWidget } from "@/components/stock/widgets/basic-financials-widget";
import { PeersWidget } from "@/components/stock/widgets/peers-widget";
import { PriceHistoryChart } from "@/components/stock/widgets/price-history-chart";
import { QuoteWidget } from "@/components/stock/widgets/quote-widget";
import { RecommendationWidget } from "@/components/stock/widgets/recommendation-widget";
import { TechnicalAnalysisPanel } from "@/components/stock/widgets/technical-analysis-panel";
import { WishlistStar } from "@/components/user/wishlist-star";
import { cn } from "@/lib/utils";
import type { WishlistItemSummary } from "@/lib/user/wishlist-service";

type StockSymbolViewProps = {
  symbol: string;
  className?: string;
  initialPaperCashUsd?: number | null;
  initialWishlistItem?: WishlistItemSummary | null;
};

export const StockSymbolView = ({
  initialPaperCashUsd,
  initialWishlistItem,
  symbol,
  className,
}: StockSymbolViewProps) => {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {symbol}
          </h1>
          <p className="text-muted-foreground text-sm">
            Quote, metrics, peers, and analyst data via Finnhub; historical
            prices via Yahoo Finance.
          </p>
        </div>
        <WishlistStar
          className="size-10 border"
          iconClassName="size-5"
          initialWishlistItem={initialWishlistItem}
          symbol={symbol}
        />
      </header>

      <QuoteWidget symbol={symbol} />

      {typeof initialPaperCashUsd === "number" ? (
        <PaperTradeWidget
          initialPaperCashUsd={initialPaperCashUsd}
          symbol={symbol}
        />
      ) : null}

      <TechnicalAnalysisPanel symbol={symbol} />

      <PriceHistoryChart symbol={symbol} />

      <div className="grid gap-6 md:grid-cols-2">
        <BasicFinancialsWidget
          symbol={symbol}
          className="min-h-0 md:col-span-1"
        />
        <RecommendationWidget
          symbol={symbol}
          className="min-h-0 md:col-span-1"
        />
      </div>

      <PeersWidget symbol={symbol} />
    </div>
  );
};
