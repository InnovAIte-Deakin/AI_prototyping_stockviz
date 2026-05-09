import Link from "next/link";
import { ArrowRight, Globe, Newspaper, TrendingUp } from "lucide-react";

import { StockSymbolSearch } from "@/components/layout/stock-symbol-search";
import { MarketNewsFeed } from "@/components/market/market-news-feed";
import { MarketStatusCard } from "@/components/market/market-status-card";
import { TrendingTabs } from "@/components/market/trending-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getWishlistItemsForCurrentUserBySymbols } from "@/lib/user/wishlist-service";

const marketSignals = [
  {
    title: "Live session read",
    description:
      "See whether the US market is open, which session is active, and when the current snapshot was captured.",
    icon: Globe,
  },
  {
    title: "Fresh headlines",
    description:
      "Keep the browse surface grounded in the latest general market news from the root Finnhub proxy.",
    icon: Newspaper,
  },
  {
    title: "Curated discovery",
    description:
      "Start from tracked symbol groups, then open full stock detail or analysis from root routes.",
    icon: TrendingUp,
  },
];

const curatedMarketSymbols = [
  "NVDA",
  "MSFT",
  "GOOGL",
  "META",
  "AAPL",
  "AMZN",
  "SPY",
  "QQQ",
  "JPM",
  "GS",
  "XOM",
  "CAT",
];

export async function MarketOverview() {
  const initialWishlistItemsBySymbol =
    await getWishlistItemsForCurrentUserBySymbols(curatedMarketSymbols);

  return (
    <div className="min-h-screen bg-surface px-6 py-10 text-on-background md:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[30px] border border-border bg-white p-8 shadow-[0_24px_64px_rgba(55,49,45,0.07)]">
          <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-border bg-finance-success/10 text-finance-success">
                  Route live
                </Badge>
                <Badge className="border-border bg-muted text-muted-foreground">
                  Root app market surface
                </Badge>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  Browse-first workspace
                </p>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-surface-tint md:text-5xl">
                  Track the live session, scan the news, and branch into stock
                  detail from one market page.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                  The migration shell now includes a dedicated market route that
                  stays grounded in the live root APIs. Use it to browse the US
                  session, review fresh headlines, and jump into stock detail or
                  analysis from curated symbol groups.
                </p>
              </div>

              <div className="rounded-[24px] border border-border bg-card p-5">
                <p className="mb-3 text-sm font-medium text-muted-foreground">
                  Open an analysis route
                </p>
                <StockSymbolSearch className="max-w-none" exchange="US" />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="h-11 rounded-xl bg-primary px-5 text-white hover:bg-primary/90"
                >
                  <Link href="/stock/AAPL">
                    Open AAPL detail
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-xl border-border bg-surface px-5 text-surface-tint hover:bg-muted"
                >
                  <Link href="/analysis/NVDA">
                    Open NVDA analysis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              {marketSignals.map((signal) => {
                const Icon = signal.icon;
                return (
                  <Card
                    key={signal.title}
                    className="rounded-[24px] border border-border bg-card py-0 shadow-none"
                  >
                    <CardContent className="p-5">
                      <div className="mb-4 inline-flex rounded-2xl bg-white p-3 text-surface-tint shadow-[0_10px_24px_rgba(55,49,45,0.05)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h2 className="text-lg font-semibold text-on-surface">
                        {signal.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {signal.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <MarketStatusCard />
          <MarketNewsFeed />
        </section>

        <section className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Curated discovery
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-on-surface md:text-3xl">
              Start from symbol clusters, then drill into the existing stock
              detail workflow.
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Until a dedicated trending service lands, these tabs provide a
              stable root-app discovery surface using liquid US symbols that map
              cleanly into the migrated stock and analysis routes.
            </p>
          </div>

          <TrendingTabs
            initialWishlistItemsBySymbol={initialWishlistItemsBySymbol}
          />
        </section>
      </div>
    </div>
  );
}

