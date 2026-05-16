"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { AlertCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useFinnhubMetric } from "@/hooks/use-finnhub-stock-data"
import {
  buildRowsForKeys,
  HIGHLIGHT_METRIC_KEYS,
  isSkippableMetricKey,
  METRIC_GROUPS,
  type FundamentalChartRow,
  type MetricGroupId,
} from "@/lib/fundamental-metric-charts"
import { formatMetricValue, labelForMetricKey } from "@/lib/metric-display"
import { cn } from "@/lib/utils"

type BasicFinancialsWidgetProps = {
  symbol: string
  className?: string
}

const barChartConfig = {
  display: {
    label: "Value",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const TAB_IDS: Array<MetricGroupId | "all"> = [
  "valuation",
  "profitability",
  "liquidity",
  "turnoverCoverage",
  "all",
]

const FundamentalMetricBarChart = ({ rows }: { rows: FundamentalChartRow[] }) => {
  if (rows.length === 0) {
    return (
      <p className="text-[#adb3b2] py-8 text-center text-sm font-medium">
        No metrics in this category for this symbol.
      </p>
    )
  }

  const maxLabel = rows.reduce((m, r) => Math.max(m, r.label.length), 8)
  const yAxisWidth = Math.min(200, 72 + Math.min(maxLabel, 28) * 5.2)
  const chartHeight = Math.min(440, Math.max(148, 36 * rows.length + 72))

  return (
    <div className="mt-2">
      <ChartContainer
        config={barChartConfig}
        className="aspect-auto w-full [&_.recharts-surface]:outline-none"
        style={{ height: chartHeight }}
      >
        <BarChart
          accessibilityLayer
          layout="vertical"
          data={rows}
          margin={{ left: -12, right: 12, top: 4, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#adb3b2" strokeOpacity={0.2} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            domain={[0, "auto"]}
            tick={{ fontSize: 10, fill: "#adb3b2" }}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={yAxisWidth}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11, fill: "#5a6060", fontWeight: 500 }}
          />
          <ChartTooltip
            cursor={{ fill: "#adb3b2", fillOpacity: 0.1 }}
            content={
              <ChartTooltipContent
                formatter={(_value, _name, item) => {
                  const row = item?.payload as FundamentalChartRow | undefined
                  return (
                    <span className="font-bold text-[#2d3433] tabular-nums">
                      {row?.tooltip ?? "—"}
                    </span>
                  )
                }}
              />
            }
          />
          <Bar
            dataKey="display"
            fill="#7a7c7b"
            radius={[0, 4, 4, 0]}
            maxBarSize={24}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>
    </div>
  )
}

export const BasicFinancialsWidget = ({
  symbol,
  className,
}: BasicFinancialsWidgetProps) => {
  const { data, error, isLoading } = useFinnhubMetric(symbol)
  const metricFromApi = data?.metric

  const tableEntries = React.useMemo(() => {
    const metric = metricFromApi ?? {}
    return Object.entries(metric)
      .filter(([k, v]) => {
        if (isSkippableMetricKey(k)) {
          return false
        }
        if (v === null || v === undefined || v === "") {
          return false
        }
        if (typeof v === "object") {
          return false
        }
        return true
      })
      .sort(([a], [b]) => a.localeCompare(b))
  }, [metricFromApi])

  const highlights = React.useMemo(() => {
    const metric = metricFromApi ?? {}
    const list: Array<{ key: string; label: string; text: string }> = []
    for (const key of HIGHLIGHT_METRIC_KEYS) {
      const raw = metric[key]
      if (raw === null || raw === undefined || raw === "") {
        continue
      }
      if (typeof raw === "object") {
        continue
      }
      list.push({
        key,
        label: labelForMetricKey(key),
        text: formatMetricValue(raw as string | number),
      })
      if (list.length >= 6) {
        break
      }
    }
    return list
  }, [metricFromApi])

  return (
    <Card className={cn("border-[#adb3b2]/20 bg-white text-[#2d3433] shadow-md shadow-[#2d3433]/5", className)}>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-[#5f5e5e]">Basic financials</CardTitle>
        <CardDescription className="text-[#5a6060]">
          Key ratios from Finnhub, grouped into comparable charts. Open{" "}
          <span className="font-bold">All metrics</span> for the complete
          table.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : null}

        {error ? (
          <Alert className="border-[#fe8983]/30 bg-[#fe8983]/10 text-[#752121]">
            <AlertCircle className="text-[#752121]" />
            <AlertTitle className="font-bold">Financials unavailable</AlertTitle>
            <AlertDescription className="text-[#752121]/90">
              We couldn&apos;t load the financial ratios for this company. This is usually due to API limits.
            </AlertDescription>
          </Alert>
        ) : null}

        {!isLoading && !error && tableEntries.length > 0 ? (
          <>
            {highlights.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {highlights.map((h) => (
                  <div
                    key={h.key}
                    className="bg-[#f2f4f3]/50 rounded-lg border border-[#adb3b2]/20 px-3 py-2.5"
                  >
                    <p className="text-[#5a6060] text-xs font-bold">
                      {h.label}
                    </p>
                    <p className="font-heading text-lg font-bold tabular-nums tracking-tight text-[#2d3433]">
                      {h.text}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {highlights.length > 0 ? <Separator /> : null}

            <Tabs defaultValue="valuation" className="w-full">
              <div className="mb-6">
                <ScrollArea className="w-full whitespace-nowrap rounded-lg bg-[#f2f4f3] p-1 shadow-inner">
                  <TabsList aria-label="Financial metric categories" className="inline-flex h-9 w-max items-center justify-start gap-1 bg-transparent p-0">
                    {TAB_IDS.map((id) => (
                      <TabsTrigger 
                        key={id} 
                        value={id} 
                        className="h-7 shrink-0 px-4 text-xs font-bold transition-all data-[state=active]:bg-[#7a7c7b]! data-[state=active]:text-white! text-[#5f5e5e] hover:text-[#2d3433] sm:text-sm"
                      >
                        {id === "all" ? "All metrics" : METRIC_GROUPS[id].title}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <ScrollBar orientation="horizontal" className="invisible" />
                </ScrollArea>
              </div>

              <div className="pt-2">
                {TAB_IDS.map((id) => {
                  if (id === "all") {
                    return (
                      <TabsContent key="all" value="all" className="mt-0">
                        <div className="max-h-[min(420px,55vh)] overflow-auto rounded-md border border-[#adb3b2]/20">
                          <Table>
                            <TableHeader className="bg-[#f2f4f3]/50">
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[42%] font-bold text-[#5f5e5e]">Metric</TableHead>
                                <TableHead className="font-bold text-[#5f5e5e]">Value</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tableEntries.map(([key, value]) => (
                                <TableRow key={key} className="hover:bg-[#f2f4f3]/50">
                                  <TableCell className="text-[#5a6060] align-top text-sm font-medium">
                                    {labelForMetricKey(key)}
                                  </TableCell>
                                  <TableCell className="font-bold tabular-nums text-[#2d3433]">
                                    {formatMetricValue(value)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>
                    )
                  }

                  const g = METRIC_GROUPS[id]
                  const rows = buildRowsForKeys(metricFromApi ?? {}, g.keys)
                  return (
                    <TabsContent key={id} value={id} className="mt-0 space-y-5">
                      <p className="text-[#5a6060] text-sm font-medium leading-relaxed border-l-2 border-[#adb3b2]/30 pl-3">
                        {g.description}
                      </p>
                      <FundamentalMetricBarChart rows={rows} />
                    </TabsContent>
                  )
                })}
              </div>
            </Tabs>
          </>
        ) : null}

        {!isLoading && !error && tableEntries.length === 0 ? (
          <div className="rounded-lg border border-[#adb3b2]/10 bg-[#f9f9f8] p-6 text-center">
            <p className="text-sm font-bold text-[#5a6060]">No financial data</p>
            <p className="text-xs text-[#adb3b2] mt-1">Detailed metrics for this symbol are not available at this time.</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
