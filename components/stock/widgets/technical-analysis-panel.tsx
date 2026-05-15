"use client";

import * as React from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { usePriceSeries } from "@/hooks/use-price-series";
import { computeTaFromOhlc, type TaBar } from "@/lib/ta/indicators-from-ohlc";
import { cn } from "@/lib/utils";

type FinnhubAggregatePayload = {
  error?: string;
  technicalAnalysis?: {
    count?: { buy?: number; neutral?: number; sell?: number };
    signal?: string;
  };
  trend?: { adx?: number; trending?: boolean };
};

type TechnicalAnalysisPanelProps = {
  symbol: string;
  className?: string;
};

type ChartRow = TaBar;

const priceConfig = {
  close: { label: "Close", color: "var(--chart-1)" },
  sma20: { label: "SMA 20", color: "var(--chart-2)" },
  sma50: { label: "SMA 50", color: "var(--chart-3)" },
  bbUpper: { label: "BB upper", color: "var(--muted-foreground)" },
  bbLower: { label: "BB lower", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

const rsiConfig = {
  rsi14: { label: "RSI 14", color: "var(--chart-4)" },
} satisfies ChartConfig;

const macdConfig = {
  macdLine: { label: "MACD", color: "var(--chart-1)" },
  macdSignal: { label: "Signal", color: "var(--chart-3)" },
  macdHist: { label: "Histogram", color: "var(--chart-2)" },
} satisfies ChartConfig;

const obvConfig = {
  obv: { label: "OBV", color: "var(--chart-5)" },
} satisfies ChartConfig;

const formatAxisDate = (date: string): string => {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
};

const formatTooltipDate = (date: string): string => {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const toChartRows = (bars: TaBar[]): ChartRow[] => {
  const ready = bars.filter(
    (bar) =>
      bar.rsi14 !== null &&
      bar.sma50 !== null &&
      bar.macdLine !== null &&
      bar.bbUpper !== null &&
      bar.obv !== null,
  );

  return ready.slice(-160);
};

export const TechnicalAnalysisPanel = ({
  symbol,
  className,
}: TechnicalAnalysisPanelProps) => {
  const trimmed = symbol.trim();
  const { daily, errorDaily, isLoadingDaily } = usePriceSeries(trimmed, "daily");
  const [aggregate, setAggregate] =
    React.useState<FinnhubAggregatePayload | null>(null);
  const [aggregateError, setAggregateError] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    if (!trimmed) return;

    const controller = new AbortController();
    let cancelled = false;

    setAggregate(null);
    setAggregateError(null);

    void (async () => {
      try {
        const params = new URLSearchParams({
          resolution: "D",
          symbol: trimmed,
        });
        const response = await fetch(`/api/stock-aggregate-technical?${params}`, {
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => null)) as
          | FinnhubAggregatePayload
          | null;

        if (cancelled) return;

        if (!response.ok) {
          setAggregateError(
            payload?.error ??
              `Finnhub aggregate request failed (${response.status})`,
          );
          return;
        }

        if (payload?.error) {
          setAggregateError(payload.error);
          return;
        }

        setAggregate(payload);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setAggregateError("Could not load Finnhub aggregate scan.");
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [trimmed]);

  const chartRows = React.useMemo(() => {
    if (!daily?.length) return [];
    return toChartRows(computeTaFromOhlc(daily));
  }, [daily]);

  const latest = chartRows.at(-1) ?? null;
  const signalLabel = aggregate?.technicalAnalysis?.signal;
  const counts = aggregate?.technicalAnalysis?.count;
  const adx = aggregate?.trend?.adx;
  const trending = aggregate?.trend?.trending;

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Technical analysis</CardTitle>
        <CardDescription>
          SMA, Bollinger bands, MACD, RSI, ATR, and OBV computed from
          provider-backed daily OHLC. Finnhub aggregate scan appears when the
          configured API plan supports it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {aggregate || aggregateError ? (
          <div
            aria-label="Finnhub aggregate technical scan"
            className="bg-muted/30 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2"
            role="region"
          >
            {aggregateError ? (
              <p className="text-muted-foreground text-xs">{aggregateError}</p>
            ) : (
              <>
                {signalLabel ? (
                  <Badge className="capitalize" variant="outline">
                    Finnhub signal: {signalLabel}
                  </Badge>
                ) : null}
                {counts ? (
                  <span className="text-muted-foreground text-xs">
                    Buy {counts.buy ?? "-"} | Neutral {counts.neutral ?? "-"} |
                    Sell {counts.sell ?? "-"}
                  </span>
                ) : null}
                {typeof adx === "number" && Number.isFinite(adx) ? (
                  <span className="text-muted-foreground text-xs">
                    ADX {adx.toFixed(1)}
                    {trending !== undefined
                      ? ` (${trending ? "trending" : "range"})`
                      : ""}
                  </span>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        {isLoadingDaily ? (
          <div aria-busy aria-live="polite" className="space-y-3">
            <Skeleton className="h-[280px] w-full" />
            <Skeleton className="h-[120px] w-full" />
            <Skeleton className="h-[140px] w-full" />
          </div>
        ) : null}

        {!isLoadingDaily && errorDaily ? (
          <p className="text-destructive text-sm">{errorDaily}</p>
        ) : null}

        {!isLoadingDaily && !errorDaily && chartRows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Not enough daily bars to plot indicators.
          </p>
        ) : null}

        {!isLoadingDaily && !errorDaily && chartRows.length > 0 ? (
          <>
            {latest ? <LatestIndicatorSummary latest={latest} /> : null}
            <PriceBandChart rows={chartRows} />
            <RsiChart rows={chartRows} />
            <MacdChart rows={chartRows} />
            <ObvChart rows={chartRows} />
            <p className="text-muted-foreground text-[10px] leading-snug">
              For education only. Indicator math follows common textbook
              definitions; values may differ slightly from trading platforms.
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
};

const LatestIndicatorSummary = ({ latest }: { latest: ChartRow }) => (
  <div className="text-muted-foreground grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
    <p>
      RSI 14:{" "}
      <span className="text-foreground font-medium tabular-nums">
        {latest.rsi14?.toFixed(2) ?? "-"}
      </span>
    </p>
    <p>
      MACD / signal / hist:{" "}
      <span className="text-foreground font-medium tabular-nums">
        {latest.macdLine?.toFixed(3) ?? "-"} /{" "}
        {latest.macdSignal?.toFixed(3) ?? "-"} /{" "}
        {latest.macdHist?.toFixed(3) ?? "-"}
      </span>
    </p>
    <p>
      ATR 14:{" "}
      <span className="text-foreground font-medium tabular-nums">
        {latest.atr14?.toFixed(3) ?? "-"}
      </span>
    </p>
    <p>
      Close vs SMA50:{" "}
      <span className="text-foreground font-medium tabular-nums">
        {latest.sma50
          ? `${(((latest.close - latest.sma50) / latest.sma50) * 100).toFixed(
              2,
            )}%`
          : "-"}
      </span>
    </p>
  </div>
);

const PriceBandChart = ({ rows }: { rows: ChartRow[] }) => (
  <div className="space-y-1">
    <p className="text-muted-foreground text-xs font-medium uppercase">
      Price and bands
    </p>
    <ChartContainer
      className="aspect-auto h-[min(320px,45vh)] w-full"
      config={priceConfig}
    >
      <ComposedChart
        accessibilityLayer
        data={rows}
        margin={{ bottom: 4, left: 8, right: 8, top: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="date"
          minTickGap={24}
          tickFormatter={(value) =>
            typeof value === "string" ? formatAxisDate(value) : String(value)
          }
          tickLine={false}
        />
        <YAxis
          axisLine={false}
          domain={["auto", "auto"]}
          tickFormatter={(value) =>
            typeof value === "number" ? value.toFixed(2) : String(value)
          }
          tickLine={false}
          width={56}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as ChartRow | undefined;
                return row?.date ? formatTooltipDate(row.date) : "";
              }}
            />
          }
        />
        <Line
          dataKey="bbUpper"
          dot={false}
          isAnimationActive={false}
          stroke="var(--color-bbUpper)"
          strokeWidth={1}
          type="monotone"
        />
        <Line
          dataKey="bbLower"
          dot={false}
          isAnimationActive={false}
          stroke="var(--color-bbLower)"
          strokeWidth={1}
          type="monotone"
        />
        <Line
          dataKey="sma20"
          dot={false}
          isAnimationActive={false}
          stroke="var(--color-sma20)"
          strokeWidth={1.5}
          type="monotone"
        />
        <Line
          dataKey="sma50"
          dot={false}
          isAnimationActive={false}
          stroke="var(--color-sma50)"
          strokeWidth={1.5}
          type="monotone"
        />
        <Line
          dataKey="close"
          dot={false}
          isAnimationActive={false}
          stroke="var(--color-close)"
          strokeWidth={2}
          type="monotone"
        />
        <ChartLegend content={<ChartLegendContent />} />
      </ComposedChart>
    </ChartContainer>
  </div>
);

const RsiChart = ({ rows }: { rows: ChartRow[] }) => (
  <div className="space-y-1">
    <p className="text-muted-foreground text-xs font-medium uppercase">RSI 14</p>
    <ChartContainer className="aspect-auto h-[140px] w-full" config={rsiConfig}>
      <ComposedChart
        accessibilityLayer
        data={rows}
        margin={{ bottom: 0, left: 8, right: 8, top: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" hide />
        <YAxis axisLine={false} domain={[0, 100]} tickLine={false} width={36} />
        <ReferenceArea fill="var(--destructive)" fillOpacity={0.12} y1={70} y2={100} />
        <ReferenceArea fill="var(--chart-2)" fillOpacity={0.12} y1={0} y2={30} />
        <ReferenceLine stroke="var(--muted-foreground)" strokeDasharray="4 4" y={70} />
        <ReferenceLine stroke="var(--muted-foreground)" strokeDasharray="4 4" y={30} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as ChartRow | undefined;
                return row?.date ? formatTooltipDate(row.date) : "";
              }}
            />
          }
        />
        <Line
          dataKey="rsi14"
          dot={false}
          isAnimationActive={false}
          stroke="var(--color-rsi14)"
          strokeWidth={2}
          type="monotone"
        />
      </ComposedChart>
    </ChartContainer>
  </div>
);

const MacdChart = ({ rows }: { rows: ChartRow[] }) => (
  <div className="space-y-1">
    <p className="text-muted-foreground text-xs font-medium uppercase">MACD</p>
    <ChartContainer
      className="aspect-auto h-[160px] w-full"
      config={macdConfig}
    >
      <ComposedChart
        accessibilityLayer
        data={rows}
        margin={{ bottom: 0, left: 8, right: 8, top: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" hide />
        <YAxis
          axisLine={false}
          domain={["auto", "auto"]}
          tickLine={false}
          width={48}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as ChartRow | undefined;
                return row?.date ? formatTooltipDate(row.date) : "";
              }}
            />
          }
        />
        <ReferenceLine stroke="var(--border)" y={0} />
        <Bar dataKey="macdHist" isAnimationActive={false}>
          {rows.map((row, index) => (
            <Cell
              fill={
                row.macdHist === null
                  ? "transparent"
                  : row.macdHist >= 0
                    ? "var(--chart-2)"
                    : "var(--destructive)"
              }
              key={`macd-hist-${row.date}-${index}`}
            />
          ))}
        </Bar>
        <Line
          dataKey="macdLine"
          dot={false}
          isAnimationActive={false}
          stroke="var(--color-macdLine)"
          strokeWidth={1.5}
          type="monotone"
        />
        <Line
          dataKey="macdSignal"
          dot={false}
          isAnimationActive={false}
          stroke="var(--color-macdSignal)"
          strokeWidth={1.5}
          type="monotone"
        />
      </ComposedChart>
    </ChartContainer>
  </div>
);

const ObvChart = ({ rows }: { rows: ChartRow[] }) => (
  <div className="space-y-1">
    <p className="text-muted-foreground text-xs font-medium uppercase">
      On-balance volume
    </p>
    <ChartContainer className="aspect-auto h-[100px] w-full" config={obvConfig}>
      <ComposedChart
        accessibilityLayer
        data={rows}
        margin={{ bottom: 0, left: 8, right: 8, top: 2 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" hide />
        <YAxis
          axisLine={false}
          domain={["auto", "auto"]}
          tickLine={false}
          width={52}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as ChartRow | undefined;
                return row?.date ? formatTooltipDate(row.date) : "";
              }}
            />
          }
        />
        <Line
          dataKey="obv"
          dot={false}
          isAnimationActive={false}
          stroke="var(--color-obv)"
          strokeWidth={1.5}
          type="monotone"
        />
      </ComposedChart>
    </ChartContainer>
  </div>
);
