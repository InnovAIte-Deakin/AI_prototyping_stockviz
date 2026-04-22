"use client";

import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinnhubQuote } from "@/hooks/use-finnhub-stock-data";
import { cn } from "@/lib/utils";

type QuoteWidgetProps = {
  symbol: string;
  className?: string;
};

const formatPrice = (n: number | undefined): string => {
  if (n === undefined || !Number.isFinite(n)) {
    return "—";
  }
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

const formatTime = (t: number | undefined): string => {
  if (t === undefined || !Number.isFinite(t)) {
    return "—";
  }
  return new Date(t * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export const QuoteWidget = ({ symbol, className }: QuoteWidgetProps) => {
  const { data, error, isLoading } = useFinnhubQuote(symbol);

  const c = data?.c;
  const pc = data?.pc;
  const change =
    c !== undefined &&
    pc !== undefined &&
    Number.isFinite(c) &&
    Number.isFinite(pc)
      ? c - pc
      : undefined;
  const pctChange =
    change !== undefined && pc !== undefined && pc !== 0
      ? (change / pc) * 100
      : undefined;

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Quote</CardTitle>
        <CardDescription>
          Last trade and session stats (Finnhub). US quote data.
        </CardDescription>
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
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Could not load quote</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {!isLoading && !error && data ? (
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Last
              </p>
              <p className="text-3xl font-semibold tabular-nums tracking-tight">
                {formatPrice(c)}
              </p>
              {change !== undefined && pctChange !== undefined ? (
                <p
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    change >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  {change >= 0 ? "+" : ""}
                  {formatPrice(change)} ({pctChange >= 0 ? "+" : ""}
                  {pctChange.toFixed(2)}%)
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">Change n/a</p>
              )}
              <p className="text-muted-foreground mt-1 text-xs">
                As of {formatTime(data.t)}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <dt className="text-muted-foreground text-xs">Open</dt>
                <dd className="font-medium tabular-nums">
                  {formatPrice(data.o)}
                </dd>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <dt className="text-muted-foreground text-xs">High</dt>
                <dd className="font-medium tabular-nums">
                  {formatPrice(data.h)}
                </dd>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <dt className="text-muted-foreground text-xs">Low</dt>
                <dd className="font-medium tabular-nums">
                  {formatPrice(data.l)}
                </dd>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <dt className="text-muted-foreground text-xs">Prev close</dt>
                <dd className="font-medium tabular-nums">
                  {formatPrice(data.pc)}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        {!isLoading && !error && !data ? (
          <p className="text-muted-foreground text-sm">No quote data.</p>
        ) : null}
      </CardContent>
    </Card>
  );
};
