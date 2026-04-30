"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowRight, LineChart, Radar, Wallet } from "lucide-react";

import { QuoteWidget } from "@/components/stock/widgets/quote-widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WishlistButton } from "@/components/user/wishlist-button";
import { cn } from "@/lib/utils";
import type { WishlistItemSummary } from "@/lib/user/wishlist-service";

const curatedBuckets = [
  {
    id: "ai-leaders",
    label: "AI leaders",
    description:
      "Large-cap names that often set the tone for growth and hyperscaler sentiment.",
    icon: LineChart,
    symbols: [
      {
        symbol: "NVDA",
        name: "NVIDIA",
        thesis: "AI accelerator demand barometer across cloud and enterprise.",
        catalyst: "Watch for capex and semiconductor momentum.",
        tags: ["Semis", "AI", "Growth"],
      },
      {
        symbol: "MSFT",
        name: "Microsoft",
        thesis: "Cloud platform and enterprise software proxy for AI adoption.",
        catalyst: "Useful when you want a steadier read on platform spend.",
        tags: ["Cloud", "Enterprise", "AI"],
      },
      {
        symbol: "GOOGL",
        name: "Alphabet",
        thesis: "Advertising, cloud, and AI product cycles in one benchmark.",
        catalyst:
          "Good read-through for search monetization and model rollout.",
        tags: ["Ads", "Cloud", "AI"],
      },
      {
        symbol: "META",
        name: "Meta",
        thesis: "Consumer ad demand and open-model investment signal.",
        catalyst: "Often reacts quickly to sentiment around digital ads.",
        tags: ["Ads", "Consumer", "AI"],
      },
    ],
  },
  {
    id: "market-anchors",
    label: "Market anchors",
    description:
      "Highly watched bellwethers that help frame risk appetite and broad index direction.",
    icon: Radar,
    symbols: [
      {
        symbol: "AAPL",
        name: "Apple",
        thesis:
          "Consumer hardware and services heavyweight with broad index influence.",
        catalyst:
          "Useful for checking whether mega-cap demand is defensive or growth-led.",
        tags: ["Consumer", "Mega-cap", "Index"],
      },
      {
        symbol: "AMZN",
        name: "Amazon",
        thesis: "Retail, logistics, and AWS exposure in one liquid benchmark.",
        catalyst: "Tracks both consumer resilience and cloud demand.",
        tags: ["Retail", "Cloud", "Logistics"],
      },
      {
        symbol: "SPY",
        name: "SPDR S&P 500 ETF",
        thesis: "Fast proxy for the broader US equity tape.",
        catalyst:
          "Handy when you want market context before drilling into a single name.",
        tags: ["ETF", "Index", "Macro"],
      },
      {
        symbol: "QQQ",
        name: "Invesco QQQ Trust",
        thesis: "Quick read on the Nasdaq growth complex.",
        catalyst:
          "Pairs well with AI leaders when growth sentiment is moving fast.",
        tags: ["ETF", "Growth", "Nasdaq"],
      },
    ],
  },
  {
    id: "financials-and-cyclicals",
    label: "Financials and cyclicals",
    description:
      "Rate-sensitive and industrial names that often help confirm macro rotation.",
    icon: Wallet,
    symbols: [
      {
        symbol: "JPM",
        name: "JPMorgan Chase",
        thesis:
          "Large-bank read on credit, deposits, and capital markets tone.",
        catalyst: "Watch when rates and macro risk are driving the tape.",
        tags: ["Banking", "Rates", "Macro"],
      },
      {
        symbol: "GS",
        name: "Goldman Sachs",
        thesis: "Capital-markets and risk-on activity proxy.",
        catalyst: "Useful during earnings, deal flow, and volatility swings.",
        tags: ["Banking", "Trading", "Macro"],
      },
      {
        symbol: "XOM",
        name: "Exxon Mobil",
        thesis: "Energy benchmark for commodity-linked rotation.",
        catalyst: "Good cross-check when oil and inflation themes are active.",
        tags: ["Energy", "Inflation", "Commodities"],
      },
      {
        symbol: "CAT",
        name: "Caterpillar",
        thesis: "Industrial demand and infrastructure-sensitive cyclicals.",
        catalyst:
          "Often useful when the market is rotating away from pure tech leadership.",
        tags: ["Industrials", "Cyclicals", "Macro"],
      },
    ],
  },
] as const;

type BucketId = (typeof curatedBuckets)[number]["id"];

type TrendingTabsProps = {
  initialWishlistItemsBySymbol?: Record<string, WishlistItemSummary>;
};

export function TrendingTabs({
  initialWishlistItemsBySymbol = {},
}: TrendingTabsProps) {
  const [activeBucketId, setActiveBucketId] = React.useState<BucketId>(
    curatedBuckets[0].id,
  );
  const [selectedSymbol, setSelectedSymbol] = React.useState<string>(
    curatedBuckets[0].symbols[0].symbol,
  );

  return (
    <Card className="rounded-[28px] border border-border bg-white shadow-[0_18px_48px_rgba(55,49,45,0.05)]">
      <CardHeader className="space-y-3">
        <CardTitle className="text-xl text-on-surface">
          Curated market tabs
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Use curated symbol sets for now, then branch into the migrated stock
          detail and analysis routes for deeper work.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs
          value={activeBucketId}
          onValueChange={(value) => setActiveBucketId(value as BucketId)}
        >
          <TabsList
            variant="line"
            className="mb-6 flex h-auto w-full flex-wrap justify-start gap-2 rounded-none p-0"
          >
            {curatedBuckets.map((bucket) => {
              const Icon = bucket.icon;

              return (
                <TabsTrigger
                  key={bucket.id}
                  value={bucket.id}
                  className="rounded-full border border-border bg-white px-4 py-2 text-surface-tint data-active:border-primary data-active:bg-primary data-active:text-white data-active:after:hidden"
                >
                  <Icon className="h-4 w-4" />
                  {bucket.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {curatedBuckets.map((bucket) => {
            const spotlightSymbol = bucket.symbols.some(
              (item) => item.symbol === selectedSymbol,
            )
              ? selectedSymbol
              : bucket.symbols[0].symbol;
            const spotlight =
              bucket.symbols.find((item) => item.symbol === spotlightSymbol) ??
              bucket.symbols[0];

            return (
              <TabsContent key={bucket.id} value={bucket.id} className="mt-0">
                <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-on-surface">
                        {bucket.label}
                      </p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {bucket.description}
                      </p>
                    </div>

                    <div className="grid gap-3">
                      {bucket.symbols.map((item) => {
                        const isSelected = spotlight.symbol === item.symbol;

                        return (
                          <button
                            key={item.symbol}
                            type="button"
                            onClick={() => setSelectedSymbol(item.symbol)}
                            className={cn(
                              "rounded-[22px] border px-4 py-4 text-left transition-colors",
                              isSelected
                                ? "border-primary bg-primary text-white shadow-[0_12px_28px_rgba(55,49,45,0.12)]"
                                : "border-border bg-card text-on-surface hover:bg-muted",
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">
                                    {item.symbol}
                                  </span>
                                  <span
                                    className={cn(
                                      "text-sm",
                                      isSelected
                                        ? "text-white/75"
                                        : "text-muted-foreground",
                                    )}
                                  >
                                    {item.name}
                                  </span>
                                </div>
                                <p
                                  className={cn(
                                    "mt-2 text-sm leading-6",
                                    isSelected
                                      ? "text-white/85"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {item.thesis}
                                </p>
                              </div>
                              <Badge
                                className={cn(
                                  "border px-2",
                                  isSelected
                                    ? "border-white/20 bg-white/10 text-white"
                                    : "border-border bg-white text-muted-foreground",
                                )}
                              >
                                Focus
                              </Badge>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Card className="rounded-[24px] border border-border bg-card shadow-none">
                      <CardHeader className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="border-border bg-white text-muted-foreground">
                            Spotlight
                          </Badge>
                          {spotlight.tags.map((tag) => (
                            <Badge
                              key={`${spotlight.symbol}-${tag}`}
                              className="border-border bg-white text-finance-success"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div>
                          <CardTitle className="text-xl text-on-surface">
                            {spotlight.symbol} - {spotlight.name}
                          </CardTitle>
                          <CardDescription className="text-muted-foreground">
                            {spotlight.catalyst}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm leading-7 text-muted-foreground">
                          {spotlight.thesis}
                        </p>

                        <div className="flex flex-wrap gap-3">
                          <WishlistButton
                            compact
                            initialWishlistItem={
                              initialWishlistItemsBySymbol[spotlight.symbol] ??
                              null
                            }
                            name={spotlight.name}
                            symbol={spotlight.symbol}
                          />
                          <Button
                            asChild
                            className="h-10 rounded-xl bg-primary px-4 text-white hover:bg-primary/90"
                          >
                            <Link
                              href={`/stock/${encodeURIComponent(spotlight.symbol)}`}
                            >
                              Open stock detail
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            className="h-10 rounded-xl border-border bg-white px-4 text-surface-tint hover:bg-muted"
                          >
                            <Link
                              href={`/analysis/${encodeURIComponent(spotlight.symbol)}`}
                            >
                              Open analysis
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <QuoteWidget symbol={spotlight.symbol} />
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}

