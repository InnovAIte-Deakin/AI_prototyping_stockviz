"use client"

import * as React from "react"
import Link from "next/link"
import {
  Wallet,
  Banknote,
  TrendingUp,
  Activity,
  ArrowRight,
  History,
  Briefcase,
  Download,
  RotateCcw,
  Search,
  PieChart,
  Lightbulb,
  AlertCircle
} from "lucide-react"

import {
  Card,
  CardContent,
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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PortfolioPerformanceChart } from "@/components/dashboard/portfolio-performance-chart"
import { cn } from "@/lib/utils"
import { resetPortfolio } from "@/app/portfolio/actions"
import { useRouter } from "next/navigation"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { HoldingDrawer } from "./holding-drawer"
import { PortfolioAllocationChart } from "./portfolio-allocation-chart"

import type { Tables } from "@/lib/database.types"
import type { PaperPortfolioSnapshot } from "@/lib/portfolio/data"

// Formatters
const formatUsd = (n: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

const formatShares = (n: number): string =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 }).format(n)

const formatWhen = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })

const formatPct = (n: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n / 100)

type PortfolioClientViewProps = {
  snapshot: PaperPortfolioSnapshot
  marks: Record<string, number>
}

export function PortfolioClientView({ snapshot, marks }: PortfolioClientViewProps) {
  const router = useRouter()
  const [isResetting, setIsResetting] = React.useState(false)
  const [txSearch, setTxSearch] = React.useState("")
  const [txFilter, setTxFilter] = React.useState<"all" | "buy" | "sell">("all")
  const [holdingsSearch, setHoldingsSearch] = React.useState("")
  const [selectedHolding, setSelectedHolding] = React.useState<Tables<"portfolio_holdings"> | null>(null)

  const handleReset = async () => {
    setIsResetting(true)
    await resetPortfolio()
    setIsResetting(false)
    router.refresh()
  }

  const enhancedHoldings = snapshot.holdings.map((h) => {
    const mark = marks[h.symbol.toUpperCase()]
    const currentPrice = mark ?? h.avg_price
    const value = currentPrice * h.shares
    const costBasis = h.avg_price * h.shares
    const pl = value - costBasis
    const plPct = costBasis > 0 ? (pl / costBasis) * 100 : 0

    return { ...h, currentPrice, value, costBasis, pl, plPct }
  })

  // Calculate high-level stats purely
  const currentHoldingsValue = enhancedHoldings.reduce((acc, h) => acc + h.value, 0)
  const investedAmount = enhancedHoldings.reduce((acc, h) => acc + h.costBasis, 0)
  const unrealizedUsd = enhancedHoldings.reduce((acc, h) => acc + h.pl, 0)

  const bestPerformer = enhancedHoldings.reduce(
    (best, h) => (h.plPct > best.pct ? { symbol: h.symbol, pct: h.plPct } : best),
    { symbol: "-", pct: 0 }
  )

  const worstPerformer = enhancedHoldings.reduce(
    (worst, h) => (h.plPct < worst.pct ? { symbol: h.symbol, pct: h.plPct } : worst),
    { symbol: "-", pct: 0 }
  )

  const largestHolding = enhancedHoldings.reduce(
    (largest, h) => (h.value > largest.value ? { symbol: h.symbol, value: h.value } : largest),
    { symbol: "-", value: -Infinity }
  )

  const totalValue = snapshot.paperCashUsd + currentHoldingsValue
  const totalPl = snapshot.realizedPlUsd + unrealizedUsd

  const lastPoint = snapshot.history[snapshot.history.length - 1]
  const todayPl = lastPoint ? totalValue - lastPoint.total_value_usd : 0
  const todayPlPct = lastPoint && lastPoint.total_value_usd > 0 ? (todayPl / lastPoint.total_value_usd) * 100 : 0

  // Filter Transactions
  const filteredTransactions = snapshot.transactions.filter(t => {
    if (txFilter !== "all" && t.side !== txFilter) return false
    if (txSearch && !t.symbol.toLowerCase().includes(txSearch.toLowerCase())) return false
    return true
  })

  // Filter Holdings
  const filteredHoldings = enhancedHoldings.filter(h =>
    !holdingsSearch || h.symbol.toLowerCase().includes(holdingsSearch.toLowerCase())
  )

  // CSV Export
  const handleExportCSV = () => {
    let csv = "Date,Type,Symbol,Quantity,Price,Total\n"
    snapshot.transactions.forEach(t => {
      csv += `"${new Date(t.executed_at).toISOString()}","${t.side}","${t.symbol}",${t.shares},${t.unit_price_usd},${Math.abs(t.total_cash_delta_usd)}\n`
    })
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'portfolio_transactions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Portfolio Insights Logic
  const insights = []
  if (snapshot.holdings.length === 0) {
    insights.push("Your portfolio is currently empty. Consider searching for companies to invest in to begin building your paper portfolio.")
  } else {
    if (snapshot.paperCashUsd / totalValue > 0.8) {
      insights.push("You are holding a significant amount of cash (>80%). Deploying capital across different sectors might provide better growth opportunities.")
    }
    if (largestHolding.symbol !== "-" && (largestHolding.value / totalValue) > 0.4) {
      insights.push(`Your portfolio is heavily concentrated in ${largestHolding.symbol} (${formatPct((largestHolding.value / totalValue) * 100)}). Consider diversifying to lower single-stock risk.`)
    }
    if (unrealizedUsd > 0) {
      insights.push("Your open positions are currently profitable overall. Consider setting trailing stop-losses to protect these unrealized gains.")
    } else if (unrealizedUsd < 0) {
      insights.push("Your open positions are currently operating at a net loss. It may be wise to review your underperforming assets and cut losses early.")
    }
    if (snapshot.holdings.length < 3) {
      insights.push("Your portfolio consists of fewer than 3 assets. Adding a few more stocks or ETFs can help smooth out volatility.")
    }
  }
  if (insights.length === 0) {
    insights.push("Your portfolio looks well-balanced right now. Continue monitoring market conditions and adjusting your allocations as needed.")
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-12 px-6 py-10">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Portfolio
          </h1>
          <p className="text-muted-foreground text-base font-medium max-w-2xl">
            Manage your paper trading positions and track your long-term performance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="default" className="font-bold shadow-none">
            <Link href="/dashboard">Find stocks</Link>
          </Button>
          <Button onClick={handleExportCSV} variant="outline" className="font-bold shadow-none">
            <Download className="mr-2 size-4" /> Export CSV
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="font-bold shadow-none text-finance-danger hover:text-finance-danger border-finance-danger/20 hover:bg-finance-danger/10">
                <RotateCcw className="mr-2 size-4" /> Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Portfolio?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all your holdings and transactions, and reset your paper cash to $100,000.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} disabled={isResetting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {isResetting ? "Resetting..." : "Yes, reset it"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {/* Summary Cards Grid (2 rows of 3) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/20 bg-card shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-bold text-muted-foreground">Total Value</span>
            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold tabular-nums text-foreground">{formatUsd(totalValue)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/20 bg-card shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-bold text-muted-foreground">Cash Balance</span>
            <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold tabular-nums text-foreground">{formatUsd(snapshot.paperCashUsd)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/20 bg-card shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-bold text-muted-foreground">Invested Amount</span>
            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold tabular-nums text-foreground">{formatUsd(investedAmount)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/20 bg-card shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-bold text-muted-foreground">Total P/L</span>
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className={cn("text-2xl font-bold tabular-nums", totalPl >= 0 ? "text-finance-success" : "text-finance-danger")}>
              {totalPl >= 0 ? "+" : ""}{formatUsd(totalPl)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Realized: <span className={cn("font-medium", snapshot.realizedPlUsd >= 0 ? "text-finance-success" : "text-finance-danger")}>{formatUsd(snapshot.realizedPlUsd)}</span> |
              Unrealized: <span className={cn("font-medium", unrealizedUsd >= 0 ? "text-finance-success" : "text-finance-danger")}>{formatUsd(unrealizedUsd)}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/20 bg-card shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-bold text-muted-foreground">Today&apos;s P/L</span>
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className={cn("text-2xl font-bold tabular-nums", todayPl >= 0 ? "text-finance-success" : "text-finance-danger")}>
              {todayPl >= 0 ? "+" : ""}{formatUsd(todayPl)}
            </p>
            <p className={cn("text-xs font-medium mt-1", todayPl >= 0 ? "text-finance-success" : "text-finance-danger")}>
              {todayPl >= 0 ? "+" : ""}{todayPlPct.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/20 bg-card shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-bold text-muted-foreground">Holdings</span>
            <PieChart className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0 flex flex-col justify-center">
            <p className="text-2xl font-bold tabular-nums text-foreground">{snapshot.holdings.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart Section */}
      <PortfolioPerformanceChart currentBalance={totalValue} history={snapshot.history} />

      {/* Allocation & Performers Row */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card className="border-border/20 bg-card shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Portfolio Allocation</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center min-h-[300px]">
            <PortfolioAllocationChart holdings={enhancedHoldings} cash={snapshot.paperCashUsd} />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card className="border-border/20 bg-card shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-foreground">Best Performer</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {bestPerformer.symbol !== "-" ? (
                <>
                  <p className="text-xl font-bold text-foreground hover:text-primary transition-colors">
                    <Link href={`/stock/${bestPerformer.symbol}`}>{bestPerformer.symbol}</Link>
                  </p>
                  <p className="text-finance-success font-medium text-sm">+{bestPerformer.pct.toFixed(2)}%</p>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground text-sm font-bold">No clear best performer yet</p>
                  <p className="text-muted-foreground text-xs mt-1">Prices have not moved enough since purchase.</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="border-border/20 bg-card shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-foreground">Worst Performer</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {worstPerformer.symbol !== "-" ? (
                <>
                  <p className="text-xl font-bold text-foreground hover:text-primary transition-colors">
                    <Link href={`/stock/${worstPerformer.symbol}`}>{worstPerformer.symbol}</Link>
                  </p>
                  <p className="text-finance-danger font-medium text-sm">{worstPerformer.pct.toFixed(2)}%</p>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground text-sm font-bold">No clear worst performer yet</p>
                  <p className="text-muted-foreground text-xs mt-1">Prices have not moved enough since purchase.</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="border-border/20 bg-card shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-foreground">Largest Holding</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {largestHolding.symbol !== "-" ? (
                <>
                  <p className="text-xl font-bold text-foreground hover:text-primary transition-colors">
                    <Link href={`/stock/${largestHolding.symbol}`}>{largestHolding.symbol}</Link>
                  </p>
                  <p className="text-foreground font-medium text-sm">{formatUsd(largestHolding.value)}</p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm font-medium">No data</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Holdings Table */}
      <Card className="border-border/20 bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/10 bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Briefcase className="size-4 text-muted-foreground" />
            <CardTitle className="text-lg font-bold text-foreground">Your Holdings</CardTitle>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search holdings..."
              value={holdingsSearch}
              onChange={e => setHoldingsSearch(e.target.value)}
              className="pl-9 h-9 shadow-none bg-background"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredHoldings.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">No active positions found.</p>
              <Button asChild variant="link" className="mt-2 text-primary font-bold">
                <Link href="/dashboard">Find stocks to trade →</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-background/50">
                <TableRow className="hover:bg-transparent border-border/10">
                  <TableHead className="font-bold text-muted-foreground py-4">Symbol</TableHead>
                  <TableHead className="font-bold text-muted-foreground">Company</TableHead>
                  <TableHead className="text-right font-bold text-muted-foreground">Quantity</TableHead>
                  <TableHead className="text-right font-bold text-muted-foreground">Avg Buy Price</TableHead>
                  <TableHead className="text-right font-bold text-muted-foreground">Current Price</TableHead>
                  <TableHead className="text-right font-bold text-muted-foreground">Value</TableHead>
                  <TableHead className="text-right font-bold text-muted-foreground">Weight</TableHead>
                  <TableHead className="text-right font-bold text-muted-foreground">P/L</TableHead>
                  <TableHead className="text-center font-bold text-muted-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHoldings.map((h) => {
                  const weight = (h.value / totalValue) * 100
                  return (
                    <TableRow
                      key={h.id}
                      className="border-border/10 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedHolding(h)}
                    >
                      <TableCell className="font-bold text-foreground py-4" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/stock/${h.symbol}`} className="hover:underline hover:text-primary transition-colors">
                          {h.symbol}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-medium text-xs max-w-[150px] truncate">
                        {h.symbol} Corporation
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{formatShares(h.shares)}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{formatUsd(h.avg_price)}</TableCell>
                      <TableCell className="text-right tabular-nums font-bold text-foreground">
                        {h.currentPrice ? formatUsd(h.currentPrice) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-bold text-foreground">{formatUsd(h.value)}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium text-muted-foreground">{weight.toFixed(2)}%</TableCell>
                      <TableCell className={cn(
                        "text-right tabular-nums font-bold",
                        h.pl >= 0 ? "text-finance-success" : "text-finance-danger"
                      )}>
                        {h.pl >= 0 ? "+" : ""}{formatUsd(h.pl)}
                        <span className="block text-[10px] font-medium">
                          ({h.plPct >= 0 ? "+" : ""}{h.plPct.toFixed(2)}%)
                        </span>
                      </TableCell>
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Button asChild variant="outline" size="sm" className="h-8 border-border/30 text-xs font-bold hover:bg-foreground hover:text-white transition-all">
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
      <Card className="border-border/20 bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/10 bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <History className="size-4 text-muted-foreground" />
            <CardTitle className="text-lg font-bold text-foreground">Transaction History</CardTitle>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Button size="sm" variant={txFilter === "all" ? "default" : "ghost"} onClick={() => setTxFilter("all")} className={cn("h-7 px-3 text-xs font-bold", txFilter === "all" ? "shadow-sm" : "")}>All</Button>
              <Button size="sm" variant={txFilter === "buy" ? "default" : "ghost"} onClick={() => setTxFilter("buy")} className={cn("h-7 px-3 text-xs font-bold", txFilter === "buy" ? "bg-finance-success/10 text-finance-success hover:bg-finance-success/20 shadow-none" : "")}>Buy</Button>
              <Button size="sm" variant={txFilter === "sell" ? "default" : "ghost"} onClick={() => setTxFilter("sell")} className={cn("h-7 px-3 text-xs font-bold", txFilter === "sell" ? "bg-finance-danger/10 text-finance-danger hover:bg-finance-danger/20 shadow-none" : "")}>Sell</Button>
            </div>
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Symbol..."
                value={txSearch}
                onChange={e => setTxSearch(e.target.value)}
                className="pl-9 h-9 shadow-none bg-background"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 max-h-[400px] overflow-y-auto">
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-sm font-medium text-muted-foreground">
              No transactions match your filters.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-background/50 sticky top-0 shadow-sm z-10">
                <TableRow className="hover:bg-transparent border-border/10">
                  <TableHead className="font-bold text-muted-foreground py-4">Date</TableHead>
                  <TableHead className="font-bold text-muted-foreground">Type</TableHead>
                  <TableHead className="font-bold text-muted-foreground">Symbol</TableHead>
                  <TableHead className="text-right font-bold text-muted-foreground">Quantity</TableHead>
                  <TableHead className="text-right font-bold text-muted-foreground">Price</TableHead>
                  <TableHead className="text-right font-bold text-muted-foreground">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((t) => (
                  <TableRow key={t.id} className="border-border/10 hover:bg-muted/30 transition-colors">
                    <TableCell className="whitespace-nowrap text-muted-foreground font-medium text-xs py-4">
                      {formatWhen(t.executed_at)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={t.side === "buy" ? "success" : "destructive"}
                        className="font-bold uppercase tracking-wider text-[10px]"
                      >
                        {t.side}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-foreground">
                      <Link href={`/stock/${t.symbol}`} className="hover:underline hover:text-primary transition-colors">
                        {t.symbol}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{formatShares(t.shares)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{formatUsd(t.unit_price_usd)}</TableCell>
                    <TableCell className="text-right tabular-nums font-bold text-foreground">
                      {formatUsd(Math.abs(t.total_cash_delta_usd))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Insights */}
      <Card className="border-border/20 bg-primary/5 border-primary/20 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
            <Lightbulb className="size-5" /> Portfolio Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-3">
                <AlertCircle className="size-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm font-medium text-foreground/90 leading-relaxed">{insight}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Details Drawer */}
      <HoldingDrawer
        holding={selectedHolding}
        onClose={() => setSelectedHolding(null)}
        transactions={snapshot.transactions.filter(t => t.symbol === selectedHolding?.symbol)}
      />

    </main>
  )
}
