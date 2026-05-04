import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { fetchMarkPricesBySymbol } from "@/lib/portfolio/mark-prices"
import { loadPaperPortfolioSnapshot } from "@/lib/portfolio/data"

const formatUsd = (n: number): string =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

type PortfolioSummaryCardProps = {
  userId: string
}

export const PortfolioSummaryCard = async ({ userId }: PortfolioSummaryCardProps) => {
  const snapshot = await loadPaperPortfolioSnapshot(userId)
  if (!snapshot) {
    return null
  }

  const marks = await fetchMarkPricesBySymbol(snapshot.holdings.map((h) => h.symbol))
  let unrealizedUsd = 0
  for (const h of snapshot.holdings) {
    const mark = marks.get(h.symbol.toUpperCase())
    if (mark !== undefined) {
      unrealizedUsd += (mark - h.avg_price) * h.shares
    }
  }

  return (
    <Card className="border-zinc-800 bg-zinc-950/80 text-zinc-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Paper portfolio</CardTitle>
        <CardDescription className="text-zinc-500">
          <Link
            href="/portfolio"
            className="font-medium text-zinc-300 underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            View full portfolio
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Cash</p>
          <p className="text-lg font-semibold tabular-nums">{formatUsd(snapshot.paperCashUsd)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Positions</p>
          <p className="text-lg font-semibold tabular-nums">{snapshot.holdings.length}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Realized P/L</p>
          <p
            className={
              snapshot.realizedPlUsd >= 0
                ? "text-lg font-semibold tabular-nums text-emerald-400"
                : "text-lg font-semibold tabular-nums text-red-400"
            }
          >
            {snapshot.realizedPlUsd >= 0 ? "+" : ""}
            {formatUsd(snapshot.realizedPlUsd)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Unrealized</p>
          <p
            className={
              unrealizedUsd >= 0
                ? "text-lg font-semibold tabular-nums text-emerald-400"
                : "text-lg font-semibold tabular-nums text-red-400"
            }
          >
            {unrealizedUsd >= 0 ? "+" : ""}
            {formatUsd(unrealizedUsd)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
