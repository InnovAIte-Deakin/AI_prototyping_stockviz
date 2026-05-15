"use client";

import * as React from "react";
import Link from "next/link";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

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
import { Skeleton } from "@/components/ui/skeleton";
import { usePriceSeries } from "@/hooks/use-price-series";
import { cn } from "@/lib/utils";

type DashboardSpotlightChartProps = {
  symbol: string;
  companyName: string;
  changePct: number | null;
  className?: string;
};

const chartConfig = {
  close: {
    color: "var(--chart-2)",
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

const formatPct = (value: number | null): string => {
  if (value === null) return "-";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
};

const formatPeriodLabel = (period: string): string => {
  const date = new Date(`${period}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return period;

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
};

export const DashboardSpotlightChart = ({
  symbol,
  companyName,
  changePct,
  className,
}: DashboardSpotlightChartProps) => {
  const { daily, errorDaily, isLoadingDaily } = usePriceSeries(symbol, "daily");
  const chartRows = React.useMemo(() => {
    if (!daily?.length) return [];
    return daily.slice(-90).map((point) => ({
      close: point.close,
      period: point.date,
    }));
  }, [daily]);

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-col gap-2 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            Spotlight gainer
          </p>
          <CardTitle className="font-mono text-xl sm:text-2xl">
            {symbol}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {companyName}
          </CardDescription>
          <p className="text-emerald-600 text-sm font-semibold tabular-nums dark:text-emerald-400">
            {formatPct(changePct)}
          </p>
        </div>
        <Link
          className="text-primary shrink-0 text-sm font-medium underline-offset-4 hover:underline"
          href={`/stock/${encodeURIComponent(symbol)}`}
        >
          View {symbol}
        </Link>
      </CardHeader>
      <CardContent>
        {isLoadingDaily ? (
          <div aria-busy aria-live="polite" className="space-y-3 pt-2">
            <Skeleton className="h-[220px] w-full rounded-lg" />
          </div>
        ) : null}

        {!isLoadingDaily && errorDaily ? (
          <p className="border-border bg-muted/30 rounded-lg border px-3 py-2 text-sm">
            {errorDaily}
          </p>
        ) : null}

        {!isLoadingDaily && !errorDaily && chartRows.length > 0 ? (
          <ChartContainer
            className="aspect-auto h-[220px] w-full"
            config={chartConfig}
          >
            <LineChart
              accessibilityLayer
              data={chartRows}
              margin={{ bottom: 4, left: 4, right: 8, top: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="period"
                minTickGap={28}
                tickFormatter={(value) =>
                  typeof value === "string"
                    ? formatPeriodLabel(value)
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
                        | { period?: string }
                        | undefined;
                      return formatPeriodLabel(point?.period ?? "");
                    }}
                  />
                }
              />
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
        ) : null}

        {!isLoadingDaily && !errorDaily && chartRows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No price history is available for this symbol.
          </p>
        ) : null}

        <p className="text-muted-foreground mt-3 text-[10px] leading-snug">
          Daily closes from the configured stock price provider. Not financial
          advice.
        </p>
      </CardContent>
    </Card>
  );
};
