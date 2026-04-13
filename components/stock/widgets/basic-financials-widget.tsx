"use client"

import { AlertCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useFinnhubMetric } from "@/hooks/use-finnhub-stock-data"
import { formatMetricValue, labelForMetricKey } from "@/lib/metric-display"
import { cn } from "@/lib/utils"

type BasicFinancialsWidgetProps = {
  symbol: string
  className?: string
}

const SKIP_KEYS = new Set(["_symbol", "period"])

export const BasicFinancialsWidget = ({
  symbol,
  className,
}: BasicFinancialsWidgetProps) => {
  const { data, error, isLoading } = useFinnhubMetric(symbol)

  const entries = Object.entries(data?.metric ?? {}).filter(([k, v]) => {
    if (SKIP_KEYS.has(k)) {
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
  entries.sort(([a], [b]) => a.localeCompare(b))

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Basic financials</CardTitle>
        <CardDescription>
          Key ratios and metrics from Finnhub (`metric=all`).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
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

        {!isLoading && !error && entries.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[45%]">Metric</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell className="text-muted-foreground align-top">
                    {labelForMetricKey(key)}
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">
                    {formatMetricValue(value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}

        {!isLoading && !error && entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">No metric data.</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
