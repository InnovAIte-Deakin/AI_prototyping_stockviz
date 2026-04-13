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
import { useFinnhubRecommendation } from "@/hooks/use-finnhub-stock-data"
import { cn } from "@/lib/utils"

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

  const rows = data ?? []

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Analyst recommendations</CardTitle>
        <CardDescription>
          Consensus counts by period (Finnhub recommendation trends).
        </CardDescription>
      </CardHeader>
      <CardContent>
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

        {!isLoading && !error && rows.length > 0 ? (
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
              {rows.map((row, idx) => (
                <TableRow key={row.period ?? idx}>
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
        ) : null}

        {!isLoading && !error && rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No recommendation data.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
