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
    <Card className="border-[#adb3b2]/20 bg-white text-[#2d3433] shadow-md shadow-[#2d3433]/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-[#5f5e5e]">Paper portfolio</CardTitle>
        <CardDescription className="text-[#5a6060]">
          <Link
            href="/portfolio"
            className="font-bold text-[#5f5e5e] underline-offset-4 hover:text-[#2d3433] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f5e5e] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            View full portfolio
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#5a6060]">Cash</p>
          <p className="text-lg font-bold tabular-nums text-[#2d3433]">{formatUsd(snapshot.paperCashUsd)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#5a6060]">Positions</p>
          <p className="text-lg font-bold tabular-nums text-[#2d3433]">{snapshot.holdings.length}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#5a6060]">Realized P/L</p>
          <p
            className={
              snapshot.realizedPlUsd >= 0
                ? "text-lg font-bold tabular-nums text-emerald-600"
                : "text-lg font-bold tabular-nums text-rose-600"
            }
          >
            {snapshot.realizedPlUsd >= 0 ? "+" : ""}
            {formatUsd(snapshot.realizedPlUsd)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#5a6060]">Unrealized</p>
          <p
            className={
              unrealizedUsd >= 0
                ? "text-lg font-bold tabular-nums text-emerald-600"
                : "text-lg font-bold tabular-nums text-rose-600"
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
