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
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Analyst recommendations</CardTitle>
        <CardDescription>
          Finnhub consensus counts by reporting period. Use{" "}
          <kbd className="bg-muted rounded border px-1 py-0.5 font-mono text-[10px]">
            ←
          </kbd>{" "}
          /{" "}
          <kbd className="bg-muted rounded border px-1 py-0.5 font-mono text-[10px]">
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
                  className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
                  aria-live="polite"
                >
                  Reporting period
                </p>
                <p className="font-heading truncate text-lg font-semibold">
                  {current.period ?? "—"}
                </p>
                <p className="text-muted-foreground text-xs">
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
                >
                  <ChevronLeft className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <span className="text-muted-foreground tabular-nums text-xs">
                  {safeIndex + 1} / {sorted.length}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canGoNewer}
                  onClick={handleNextPeriod}
                  aria-label="Go to later reporting period"
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
              className="rounded-lg border border-border/80 bg-muted/20 p-2 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
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
                      cursor={{ fill: "hsl(var(--muted) / 0.25)" }}
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
                              <span className="tabular-nums">
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
                  {sorted.map((row, idx) => (
                    <TableRow
                      key={row.period ?? idx}
                      data-state={idx === safeIndex ? "selected" : undefined}
                      className={cn(
                        idx === safeIndex && "bg-muted/50"
                      )}
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
          <p className="text-muted-foreground text-sm">
            No recommendation data.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
