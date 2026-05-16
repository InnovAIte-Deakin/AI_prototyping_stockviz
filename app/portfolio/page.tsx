import Link from "next/link"
import { redirect } from "next/navigation"
import { Wallet, Banknote, TrendingUp, Activity, ArrowRight, History, Briefcase } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { fetchMarkPricesBySymbol } from "@/lib/portfolio/mark-prices"
import { loadPaperPortfolioSnapshot } from "@/lib/portfolio/data"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import { PortfolioPerformanceChart } from "@/components/dashboard/portfolio-performance-chart"

const formatUsd = (n: number): string =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

const formatShares = (n: number): string =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 8 }).format(n)

const formatWhen = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })

export default async function PortfolioPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const snapshot = await loadPaperPortfolioSnapshot(user.id)

  const marks = await fetchMarkPricesBySymbol(snapshot.holdings.map((h) => h.symbol))

  let currentHoldingsValue = 0
  for (const h of snapshot.holdings) {
    const mark = marks.get(h.symbol.toUpperCase())
    currentHoldingsValue += (mark ?? h.avg_price) * h.shares
  }

  const totalValue = snapshot.paperCashUsd + currentHoldingsValue
  
  // Unrealized
  let unrealizedUsd = 0
  for (const h of snapshot.holdings) {
    const mark = marks.get(h.symbol.toUpperCase())
    if (mark !== undefined) {
      unrealizedUsd += (mark - h.avg_price) * h.shares
    }
  }

  const totalPl = snapshot.realizedPlUsd + unrealizedUsd
  
  // Today's P/L (comparing to last history point)
  const lastPoint = snapshot.history[snapshot.history.length - 1]
  const todayPl = lastPoint ? totalValue - lastPoint.total_value_usd : 0
  const todayPlPct = lastPoint ? (todayPl / lastPoint.total_value_usd) * 100 : 0

  const summaryStats = [
    { label: "Total Portfolio Value", value: formatUsd(totalValue), icon: Wallet, trend: todayPl },
    { label: "Cash Balance", value: formatUsd(snapshot.paperCashUsd), icon: Banknote },
    { label: "Total P/L", value: formatUsd(totalPl), icon: TrendingUp, trend: totalPl },
    { label: "Today's P/L", value: `${todayPl >= 0 ? "+" : ""}${formatUsd(todayPl)} (${todayPlPct.toFixed(2)}%)`, icon: Activity, trend: todayPl },
  ]

  return (
    <div className="min-h-screen bg-[#f9f9f8] text-[#2d3433] selection:bg-[#e4e2e1] selection:text-[#525251]">
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <header className="space-y-1">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-[#2d3433]">
            Portfolio
          </h1>
          <p className="text-[#5a6060] text-sm font-medium">
            Manage your paper trading positions and track your long-term performance.
          </p>
        </header>

        {/* Summary Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryStats.map((s) => (
            <Card key={s.label} className="border-[#adb3b2]/20 bg-white shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
                <span className="text-xs font-bold text-[#adb3b2]">{s.label}</span>
                <s.icon className="h-3.5 w-3.5 text-[#adb3b2]" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className={cn(
                  "text-lg font-bold tabular-nums",
                  s.trend !== undefined ? (s.trend >= 0 ? "text-emerald-600" : "text-rose-600") : "text-[#2d3433]"
                )}>
                  {s.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart Section */}
        <Card className="border-[#adb3b2]/20 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#2d3433]">Portfolio Value Chart</CardTitle>
            <CardDescription>Historical total valuation over the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <PortfolioPerformanceChart currentBalance={totalValue} history={snapshot.history} />
          </CardContent>
        </Card>

        {/* Holdings Table */}
        <Card className="border-[#adb3b2]/20 bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b border-[#adb3b2]/10 bg-[#f9f9f8]/50">
            <div className="flex items-center gap-2">
              <Briefcase className="size-4 text-[#5a6060]" />
              <CardTitle className="text-lg font-bold text-[#2d3433]">Your Holdings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {snapshot.holdings.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-medium text-[#adb3b2]">No active positions found.</p>
                <Link href="/dashboard" className="mt-2 inline-block text-xs font-bold text-[#5f5e5e] hover:underline">
                  Find stocks to trade →
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-[#f9f9f8]/50">
                  <TableRow className="hover:bg-transparent border-[#adb3b2]/10">
                    <TableHead className="font-bold text-[#5a6060] py-4">Symbol</TableHead>
                    <TableHead className="font-bold text-[#5a6060]">Company</TableHead>
                    <TableHead className="text-right font-bold text-[#5a6060]">Quantity</TableHead>
                    <TableHead className="text-right font-bold text-[#5a6060]">Avg Buy Price</TableHead>
                    <TableHead className="text-right font-bold text-[#5a6060]">Current Price</TableHead>
                    <TableHead className="text-right font-bold text-[#5a6060]">Value</TableHead>
                    <TableHead className="text-right font-bold text-[#5a6060]">P/L</TableHead>
                    <TableHead className="text-center font-bold text-[#5a6060]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot.holdings.map((h) => {
                    const mark = marks.get(h.symbol.toUpperCase())
                    const currentPrice = mark ?? h.avg_price
                    const value = currentPrice * h.shares
                    const pl = (currentPrice - h.avg_price) * h.shares
                    const plPct = ((currentPrice - h.avg_price) / h.avg_price) * 100

                    return (
                      <TableRow key={h.id} className="border-[#adb3b2]/10 hover:bg-[#f2f4f3]/30 transition-colors">
                        <TableCell className="font-bold text-[#2d3433] py-4">{h.symbol}</TableCell>
                        <TableCell className="text-[#5a6060] font-medium text-xs max-w-[150px] truncate">
                          {h.symbol} Corporation
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{formatShares(h.shares)}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{formatUsd(h.avg_price)}</TableCell>
                        <TableCell className="text-right tabular-nums font-bold text-[#2d3433]">
                          {mark !== undefined ? formatUsd(mark) : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-bold text-[#2d3433]">{formatUsd(value)}</TableCell>
                        <TableCell className={cn(
                          "text-right tabular-nums font-bold",
                          pl >= 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {pl >= 0 ? "+" : ""}{formatUsd(pl)}
                          <span className="block text-[10px] font-medium">
                            ({plPct >= 0 ? "+" : ""}{plPct.toFixed(2)}%)
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button asChild variant="outline" size="sm" className="h-8 border-[#adb3b2]/30 text-xs font-bold hover:bg-[#2d3433] hover:text-white transition-all">
                            <Link href={`/stock/${h.symbol}`}>
                              Trade <ArrowRight className="ml-1.5 size-3" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Transaction History Table */}
        <Card className="border-[#adb3b2]/20 bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b border-[#adb3b2]/10 bg-[#f9f9f8]/50">
            <div className="flex items-center gap-2">
              <History className="size-4 text-[#5a6060]" />
              <CardTitle className="text-lg font-bold text-[#2d3433]">Transaction History</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {snapshot.transactions.length === 0 ? (
              <div className="py-12 text-center text-sm font-medium text-[#adb3b2]">
                No transactions yet.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-[#f9f9f8]/50">
                  <TableRow className="hover:bg-transparent border-[#adb3b2]/10">
                    <TableHead className="font-bold text-[#5a6060] py-4">Date</TableHead>
                    <TableHead className="font-bold text-[#5a6060]">Type</TableHead>
                    <TableHead className="font-bold text-[#5a6060]">Symbol</TableHead>
                    <TableHead className="text-right font-bold text-[#5a6060]">Quantity</TableHead>
                    <TableHead className="text-right font-bold text-[#5a6060]">Price</TableHead>
                    <TableHead className="text-right font-bold text-[#5a6060]">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot.transactions.map((t) => (
                    <TableRow key={t.id} className="border-[#adb3b2]/10 hover:bg-[#f2f4f3]/30 transition-colors">
                      <TableCell className="whitespace-nowrap text-[#5a6060] font-medium text-xs py-4">
                        {formatWhen(t.executed_at)}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          t.side === "buy" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {t.side}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-[#2d3433]">{t.symbol}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{formatShares(t.shares)}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{formatUsd(t.unit_price_usd)}</TableCell>
                      <TableCell className="text-right tabular-nums font-bold text-[#2d3433]">
                        {formatUsd(Math.abs(t.total_cash_delta_usd))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
