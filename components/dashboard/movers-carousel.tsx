"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import type { MoverRow } from "@/lib/fmp/biggest-movers";
import type { ExplainMoveResponse } from "@/lib/stocks/explain-move-schema";
import { cn } from "@/lib/utils";

type MoversCarouselProps = {
  gainers: MoverRow[];
  losers: MoverRow[];
};

const formatPrice = (value: number | null): string => {
  if (value === null) return "-";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
};

const formatPct = (value: number | null): string => {
  if (value === null) return "-";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
};

const formatChange = (value: number | null): string => {
  if (value === null) return "-";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
};

const formatCategoryLabel = (value: string): string =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const interleaveMovers = (gainers: MoverRow[], losers: MoverRow[]): MoverRow[] => {
  const rows: MoverRow[] = [];
  const count = Math.max(gainers.length, losers.length);

  for (let index = 0; index < count; index += 1) {
    if (index < gainers.length) rows.push(gainers[index]);
    if (index < losers.length) rows.push(losers[index]);
  }

  return rows;
};

const rowKey = (row: MoverRow): string => `${row.kind}:${row.symbol}`;

export const MoversCarousel = ({ gainers, losers }: MoversCarouselProps) => {
  const items = React.useMemo(
    () => interleaveMovers(gainers, losers).slice(0, 20),
    [gainers, losers],
  );
  const [openKey, setOpenKey] = React.useState<string | null>(null);
  const [explanations, setExplanations] = React.useState<
    Record<string, ExplainMoveResponse>
  >({});
  const [loading, setLoading] = React.useState<Record<string, boolean>>({});
  const [errors, setErrors] = React.useState<Record<string, string | null>>({});
  const abortRef = React.useRef<AbortController | null>(null);

  const requestExplanation = React.useCallback(
    async (row: MoverRow, force = false) => {
      const key = rowKey(row);
      if (!force && explanations[key]) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading((state) => ({ ...state, [key]: true }));
      setErrors((state) => ({ ...state, [key]: null }));

      try {
        const response = await fetch("/api/stocks/explain-move", {
          body: JSON.stringify({
            change: row.change ?? 0,
            changesPercentage: row.changePct ?? 0,
            companyName: row.name,
            direction: row.kind,
            exchange: row.exchange,
            price: row.price ?? 0,
            symbol: row.symbol,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: controller.signal,
        });
        const json = (await response.json().catch(() => null)) as
          | ExplainMoveResponse
          | { error?: string }
          | null;

        if (controller.signal.aborted) return;

        if (!response.ok) {
          setErrors((state) => ({
            ...state,
            [key]:
              json && "error" in json && typeof json.error === "string"
                ? json.error
                : "Could not generate explanation right now.",
          }));
          return;
        }

        if (json && "likelyReason" in json) {
          setExplanations((state) => ({
            ...state,
            [key]: json as ExplainMoveResponse,
          }));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setErrors((state) => ({
          ...state,
          [key]: "Could not generate explanation right now.",
        }));
      } finally {
        if (!controller.signal.aborted) {
          setLoading((state) => ({ ...state, [key]: false }));
        }
      }
    },
    [explanations],
  );

  React.useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No mover data is available right now.
      </p>
    );
  }

  return (
    <div
      aria-label="Biggest stock gainers and losers"
      className="relative overflow-hidden"
      role="region"
    >
      <div className="movers-marquee-track flex w-max gap-3 py-1">
        {[0, 1].map((strip) => (
          <div
            aria-hidden={strip === 1}
            className="flex shrink-0 gap-3"
            key={strip}
          >
            {items.map((row) => {
              const key = rowKey(row);
              return (
                <MoverCard
                  error={errors[key] ?? null}
                  explanation={explanations[key] ?? null}
                  key={`${strip}-${key}`}
                  loading={Boolean(loading[key])}
                  onOpenChange={(open) => {
                    setOpenKey(open ? key : null);
                    if (open) void requestExplanation(row);
                  }}
                  onRetry={() => void requestExplanation(row, true)}
                  open={strip === 0 && openKey === key}
                  row={row}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

const MoverCard = ({
  row,
  open,
  loading,
  error,
  explanation,
  onOpenChange,
  onRetry,
}: {
  row: MoverRow;
  open: boolean;
  loading: boolean;
  error: string | null;
  explanation: ExplainMoveResponse | null;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
}) => {
  const isGainer = row.kind === "gainer";
  const directionClass = isGainer
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-600 dark:text-red-400";

  return (
    <Popover modal={false} onOpenChange={onOpenChange} open={open}>
      <PopoverAnchor asChild>
        <div className="bg-card flex h-[136px] w-[260px] shrink-0 flex-col rounded-lg border p-3 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                className="font-mono text-base font-semibold hover:underline"
                href={`/stock/${encodeURIComponent(row.symbol)}`}
              >
                {row.symbol}
              </Link>
              <p className="text-muted-foreground line-clamp-2 text-xs">
                {row.name}
              </p>
            </div>
            <Badge
              className={cn("capitalize", directionClass)}
              variant="outline"
            >
              {row.kind}
            </Badge>
          </div>

          <div className="mt-auto flex items-end justify-between gap-2 border-t pt-2">
            <div>
              <p className="text-muted-foreground text-[10px] font-medium uppercase">
                Last
              </p>
              <p className="text-sm font-medium tabular-nums">
                ${formatPrice(row.price)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-[10px] font-medium uppercase">
                Change
              </p>
              <p className={cn("text-sm font-semibold tabular-nums", directionClass)}>
                {formatChange(row.change)} ({formatPct(row.changePct)})
              </p>
            </div>
          </div>

          <Button
            className="mt-2 h-6 self-start px-2 text-xs"
            onClick={() => onOpenChange(true)}
            type="button"
            variant="secondary"
          >
            Explain
          </Button>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-[360px] max-w-[calc(100vw-2rem)] p-4"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <MoveExplanationContent
          error={error}
          explanation={explanation}
          loading={loading}
          onRetry={onRetry}
          row={row}
        />
      </PopoverContent>
    </Popover>
  );
};

const MoveExplanationContent = ({
  row,
  loading,
  error,
  explanation,
  onRetry,
}: {
  row: MoverRow;
  loading: boolean;
  error: string | null;
  explanation: ExplainMoveResponse | null;
  onRetry: () => void;
}) => (
  <div className="space-y-3">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-mono text-base font-semibold">{row.symbol}</p>
        <p className="text-muted-foreground text-xs">{row.name}</p>
      </div>
      <Badge className="capitalize" variant="outline">
        {row.kind}
      </Badge>
    </div>

    {loading ? (
      <div aria-busy aria-live="polite" className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-12 w-full" />
      </div>
    ) : null}

    {error && !loading ? (
      <div className="space-y-2">
        <p className="text-destructive text-sm">{error}</p>
        <Button className="gap-1.5" onClick={onRetry} size="sm" type="button" variant="outline">
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      </div>
    ) : null}

    {explanation && !loading ? (
      <div className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {formatCategoryLabel(explanation.category)}
          </Badge>
          <Badge className="capitalize" variant="outline">
            {explanation.confidence}
          </Badge>
        </div>
        <p>{explanation.likelyReason}</p>
        {explanation.evidence.length > 0 ? (
          <ul className="space-y-2 text-xs">
            {explanation.evidence.map((item, index) => (
              <li key={`${item.headline}-${index}`}>
                {item.url ? (
                  <a
                    className="text-primary inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline"
                    href={item.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span>{item.headline}</span>
                    <ExternalLink className="size-3" />
                  </a>
                ) : (
                  <span className="font-medium">{item.headline}</span>
                )}
                <p className="text-muted-foreground mt-0.5">{item.relevance}</p>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="text-muted-foreground text-xs">{explanation.caveat}</p>
      </div>
    ) : null}
  </div>
);
