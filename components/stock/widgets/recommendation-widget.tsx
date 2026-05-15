"use client";

import * as React from "react";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFinnhubRecommendation } from "@/hooks/use-finnhub-stock-data";
import {
  RECOMMENDATION_CHART_CONFIG,
  RECOMMENDATION_STACK_KEYS,
  rowToChartDatum,
  sortRecommendationsChronologically,
  totalRecommendations,
  type RecommendationStackKey,
} from "@/lib/analyst-recommendation-display";
import type { FinnhubRecommendationTrend } from "@/lib/types";
import { cn } from "@/lib/utils";

const EMPTY_ROWS: FinnhubRecommendationTrend[] = [];

type RecommendationWidgetProps = {
  symbol: string;
  className?: string;
};

const num = (value: number | undefined): string => {
  if (value === undefined || !Number.isFinite(value)) return "-";
  return String(value);
};

export const RecommendationWidget = ({
  symbol,
  className,
}: RecommendationWidgetProps) => {
  const { data, error, isLoading } = useFinnhubRecommendation(symbol);
  const rows = data ?? EMPTY_ROWS;
  const sorted = React.useMemo(
    () => sortRecommendationsChronologically(rows),
    [rows],
  );
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  React.useLayoutEffect(() => {
    if (sorted.length > 0) {
      setSelectedIndex(sorted.length - 1);
    }
  }, [sorted]);

  const safeIndex =
    sorted.length === 0
      ? 0
      : Math.min(Math.max(selectedIndex, 0), sorted.length - 1);
  const current = sorted[safeIndex];
  const chartData = React.useMemo(
    () => (current ? [rowToChartDatum(current)] : []),
    [current],
  );
  const total = current ? totalRecommendations(current) : 0;
  const canGoOlder = safeIndex > 0;
  const canGoNewer = sorted.length > 0 && safeIndex < sorted.length - 1;

  const handlePreviousPeriod = () => {
    setSelectedIndex((index) => Math.max(0, index - 1));
  };

  const handleNextPeriod = () => {
    if (sorted.length === 0) return;
    setSelectedIndex((index) => Math.min(sorted.length - 1, index + 1));
  };

  const handleChartKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      handlePreviousPeriod();
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      handleNextPeriod();
    }
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Analyst recommendations</CardTitle>
        <CardDescription>
          Finnhub consensus counts by reporting period.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton className="h-10 w-full" key={index} />
            ))}
          </div>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Could not load recommendations</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {!isLoading && !error && sorted.length > 0 && current ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1 space-y-1">
                <p
                  aria-live="polite"
                  className="text-muted-foreground text-xs font-medium uppercase"
                >
                  Reporting period
                </p>
                <p className="font-heading truncate text-lg font-semibold">
                  {current.period ?? "-"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {total > 0
                    ? `${total} analyst ${total === 1 ? "rating" : "ratings"} in this period`
                    : "No ratings in this period"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  aria-label="Go to earlier reporting period"
                  disabled={!canGoOlder}
                  onClick={handlePreviousPeriod}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <ChevronLeft aria-hidden className="size-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <span className="text-muted-foreground tabular-nums text-xs">
                  {safeIndex + 1} / {sorted.length}
                </span>
                <Button
                  aria-label="Go to later reporting period"
                  disabled={!canGoNewer}
                  onClick={handleNextPeriod}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight aria-hidden className="size-4" />
                </Button>
              </div>
            </div>

            <div
              aria-label="Recommendation distribution chart"
              className="border-border/80 bg-muted/20 rounded-lg border p-2 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              onKeyDown={handleChartKeyDown}
              role="group"
              tabIndex={0}
            >
              {total > 0 ? (
                <ChartContainer
                  className="aspect-auto h-[min(200px,28vh)] w-full"
                  config={RECOMMENDATION_CHART_CONFIG}
                >
                  <BarChart
                    accessibilityLayer
                    data={chartData}
                    layout="vertical"
                    margin={{ bottom: 4, left: 4, right: 12, top: 8 }}
                  >
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis axisLine={false} tickLine={false} type="number" />
                    <YAxis dataKey="periodLabel" hide type="category" width={0} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, _name, item) => {
                            const name =
                              typeof item?.name === "string"
                                ? item.name
                                : String(item?.dataKey ?? "");
                            const n =
                              typeof value === "number" ? value : Number(value);
                            return (
                              <span className="tabular-nums">
                                {Number.isFinite(n)
                                  ? `${name}: ${n.toLocaleString()}`
                                  : "-"}
                              </span>
                            );
                          }}
                        />
                      }
                      cursor={{ fill: "var(--muted)" }}
                    />
                    {RECOMMENDATION_STACK_KEYS.map(
                      (key: RecommendationStackKey) => (
                        <Bar
                          dataKey={key}
                          fill={`var(--color-${key})`}
                          isAnimationActive={false}
                          key={key}
                          radius={[0, 0, 0, 0]}
                          stackId="rec"
                        />
                      ),
                    )}
                    <ChartLegend content={<ChartLegendContent />} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  All counts are zero for this period.
                </p>
              )}
            </div>

            <div className="max-h-[min(280px,40vh)] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Strong buy</TableHead>
                    <TableHead className="text-right">Buy</TableHead>
                    <TableHead className="text-right">Hold</TableHead>
                    <TableHead className="text-right">Sell</TableHead>
                    <TableHead className="text-right">Strong sell</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((row, index) => (
                    <TableRow
                      className={cn(index === safeIndex && "bg-muted/50")}
                      data-state={index === safeIndex ? "selected" : undefined}
                      key={row.period ?? index}
                    >
                      <TableCell className="font-medium">
                        {row.period ?? "-"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {num(row.strongBuy)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {num(row.buy)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {num(row.hold)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {num(row.sell)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {num(row.strongSell)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : null}

        {!isLoading && !error && sorted.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No recommendation data.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
};
