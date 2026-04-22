"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketNews } from "@/hooks/use-market-news";

const formatPublished = (timestamp?: number): string => {
  if (!timestamp || !Number.isFinite(timestamp)) {
    return "Time unavailable";
  }

  return new Date(timestamp * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getRelatedSymbols = (related?: string): string[] => {
  if (!related) {
    return [];
  }

  return related
    .split(",")
    .map((symbol) => symbol.trim())
    .filter(Boolean)
    .slice(0, 4);
};

export function MarketNewsFeed() {
  const { items, error, isLoading, refetch } = useMarketNews({
    category: "general",
    limit: 6,
    refreshIntervalMs: 60_000,
  });

  return (
    <Card className="rounded-[28px] border border-[#e6e0db] bg-white shadow-[0_18px_48px_rgba(55,49,45,0.05)]">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-[#4f4e4e]">
              Market news feed
            </CardTitle>
            <CardDescription className="text-[#6a706f]">
              Fresh general headlines from the root Finnhub news proxy.
            </CardDescription>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-[#ddd6d0] bg-[#f9f9f8] text-[#5f5e5e] hover:bg-[#f2efec]"
            onClick={() => {
              void refetch();
            }}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-[20px]" />
            <Skeleton className="h-24 w-full rounded-[20px]" />
            <Skeleton className="h-24 w-full rounded-[20px]" />
          </div>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Could not load market news</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {!isLoading && !error && items.length === 0 ? (
          <p className="text-sm text-[#6a706f]">
            No recent market headlines are available right now.
          </p>
        ) : null}

        {!isLoading && !error && items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => {
              const relatedSymbols = getRelatedSymbols(item.related);

              return (
                <a
                  key={item.id ?? `${item.source}-${item.datetime}`}
                  href={item.url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-[22px] border border-[#ece6e1] bg-[#fbf8f6] px-4 py-4 transition-colors hover:bg-[#f6f2ef]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-[#ddd6d0] bg-white text-[#6a706f]">
                      {item.source || "Unknown source"}
                    </Badge>
                    <span className="text-xs text-[#7b7f7f]">
                      {formatPublished(item.datetime)}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-semibold leading-6 text-[#4f4e4e]">
                    {item.headline || "Untitled market update"}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#6a706f]">
                    {item.summary
                      ? item.summary.slice(0, 220)
                      : "Open the article to review the full market context."}
                    {item.summary && item.summary.length > 220 ? "..." : ""}
                  </p>

                  {relatedSymbols.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {relatedSymbols.map((symbol) => (
                        <Badge
                          key={`${item.id}-${symbol}`}
                          className="border-[#d7dfdb] bg-white text-[#2f6b43]"
                        >
                          {symbol}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </a>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
