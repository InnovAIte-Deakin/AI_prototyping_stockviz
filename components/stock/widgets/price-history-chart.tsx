"use client";

import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, RefreshCw, X } from "lucide-react";

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
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type PriceHistoryTab,
  usePriceSeries,
} from "@/hooks/use-price-series";
import {
  computeSelectedRangeStats,
  findChartIndicesForUserDates,
  type ChartBarForRange,
  type SelectedRangePayload,
} from "@/lib/stocks/compute-price-range-stats";
import type { RangeExplanation } from "@/lib/stocks/explain-range-schema";
import { cn } from "@/lib/utils";

type PriceHistoryChartProps = {
  symbol: string;
  companyName?: string;
  className?: string;
};

type CommittedSelection = { hi: number; lo: number };

const chartConfig = {
  close: {
    color: "var(--chart-1)",
    label: "Close",
  },
} satisfies ChartConfig;

const formatUsd = (value: number): string =>
  new Intl.NumberFormat(undefined, {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);

const toRowsFromDailyMonthly = (
  points: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>,
): ChartBarForRange[] =>
  points.map((point) => ({
    close: point.close,
    high: point.high,
    low: point.low,
    open: point.open,
    period: point.date,
    volume: point.volume,
  }));

const toRowsFromYearly = (
  points: Array<{
    year: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>,
): ChartBarForRange[] =>
  points.map((point) => ({
    close: point.close,
    high: point.high,
    low: point.low,
    open: point.open,
    period: point.year,
    volume: point.volume,
  }));

const formatPeriodLabel = (tab: PriceHistoryTab, period: string): string => {
  if (tab === "yearly") return period;

  const date = new Date(`${period}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return period;

  if (tab === "monthly") {
    return date.toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatShortRange = (from: string, to: string): string => {
  const fromDate = new Date(`${from}T12:00:00Z`);
  const toDate = new Date(`${to}T12:00:00Z`);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return `${from} - ${to}`;
  }

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };

  return `${fromDate.toLocaleDateString(
    undefined,
    options,
  )} - ${toDate.toLocaleDateString(undefined, options)}`;
};

const readActiveIndex = (state: unknown): number | null => {
  if (!state || typeof state !== "object") return null;

  const index = (state as { activeTooltipIndex?: number }).activeTooltipIndex;
  if (typeof index !== "number" || index < 0) return null;

  return index;
};

const cacheKeyForRange = (
  symbol: string,
  payload: SelectedRangePayload,
): string =>
  `${symbol.trim().toUpperCase()}:${payload.from}:${payload.to}:${payload.percentageChange.toFixed(
    2,
  )}`;

export const PriceHistoryChart = ({
  symbol,
  companyName,
  className,
}: PriceHistoryChartProps) => {
  const [tab, setTab] = React.useState<PriceHistoryTab>("daily");
  const {
    daily,
    monthly,
    yearly,
    errorDaily,
    errorMonthly,
    isLoadingDaily,
    isLoadingMonthly,
  } = usePriceSeries(symbol, tab);

  const handleTabChange = (value: string) => {
    if (value === "daily" || value === "monthly" || value === "yearly") {
      setTab(value);
    }
  };

  const dailyRows = React.useMemo(
    () => (daily ? toRowsFromDailyMonthly(daily) : []),
    [daily],
  );
  const monthlyRows = React.useMemo(
    () => (monthly ? toRowsFromDailyMonthly(monthly) : []),
    [monthly],
  );
  const yearlyRows = React.useMemo(
    () => (yearly.length > 0 ? toRowsFromYearly(yearly) : []),
    [yearly],
  );

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Price history</CardTitle>
        <CardDescription>
          Historical OHLC from the configured market-data provider; yearly bars
          are aggregated from monthly data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList aria-label="Price history range">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-4 min-h-[320px]">
            <SelectableChartSection
              chartRows={dailyRows}
              companyName={companyName}
              errorMessage={errorDaily}
              showError={Boolean(errorDaily)}
              showLoading={isLoadingDaily}
              symbol={symbol}
              tab="daily"
            />
          </TabsContent>
          <TabsContent value="monthly" className="mt-4 min-h-[320px]">
            <SelectableChartSection
              chartRows={monthlyRows}
              companyName={companyName}
              errorMessage={errorMonthly}
              showError={Boolean(errorMonthly)}
              showLoading={isLoadingMonthly}
              symbol={symbol}
              tab="monthly"
            />
          </TabsContent>
          <TabsContent value="yearly" className="mt-4 min-h-[320px]">
            <SelectableChartSection
              chartRows={yearlyRows}
              companyName={companyName}
              errorMessage={errorMonthly}
              showError={Boolean(errorMonthly)}
              showLoading={isLoadingMonthly}
              symbol={symbol}
              tab="yearly"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const SelectableChartSection = ({
  tab,
  chartRows,
  symbol,
  companyName,
  showLoading,
  showError,
  errorMessage,
}: {
  tab: PriceHistoryTab;
  chartRows: ChartBarForRange[];
  symbol: string;
  companyName?: string;
  showLoading: boolean;
  showError: boolean;
  errorMessage: string | null;
}) => {
  const [isSelecting, setIsSelecting] = React.useState(false);
  const [, forceDragRender] = React.useReducer((value: number) => value + 1, 0);
  const [committed, setCommitted] =
    React.useState<CommittedSelection | null>(null);
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [rangeStats, setRangeStats] =
    React.useState<SelectedRangePayload | null>(null);
  const [explanation, setExplanation] =
    React.useState<RangeExplanation | null>(null);
  const [explainLoading, setExplainLoading] = React.useState(false);
  const [explainError, setExplainError] = React.useState<string | null>(null);
  const [mobileFrom, setMobileFrom] = React.useState("");
  const [mobileTo, setMobileTo] = React.useState("");
  const isSelectingRef = React.useRef(false);
  const dragRef = React.useRef({ a: 0, b: 0 });
  const explainCache = React.useRef(new Map<string, RangeExplanation>());
  const abortRef = React.useRef<AbortController | null>(null);
  const isYearlyTab = tab === "yearly";

  const clearSelection = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    isSelectingRef.current = false;
    setIsSelecting(false);
    setCommitted(null);
    setPopoverOpen(false);
    setRangeStats(null);
    setExplanation(null);
    setExplainError(null);
    setExplainLoading(false);
  }, []);

  React.useEffect(() => {
    clearSelection();
    setMobileFrom("");
    setMobileTo("");
  }, [tab, symbol, clearSelection]);

  const runExplainRequest = React.useCallback(
    async (stats: SelectedRangePayload) => {
      const key = cacheKeyForRange(symbol, stats);
      const cached = explainCache.current.get(key);
      if (cached) {
        setExplanation(cached);
        setExplainError(null);
        setExplainLoading(false);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setExplanation(null);
      setExplainError(null);
      setExplainLoading(true);

      try {
        const response = await fetch("/api/stocks/explain-range", {
          body: JSON.stringify({
            ...stats,
            companyName: companyName?.trim() || undefined,
            symbol: symbol.trim().toUpperCase(),
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: controller.signal,
        });
        const json = (await response.json()) as
          | RangeExplanation
          | { error?: string };

        if (controller.signal.aborted) return;

        if (!response.ok) {
          setExplainError(
            typeof (json as { error?: string }).error === "string"
              ? (json as { error: string }).error
              : "Could not generate explanation right now.",
          );
          return;
        }

        if ("summary" in json && "mainDrivers" in json) {
          const value = json as RangeExplanation;
          explainCache.current.set(key, value);
          setExplanation(value);
        } else {
          setExplainError("Could not generate explanation right now.");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setExplainError("Could not generate explanation right now.");
      } finally {
        if (!controller.signal.aborted) {
          setExplainLoading(false);
        }
      }
    },
    [companyName, symbol],
  );

  const commitSelection = React.useCallback(
    (lo: number, hi: number) => {
      if (hi - lo < 1) return;

      const stats = computeSelectedRangeStats(chartRows, lo, hi, isYearlyTab);
      if (!stats) return;

      setCommitted({ hi, lo });
      setRangeStats(stats);
      setPopoverOpen(true);
      void runExplainRequest(stats);
    },
    [chartRows, isYearlyTab, runExplainRequest],
  );

  const finalizeDrag = React.useCallback(() => {
    if (!isSelectingRef.current) return;

    isSelectingRef.current = false;
    setIsSelecting(false);

    commitSelection(
      Math.min(dragRef.current.a, dragRef.current.b),
      Math.max(dragRef.current.a, dragRef.current.b),
    );
  }, [commitSelection]);

  React.useEffect(() => {
    if (!isSelecting) return;

    const handleWindowPointerEnd = () => {
      finalizeDrag();
    };

    window.addEventListener("mouseup", handleWindowPointerEnd);
    window.addEventListener("touchend", handleWindowPointerEnd);

    return () => {
      window.removeEventListener("mouseup", handleWindowPointerEnd);
      window.removeEventListener("touchend", handleWindowPointerEnd);
    };
  }, [finalizeDrag, isSelecting]);

  const handleChartMouseDown = React.useCallback(
    (state: unknown) => {
      const index = readActiveIndex(state);
      if (index === null || index >= chartRows.length) return;

      dragRef.current = { a: index, b: index };
      isSelectingRef.current = true;
      setIsSelecting(true);
      forceDragRender();
    },
    [chartRows.length],
  );

  const handleChartMouseMove = React.useCallback(
    (state: unknown) => {
      if (!isSelectingRef.current) return;

      const index = readActiveIndex(state);
      if (index === null || index >= chartRows.length) return;

      dragRef.current.b = index;
      forceDragRender();
    },
    [chartRows.length],
  );

  const handleRetry = React.useCallback(() => {
    if (rangeStats) {
      void runExplainRequest(rangeStats);
    }
  }, [rangeStats, runExplainRequest]);

  const handleApplyMobileRange = React.useCallback(() => {
    if (!mobileFrom || !mobileTo) return;

    const fromIso =
      tab === "monthly"
        ? `${mobileFrom}-01`
        : tab === "yearly"
          ? `${mobileFrom}-01-01`
          : mobileFrom;
    const toIso =
      tab === "monthly"
        ? `${mobileTo}-01`
        : tab === "yearly"
          ? `${mobileTo}-12-31`
          : mobileTo;
    const found = findChartIndicesForUserDates(chartRows, tab, fromIso, toIso);
    if (!found) return;

    commitSelection(
      Math.min(found.start, found.end),
      Math.max(found.start, found.end),
    );
  }, [chartRows, commitSelection, mobileFrom, mobileTo, tab]);

  if (showLoading) {
    return (
      <div className="space-y-3 pt-2">
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </div>
    );
  }

  if (showError && errorMessage) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Could not load price history</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    );
  }

  if (chartRows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No price data for this range.
      </p>
    );
  }

  const provisional =
    isSelecting && isSelectingRef.current
      ? {
          hi: Math.max(dragRef.current.a, dragRef.current.b),
          lo: Math.min(dragRef.current.a, dragRef.current.b),
        }
      : committed;
  const referenceArea =
    provisional && provisional.hi > provisional.lo ? (
      <ReferenceArea
        fill="var(--chart-1)"
        fillOpacity={0.12}
        strokeOpacity={0.4}
        x1={chartRows[provisional.lo].period}
        x2={chartRows[provisional.hi].period}
      />
    ) : null;

  return (
    <div className="relative space-y-3">
      <ChartContainer
        className="aspect-auto h-[min(360px,50vh)] w-full"
        config={chartConfig}
      >
        <LineChart
          accessibilityLayer
          data={chartRows}
          margin={{ bottom: 8, left: 8, right: 8, top: 8 }}
          onMouseDown={handleChartMouseDown}
          onMouseMove={handleChartMouseMove}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="period"
            minTickGap={24}
            tickFormatter={(value) =>
              typeof value === "string"
                ? formatPeriodLabel(tab, value)
                : String(value)
            }
            tickLine={false}
            tickMargin={8}
          />
          <YAxis
            axisLine={false}
            domain={["auto", "auto"]}
            tickFormatter={(value) =>
              typeof value === "number" ? formatUsd(value) : String(value)
            }
            tickLine={false}
            tickMargin={8}
            width={56}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) =>
                  typeof value === "number" ? formatUsd(value) : String(value)
                }
                labelFormatter={(_, payload) => {
                  const point = payload?.[0]?.payload as
                    | ChartBarForRange
                    | undefined;
                  return formatPeriodLabel(tab, point?.period ?? "");
                }}
              />
            }
          />
          {referenceArea}
          <Line
            activeDot={{ r: 4 }}
            dataKey="close"
            dot={false}
            isAnimationActive={false}
            stroke="var(--color-close)"
            strokeWidth={2}
            type="monotone"
          />
        </LineChart>
      </ChartContainer>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="text-muted-foreground text-xs">
          {rangeStats
            ? `${formatShortRange(rangeStats.from, rangeStats.to)} (${rangeStats.percentageChange >= 0 ? "+" : ""}${rangeStats.percentageChange.toFixed(2)}%)`
            : "Range explanation available"}
        </div>
        <div className="flex flex-wrap gap-2">
          {rangeStats && !popoverOpen ? (
            <Button
              onClick={() => setPopoverOpen(true)}
              size="sm"
              type="button"
              variant="secondary"
            >
              View explanation
            </Button>
          ) : null}
          {committed ? (
            <Button
              onClick={clearSelection}
              size="sm"
              type="button"
              variant="outline"
            >
              Clear selection
            </Button>
          ) : null}
        </div>
      </div>

      <MobileRangeInputs
        from={mobileFrom}
        onApply={handleApplyMobileRange}
        onFromChange={setMobileFrom}
        onToChange={setMobileTo}
        tab={tab}
        to={mobileTo}
      />

      {rangeStats ? (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverAnchor className="pointer-events-none absolute top-2 right-2 h-1 w-1" />
          <PopoverContent
            align="end"
            className="w-[420px] max-w-[calc(100vw-2rem)] p-4"
            onOpenAutoFocus={(event) => event.preventDefault()}
            side="left"
            sideOffset={8}
          >
            <ExplainRangePopoverBody
              companyName={companyName}
              errorMessage={explainError}
              explanation={explanation}
              isLoading={explainLoading}
              onClose={() => setPopoverOpen(false)}
              onRetry={handleRetry}
              rangeStats={rangeStats}
              symbol={symbol}
              tab={tab}
            />
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
};

const MobileRangeInputs = ({
  tab,
  from,
  to,
  onFromChange,
  onToChange,
  onApply,
}: {
  tab: PriceHistoryTab;
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onApply: () => void;
}) => (
  <div className="border-border/60 bg-muted/10 space-y-2 rounded-lg border p-3 md:hidden">
    <p className="text-muted-foreground text-xs font-medium">
      {tab === "daily"
        ? "Date range"
        : tab === "monthly"
          ? "Month range"
          : "Year range"}
    </p>
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      {tab === "daily" ? (
        <>
          <DateInput
            label="From"
            onChange={onFromChange}
            type="date"
            value={from}
          />
          <DateInput
            label="To"
            onChange={onToChange}
            type="date"
            value={to}
          />
        </>
      ) : null}
      {tab === "monthly" ? (
        <>
          <DateInput
            label="From"
            onChange={onFromChange}
            type="month"
            value={from}
          />
          <DateInput
            label="To"
            onChange={onToChange}
            type="month"
            value={to}
          />
        </>
      ) : null}
      {tab === "yearly" ? (
        <>
          <DateInput
            label="From year"
            max={2100}
            min={1900}
            onChange={onFromChange}
            placeholder="2020"
            type="number"
            value={from}
          />
          <DateInput
            label="To year"
            max={2100}
            min={1900}
            onChange={onToChange}
            placeholder="2024"
            type="number"
            value={to}
          />
        </>
      ) : null}
      <Button className="w-full sm:w-auto" onClick={onApply} size="sm" type="button">
        Explain range
      </Button>
    </div>
  </div>
);

const DateInput = ({
  label,
  type,
  value,
  onChange,
  min,
  max,
  placeholder,
}: {
  label: string;
  type: "date" | "month" | "number";
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  placeholder?: string;
}) => (
  <label className="flex flex-col gap-1 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <input
      className="border-input bg-background h-8 rounded-md border px-2 text-sm"
      inputMode={type === "number" ? "numeric" : undefined}
      max={max}
      min={min}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type={type}
      value={value}
    />
  </label>
);

const ExplainRangePopoverBody = ({
  symbol,
  companyName,
  rangeStats,
  tab,
  explanation,
  isLoading,
  errorMessage,
  onRetry,
  onClose,
}: {
  symbol: string;
  companyName?: string;
  rangeStats: SelectedRangePayload;
  tab: PriceHistoryTab;
  explanation: RangeExplanation | null;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onClose: () => void;
}) => {
  const directionClass =
    rangeStats.direction === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : rangeStats.direction === "down"
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";

  return (
    <div className="flex max-h-[min(70vh,520px)] flex-col gap-3 overflow-y-auto">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-sm font-semibold">{symbol}</p>
          {companyName ? (
            <p className="text-muted-foreground text-xs">{companyName}</p>
          ) : null}
          <p className="text-muted-foreground mt-1 text-xs">
            {formatShortRange(rangeStats.from, rangeStats.to)}
          </p>
        </div>
        <Button
          aria-label="Close explanation"
          className="shrink-0"
          onClick={onClose}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge className="tabular-nums" variant="outline">
          Start {formatUsd(rangeStats.startClose)}
        </Badge>
        <Badge className="tabular-nums" variant="outline">
          End {formatUsd(rangeStats.endClose)}
        </Badge>
        <Badge className={cn("tabular-nums", directionClass)} variant="outline">
          {rangeStats.absoluteChange >= 0 ? "+" : ""}
          {formatUsd(rangeStats.absoluteChange)} (
          {rangeStats.percentageChange >= 0 ? "+" : ""}
          {rangeStats.percentageChange.toFixed(2)}%)
        </Badge>
        <Badge className={cn("capitalize", directionClass)} variant="secondary">
          {rangeStats.direction}
        </Badge>
        {explanation ? (
          <Badge className="capitalize" variant="outline">
            Confidence: {explanation.confidence}
          </Badge>
        ) : null}
      </div>

      {tab === "yearly" ? (
        <p className="text-muted-foreground text-xs">
          Yearly bars span full calendar years, so explanations may be less
          precise than daily or monthly views.
        </p>
      ) : null}

      <Separator />

      {errorMessage ? (
        <div className="space-y-2">
          <p className="text-destructive text-sm">{errorMessage}</p>
          <Button
            className="gap-1.5"
            onClick={onRetry}
            size="sm"
            type="button"
            variant="outline"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : null}

      {!errorMessage && isLoading ? (
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">
            Analyzing {symbol} from {formatShortRange(rangeStats.from, rangeStats.to)}
          </p>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : null}

      {!errorMessage && !isLoading && explanation ? (
        <div className="space-y-3 text-sm">
          <p>{explanation.summary}</p>

          {explanation.mainDrivers.length > 0 ? (
            <ExplanationList
              items={explanation.mainDrivers.map((driver) => ({
                body: driver.explanation,
                meta: driver.confidence,
                title: driver.category.replaceAll("_", " "),
              }))}
              title="Main drivers"
            />
          ) : null}

          {explanation.importantDates.length > 0 ? (
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                Important dates
              </p>
              <ul className="space-y-2 text-xs">
                {explanation.importantDates.map((event, index) => (
                  <li
                    className="border-border/60 bg-muted/20 rounded-md border p-2"
                    key={`${event.date}-${index}`}
                  >
                    <p className="font-medium">{event.date}</p>
                    <p>{event.event}</p>
                    <p className="text-muted-foreground">{event.priceAction}</p>
                    <p className="text-muted-foreground">{event.relevance}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {explanation.evidence.length > 0 ? (
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                Evidence
              </p>
              <ul className="space-y-2 text-xs">
                {explanation.evidence.map((item, index) => (
                  <li key={`${item.headline}-${index}`}>
                    {item.url ? (
                      <a
                        className="text-primary font-medium underline-offset-2 hover:underline"
                        href={item.url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {item.headline}
                      </a>
                    ) : (
                      <span className="font-medium">{item.headline}</span>
                    )}
                    <span className="text-muted-foreground">
                      {item.source ? ` | ${item.source}` : ""}
                      {item.publishedDate ? ` | ${item.publishedDate}` : ""}
                    </span>
                    <p className="text-muted-foreground mt-0.5">{item.relevance}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="text-muted-foreground text-xs">{explanation.caveat}</p>
          <p className="text-muted-foreground text-[0.7rem] leading-snug">
            AI-generated explanation. Not financial advice.
          </p>
        </div>
      ) : null}
    </div>
  );
};

const ExplanationList = ({
  title,
  items,
}: {
  title: string;
  items: Array<{ title: string; body: string; meta?: string }>;
}) => (
  <div>
    <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
      {title}
    </p>
    <ul className="list-inside list-disc space-y-1.5 text-xs">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`}>
          <span className="font-medium">{item.title}</span>
          {item.meta ? (
            <span className="text-muted-foreground"> ({item.meta})</span>
          ) : null}
          <span> - {item.body}</span>
        </li>
      ))}
    </ul>
  </div>
);
