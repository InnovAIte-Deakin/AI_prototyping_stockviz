"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowDownToLine, ArrowUpFromLine, DollarSign } from "lucide-react";
import { toast } from "sonner";

import {
  buyPaperShares,
  sellPaperShares,
} from "@/app/portfolio/paper-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinnhubQuote } from "@/hooks/use-finnhub-stock-data";
import { cn } from "@/lib/utils";

type PaperTradeWidgetProps = {
  className?: string;
  initialPaperCashUsd: number;
  symbol: string;
};

const formatCurrency = (value: number | null | undefined): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "--";
  }

  return new Intl.NumberFormat(undefined, {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);
};

const parseShares = (value: string): number | null => {
  const shares = Number.parseFloat(value);
  return Number.isFinite(shares) && shares > 0 ? shares : null;
};

export function PaperTradeWidget({
  className,
  initialPaperCashUsd,
  symbol,
}: PaperTradeWidgetProps) {
  const router = useRouter();
  const { data: quote, error, isLoading } = useFinnhubQuote(symbol);
  const [sharesInput, setSharesInput] = useState("1");
  const [paperCashUsd, setPaperCashUsd] = useState(initialPaperCashUsd);
  const [isPending, startTransition] = useTransition();

  const shares = parseShares(sharesInput);
  const lastPrice =
    typeof quote?.c === "number" && Number.isFinite(quote.c) && quote.c > 0
      ? quote.c
      : null;
  const estimatedNotional = useMemo(() => {
    if (shares === null || lastPrice === null) {
      return null;
    }

    return shares * lastPrice;
  }, [lastPrice, shares]);
  const canSubmit = !isPending && shares !== null && lastPrice !== null;

  const trade = (side: "buy" | "sell") => {
    if (!shares) {
      toast.error("Enter shares greater than 0.");
      return;
    }

    startTransition(async () => {
      const result =
        side === "buy"
          ? await buyPaperShares(symbol, shares)
          : await sellPaperShares(symbol, shares);

      if (result.status === "success") {
        toast.success(result.message);

        const executionPriceUsd = result.priceUsd;
        if (typeof executionPriceUsd === "number") {
          setPaperCashUsd((current) => {
            const cashDelta = executionPriceUsd * shares;
            return side === "buy" ? current - cashDelta : current + cashDelta;
          });
        }

        router.refresh();
        return;
      }

      toast.error(result.message);
    });
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="size-4 text-emerald-600" />
          Paper trade
        </CardTitle>
        <CardDescription>
          Buy or sell simulated shares at the latest Finnhub quote.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            <p className="text-muted-foreground text-xs">Paper cash</p>
            <p className="font-semibold tabular-nums">
              {formatCurrency(paperCashUsd)}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            <p className="text-muted-foreground text-xs">Last quote</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-5 w-20" />
            ) : (
              <p className="font-semibold tabular-nums">
                {formatCurrency(lastPrice)}
              </p>
            )}
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            <p className="text-muted-foreground text-xs">Estimated trade</p>
            <p className="font-semibold tabular-nums">
              {formatCurrency(estimatedNotional)}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor={`paper-shares-${symbol}`}>Shares</Label>
            <Input
              id={`paper-shares-${symbol}`}
              inputMode="decimal"
              min="0"
              onChange={(event) => setSharesInput(event.target.value)}
              placeholder="1"
              step="0.0001"
              type="number"
              value={sharesInput}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              disabled={!canSubmit}
              onClick={() => trade("buy")}
              type="button"
            >
              <ArrowDownToLine />
              Buy
            </Button>
            <Button
              disabled={!canSubmit}
              onClick={() => trade("sell")}
              type="button"
              variant="outline"
            >
              <ArrowUpFromLine />
              Sell
            </Button>
          </div>
        </div>

        {error ? (
          <p className="text-destructive text-sm">
            Live quote unavailable: {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
