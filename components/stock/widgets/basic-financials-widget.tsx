"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinnhubMetric } from "@/hooks/use-finnhub-stock-data";
import {
  buildRowsForKeys,
  HIGHLIGHT_METRIC_KEYS,
  isSkippableMetricKey,
  METRIC_GROUPS,
  type FundamentalChartRow,
  type MetricGroupId,
} from "@/lib/fundamental-metric-charts";
import { formatMetricValue, labelForMetricKey } from "@/lib/metric-display";
import { cn } from "@/lib/utils";

type BasicFinancialsWidgetProps = {
  symbol: string;
  className?: string;
};

const barChartConfig = {
  display: {
    color: "var(--chart-1)",
    label: "Value",
  },
} satisfies ChartConfig;

const TAB_IDS: Array<MetricGroupId | "all"> = [
  "valuation",
  "profitability",
  "liquidity",
  "turnoverCoverage",
  "all",
];

export const BasicFinancialsWidget = ({
  symbol,
  className,
}: BasicFinancialsWidgetProps) => {
  const { data, error, isLoading } = useFinnhubMetric(symbol);
  const metricFromApi = data?.metric;

  const tableEntries = React.useMemo(() => {
    const metric = metricFromApi ?? {};
    return Object.entries(metric)
      .filter(([key, value]) => {
        if (isSkippableMetricKey(key)) return false;
        if (value === null || value === undefined || value === "") return false;
        if (typeof value === "object") return false;
        return true;
      })
      .sort(([a], [b]) => a.localeCompare(b));
  }, [metricFromApi]);

  const highlights = React.useMemo(() => {
    const metric = metricFromApi ?? {};
    const rows: Array<{ key: string; label: string; text: string }> = [];

    for (const key of HIGHLIGHT_METRIC_KEYS) {
      const raw = metric[key];
      if (raw === null || raw === undefined || raw === "") continue;
      if (typeof raw === "object") continue;

      rows.push({
        key,
        label: labelForMetricKey(key),
        text: formatMetricValue(raw as string | number),
      });

      if (rows.length >= 6) break;
    }

    return rows;
  }, [metricFromApi]);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Basic financials</CardTitle>
        <CardDescription>
          Key ratios from Finnhub, grouped into comparable charts with the full
          metric table retained.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton className="h-9 w-full" key={index} />
            ))}
          </div>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Could not load metrics</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {!isLoading && !error && tableEntries.length > 0 ? (
          <>
            {highlights.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {highlights.map((highlight) => (
                  <div
                    className="bg-muted/40 rounded-lg border px-3 py-2.5"
                    key={highlight.key}
                  >
                    <p className="text-muted-foreground text-xs font-medium">
                      {highlight.label}
                    </p>
                    <p className="font-heading text-lg font-semibold tabular-nums">
                      {highlight.text}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {highlights.length > 0 ? <Separator /> : null}

            <Tabs className="w-full" defaultValue="valuation">
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
                {TAB_IDS.filter((id) => id !== "all").map((id) => (
                  <TabsTrigger className="text-xs sm:text-sm" key={id} value={id}>
                    {METRIC_GROUPS[id].title}
                  </TabsTrigger>
                ))}
                <TabsTrigger className="text-xs sm:text-sm" value="all">
                  All metrics
                </TabsTrigger>
              </TabsList>

              {(Object.keys(METRIC_GROUPS) as MetricGroupId[]).map((id) => {
                const group = METRIC_GROUPS[id];
                const rows = buildRowsForKeys(metricFromApi ?? {}, group.keys);

                return (
                  <TabsContent className="mt-4 space-y-2" key={id} value={id}>
                    <p className="text-muted-foreground text-xs">
                      {group.description}
                    </p>
                    <FundamentalMetricBarChart rows={rows} />
                  </TabsContent>
                );
              })}

              <TabsContent className="mt-4" value="all">
                <div className="max-h-[min(420px,55vh)] overflow-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[42%]">Metric</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableEntries.map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell className="text-muted-foreground align-top text-sm">
                            {labelForMetricKey(key)}
                          </TableCell>
                          <TableCell className="font-medium tabular-nums">
                            {formatMetricValue(value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : null}

        {!isLoading && !error && tableEntries.length === 0 ? (
          <p className="text-muted-foreground text-sm">No metric data.</p>
        ) : null}
      </CardContent>
    </Card>
  );
};

const FundamentalMetricBarChart = ({
  rows,
}: {
  rows: FundamentalChartRow[];
}) => {
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No metrics in this category for this symbol.
      </p>
    );
  }

  const maxLabel = rows.reduce(
    (max, row) => Math.max(max, row.label.length),
    8,
  );
  const yAxisWidth = Math.min(200, 72 + Math.min(maxLabel, 28) * 5.2);
  const chartHeight = Math.min(440, Math.max(148, 36 * rows.length + 72));

  return (
    <ChartContainer
      className="aspect-auto w-full"
      config={barChartConfig}
      style={{ height: chartHeight }}
    >
      <BarChart
        accessibilityLayer
        data={rows}
        layout="vertical"
        margin={{ bottom: 4, left: 4, right: 12, top: 4 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis
          axisLine={false}
          domain={[0, "auto"]}
          tickLine={false}
          tickMargin={8}
          type="number"
        />
        <YAxis
          axisLine={false}
          dataKey="label"
          tick={{ fontSize: 11 }}
          tickLine={false}
          tickMargin={4}
          type="category"
          width={yAxisWidth}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(_value, _name, item) => {
                const row = item?.payload as FundamentalChartRow | undefined;
                return (
                  <span className="text-foreground tabular-nums">
                    {row?.tooltip ?? "-"}
                  </span>
                );
              }}
            />
          }
          cursor={{ fill: "var(--muted)" }}
        />
        <Bar
          dataKey="display"
          fill="var(--color-display)"
          isAnimationActive={false}
          maxBarSize={28}
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
};
