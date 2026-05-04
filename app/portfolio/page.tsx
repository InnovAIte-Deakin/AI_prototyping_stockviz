import Link from "next/link"
import { redirect } from "next/navigation"

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
import { fetchMarkPricesBySymbol } from "@/lib/portfolio/mark-prices"
import { loadPaperPortfolioSnapshot } from "@/lib/portfolio/data"
import { createClient } from "@/lib/supabase/server"

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
  if (!snapshot) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-muted-foreground text-sm" role="alert">
          Could not load your portfolio. If this persists, confirm your database migration is applied
          and Supabase is configured.
        </p>
      </div>
    )
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
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Paper portfolio
        </h1>
        <p className="text-muted-foreground text-sm">
          Trades execute at Finnhub last price when you buy or sell from a stock page. Cash and
          positions are stored in your account.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cash</CardDescription>
            <CardTitle className="text-xl tabular-nums">{formatUsd(snapshot.paperCashUsd)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open positions</CardDescription>
            <CardTitle className="text-xl tabular-nums">{snapshot.holdings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Realized P/L</CardDescription>
            <CardTitle
              className={
                snapshot.realizedPlUsd >= 0
                  ? "text-xl tabular-nums text-emerald-600 dark:text-emerald-400"
                  : "text-xl tabular-nums text-red-600 dark:text-red-400"
              }
            >
              {snapshot.realizedPlUsd >= 0 ? "+" : ""}
              {formatUsd(snapshot.realizedPlUsd)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unrealized P/L (live)</CardDescription>
            <CardTitle
              className={
                unrealizedUsd >= 0
                  ? "text-xl tabular-nums text-emerald-600 dark:text-emerald-400"
                  : "text-xl tabular-nums text-red-600 dark:text-red-400"
              }
            >
              {unrealizedUsd >= 0 ? "+" : ""}
              {formatUsd(unrealizedUsd)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
          <CardDescription>Positions still open. Click a symbol to view the stock.</CardDescription>
        </CardHeader>
        <CardContent>
          {snapshot.holdings.length === 0 ? (
            <p className="text-muted-foreground text-sm">No open positions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Avg cost</TableHead>
                  <TableHead className="text-right">Last</TableHead>
                  <TableHead className="text-right">Unrealized</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.holdings.map((h) => {
                  const mark = marks.get(h.symbol.toUpperCase())
                  const unreal =
                    mark !== undefined ? (mark - h.avg_price) * h.shares : null
                  return (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/stock/${encodeURIComponent(h.symbol)}`}
                          className="text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {h.symbol}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatShares(h.shares)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatUsd(h.avg_price)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {mark !== undefined ? formatUsd(mark) : "—"}
                      </TableCell>
                      <TableCell
                        className={
                          unreal === null
                            ? "text-right tabular-nums text-muted-foreground"
                            : unreal >= 0
                              ? "text-right tabular-nums text-emerald-600 dark:text-emerald-400"
                              : "text-right tabular-nums text-red-600 dark:text-red-400"
                        }
                      >
                        {unreal === null ? "—" : `${unreal >= 0 ? "+" : ""}${formatUsd(unreal)}`}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent trades</CardTitle>
          <CardDescription>Latest 200 ledger entries.</CardDescription>
        </CardHeader>
        <CardContent>
          {snapshot.transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No trades yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Cash Δ</TableHead>
                  <TableHead className="text-right">Realized</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatWhen(t.executed_at)}
                    </TableCell>
                    <TableCell className="capitalize">{t.side}</TableCell>
                    <TableCell className="font-medium">{t.symbol}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatShares(t.shares)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatUsd(t.unit_price_usd)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {t.total_cash_delta_usd >= 0 ? "+" : ""}
                      {formatUsd(t.total_cash_delta_usd)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {t.realized_pl_usd == null
                        ? "—"
                        : `${t.realized_pl_usd >= 0 ? "+" : ""}${formatUsd(t.realized_pl_usd)}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
