"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useFinnhubRecommendation } from "@/hooks/use-finnhub-stock-data"
import {
  RECOMMENDATION_CHART_CONFIG,
  RECOMMENDATION_STACK_KEYS,
  rowToChartDatum,
  sortRecommendationsChronologically,
  totalRecommendations,
  type RecommendationStackKey,
} from "@/lib/analyst-recommendation-display"
import type { FinnhubRecommendationTrend } from "@/lib/types"
import { cn } from "@/lib/utils"

const EMPTY_ROWS: FinnhubRecommendationTrend[] = []

type RecommendationWidgetProps = {
  symbol: string
  className?: string
}

const num = (v: number | undefined): string => {
  if (v === undefined || !Number.isFinite(v)) {
    return "—"
  }
  return String(v)
}

export const RecommendationWidget = ({
  symbol,
  className,
}: RecommendationWidgetProps) => {
  const { data, error, isLoading } = useFinnhubRecommendation(symbol)
  const rows = data ?? EMPTY_ROWS

  const sorted = React.useMemo(
    () => sortRecommendationsChronologically(rows),
    [rows]
  )

  const [selectedIndex, setSelectedIndex] = React.useState(0)

  React.useLayoutEffect(() => {
    if (sorted.length === 0) {
      return
    }
    setSelectedIndex(sorted.length - 1)
  }, [sorted])

  const safeIndex =
    sorted.length === 0
      ? 0
      : Math.min(Math.max(selectedIndex, 0), sorted.length - 1)
  const current = sorted[safeIndex]
  const chartData = React.useMemo(
    () => (current ? [rowToChartDatum(current)] : []),
    [current]
  )

  const total = current ? totalRecommendations(current) : 0

  const handlePreviousPeriod = () => {
    setSelectedIndex((i) => Math.max(0, i - 1))
  }

  const handleNextPeriod = () => {
    if (sorted.length === 0) {
      return
    }
    setSelectedIndex((i) => Math.min(sorted.length - 1, i + 1))
  }

  const handleChartKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault()
      handlePreviousPeriod()
      return
    }
    if (e.key === "ArrowRight") {
      e.preventDefault()
      handleNextPeriod()
    }
  }

  const canGoOlder = safeIndex > 0
  const canGoNewer = sorted.length > 0 && safeIndex < sorted.length - 1

  return (
    <Card className={cn("border-[#adb3b2]/20 bg-white text-[#2d3433] shadow-md shadow-[#2d3433]/5", className)}>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-[#5f5e5e]">Analyst recommendations</CardTitle>
        <CardDescription className="text-[#5a6060]">
          Finnhub consensus counts by reporting period. Use{" "}
          <kbd className="bg-[#f2f4f3] rounded border border-[#adb3b2]/30 px-1 py-0.5 font-mono text-[10px] text-[#2d3433]">
            ←
          </kbd>{" "}
          /{" "}
          <kbd className="bg-[#f2f4f3] rounded border border-[#adb3b2]/30 px-1 py-0.5 font-mono text-[10px] text-[#2d3433]">
            →
          </kbd>{" "}
          when the chart area is focused to step through periods.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : null}

        {error ? (
          <Alert className="border-[#fe8983]/30 bg-[#fe8983]/10 text-[#752121]">
            <AlertCircle className="text-[#752121]" />
            <AlertTitle className="font-bold">Analyst data unavailable</AlertTitle>
            <AlertDescription className="text-[#752121]/90">
              Analyst consensus for {symbol} is currently unavailable due to API limits.
            </AlertDescription>
          </Alert>
        ) : null}

        {!isLoading && !error && sorted.length > 0 && current ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1 space-y-1">
                <p
                  className="text-xs font-medium text-[#5a6060]"
                  aria-live="polite"
                >
                  Reporting period
                </p>
                <p className="font-heading truncate text-lg font-bold text-[#2d3433]">
                  {current.period ?? "—"}
                </p>
                <p className="text-[#adb3b2] text-xs font-medium">
                  {total > 0
                    ? `${total} analyst ${total === 1 ? "rating" : "ratings"} in this period`
                    : "No ratings in this period"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canGoOlder}
                  onClick={handlePreviousPeriod}
                  aria-label="Go to earlier reporting period"
                  className="border-[#adb3b2]/30 text-[#5f5e5e] font-bold"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <span className="text-[#5a6060] tabular-nums text-xs font-bold">
                  {safeIndex + 1} / {sorted.length}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canGoNewer}
                  onClick={handleNextPeriod}
                  aria-label="Go to later reporting period"
                  className="border-[#adb3b2]/30 text-[#5f5e5e] font-bold"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </div>
            </div>

            <div
              role="group"
              tabIndex={0}
              aria-label="Recommendation distribution chart. Use left and right arrow keys to change period."
              onKeyDown={handleChartKeyDown}
              className="rounded-lg border border-[#adb3b2]/20 bg-[#f2f4f3]/50 p-2 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-[#5f5e5e]"
            >
              {total > 0 ? (
                <ChartContainer
                  config={RECOMMENDATION_CHART_CONFIG}
                  className="aspect-auto h-[min(200px,28vh)] w-full [&_.recharts-surface]:outline-none"
                >
                  <BarChart
                    accessibilityLayer
                    layout="vertical"
                    data={chartData}
                    margin={{ left: 4, right: 12, top: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="periodLabel" hide width={0} />
                    <ChartTooltip
                      cursor={{ fill: "#adb3b2", fillOpacity: 0.1 }}
                      content={
                        <ChartTooltipContent
                          formatter={(value, _name, item) => {
                            const name =
                              typeof item?.name === "string"
                                ? item.name
                                : String(item?.dataKey ?? "")
                            const n =
                              typeof value === "number" ? value : Number(value)
                            return (
                              <span className="tabular-nums font-bold text-[#2d3433]">
                                {Number.isFinite(n)
                                  ? `${name}: ${n.toLocaleString()}`
                                  : "—"}
                              </span>
                            )
                          }}
                        />
                      }
                    />
                    {RECOMMENDATION_STACK_KEYS.map((key: RecommendationStackKey) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        stackId="rec"
                        fill={`var(--color-${key})`}
                        radius={[0, 0, 0, 0]}
                        isAnimationActive={false}
                      />
                    ))}
                    <ChartLegend content={<ChartLegendContent />} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  All counts are zero for this period.
                </p>
              )}
            </div>

            <div className="max-h-[min(280px,40vh)] overflow-auto rounded-md border border-[#adb3b2]/20">
              <Table>
                <TableHeader className="bg-[#f2f4f3]/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-[#5f5e5e]">Period</TableHead>
                    <TableHead className="text-right font-bold text-[#5f5e5e]">Strong buy</TableHead>
                    <TableHead className="text-right font-bold text-[#5f5e5e]">Buy</TableHead>
                    <TableHead className="text-right font-bold text-[#5f5e5e]">Hold</TableHead>
                    <TableHead className="text-right font-bold text-[#5f5e5e]">Sell</TableHead>
                    <TableHead className="text-right font-bold text-[#5f5e5e]">Strong sell</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((row, idx) => (
                    <TableRow
                      key={row.period ?? idx}
                      className={cn(
                        "cursor-pointer transition-all",
                        idx === safeIndex ? "bg-[#f2f4f3] border-l-2 border-l-[#5f5e5e]" : "hover:bg-[#f2f4f3]/30"
                      )}
                      onClick={() => setSelectedIndex(idx)}
                    >
                      <TableCell className="font-medium">
                        {row.period ?? "—"}
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
          <div className="rounded-lg border border-[#adb3b2]/10 bg-[#f9f9f8] p-6 text-center">
            <p className="text-sm font-bold text-[#5a6060]">No coverage</p>
            <p className="text-xs text-[#adb3b2] mt-1">There are no analyst recommendations currently available for this symbol.</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
