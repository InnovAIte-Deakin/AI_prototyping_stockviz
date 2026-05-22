"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Trash2, TrendingUp, TrendingDown, Clock, ChevronUp, ChevronDown, Star, Activity } from "lucide-react"
import { useWishlist } from "@/components/providers/wishlist-provider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatUsd, formatPct, formatWhen } from "@/lib/formatters"
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

interface WishlistItem {
  id: string
  created_at: string
  stockId: string
  symbol: string
  name: string | null
}

interface QuoteData {
  dp?: number
  c?: number
}

const WishlistSummary = ({
  items,
  quotes,
  loading
}: {
  items: WishlistItem[],
  quotes: Record<string, QuoteData>,
  loading: boolean
}) => {
  const stats = React.useMemo(() => {
    let topGainer = { symbol: "", change: -Infinity }
    let topLoser = { symbol: "", change: Infinity }
    let totalChange = 0
    let validCount = 0

    Object.entries(quotes).forEach(([symbol, q]) => {
      if (!q || q.dp === undefined) return
      if (q.dp > topGainer.change) topGainer = { symbol, change: q.dp }
      if (q.dp < topLoser.change) topLoser = { symbol, change: q.dp }
      totalChange += q.dp
      validCount++
    })

    return {
      topGainer: topGainer.symbol !== "" ? topGainer : null,
      topLoser: topLoser.symbol !== "" ? topLoser : null,
      averageMove: validCount > 0 ? totalChange / validCount : null
    }
  }, [quotes])

  const summaryData = [
    {
      label: "Total Watchlist",
      value: items.length.toString(),
      sub: "Tracked stocks",
      icon: Star,
      color: "text-primary"
    },
    {
      label: "Top Gainer",
      value: stats.topGainer ? stats.topGainer.symbol : "—",
      sub: stats.topGainer ? formatPct(stats.topGainer.change) : "No data",
      icon: TrendingUp,
      color: "text-finance-success"
    },
    {
      label: "Top Loser",
      value: stats.topLoser ? stats.topLoser.symbol : "—",
      sub: stats.topLoser ? formatPct(stats.topLoser.change) : "No data",
      icon: TrendingDown,
      color: "text-finance-danger"
    },
    {
      label: "Average Move",
      value: stats.averageMove !== null ? formatPct(stats.averageMove) : "—",
      sub: "Across wishlist",
      icon: Activity,
      color: stats.averageMove !== null ? (stats.averageMove >= 0 ? "text-finance-success" : "text-finance-danger") : "text-muted-foreground"
    }
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {summaryData.map((s) => (
        <Card key={s.label} className="group bg-card border-border/20 shadow-sm transition-all">
          <CardHeader className="p-4 pb-1.5 flex flex-row items-center justify-between space-y-0">
            <span className="text-sm font-semibold text-muted-foreground">{s.label}</span>
            <s.icon className={cn("h-4 w-4 transition-colors", s.color)} />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {loading ? (
              <div className="space-y-2">
                <div className="h-7 w-20 animate-pulse rounded bg-muted" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              </div>
            ) : (
              <>
                <p className="text-xl font-bold text-foreground">
                  {s.value}
                </p>
                <p className={cn("mt-0.5 text-xs font-medium", s.label === "Total Watchlist" ? "text-muted-foreground" : s.color)}>
                  {s.sub}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

const WishlistRow = ({ item, quote, loading }: { item: WishlistItem, quote: QuoteData, loading: boolean }) => {
  const { toggleWishlist } = useWishlist()
  const router = useRouter()

  const currentPrice = quote?.c ?? null
  const dailyChange = quote?.dp ?? null
  const isPositive = dailyChange !== null && dailyChange >= 0

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a') || (e.target as HTMLElement).closest('[role="dialog"]')) return
    if (router) router.push(`/stock/${item.symbol}`)
  }

  return (
    <tr
      className="group border-b border-border/10 hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={handleRowClick}
    >
      <td className="py-4 pl-6 pr-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 font-mono text-sm font-bold text-primary">
            {item.symbol.charAt(0)}
          </div>
          <div>
            <Link href={`/stock/${item.symbol}`} className="font-mono text-base font-bold tracking-tight text-foreground hover:text-primary hover:underline transition-colors" onClick={(e) => e.stopPropagation()}>
              {item.symbol}
            </Link>
            <p className="line-clamp-1 text-xs font-medium text-muted-foreground">{item.name}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm font-semibold tabular-nums text-foreground">
        {loading ? (
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        ) : (
          formatUsd(currentPrice)
        )}
      </td>
      <td className="px-6 py-4 text-sm font-bold tabular-nums">
        {loading ? (
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        ) : (
          <div className={cn("flex items-center gap-1", isPositive ? "text-finance-success" : "text-finance-danger")}>
            {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {formatPct(dailyChange)}
          </div>
        )}
      </td>
      <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="size-3" />
          {formatWhen(item.created_at)}
        </div>
      </td>
      <td className="py-4 pl-3 pr-6 text-right">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {item.symbol} from wishlist?</AlertDialogTitle>
              <AlertDialogDescription>
                You&apos;re about to remove {item.name || item.symbol} from your watchlist. You can always add it back later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => toggleWishlist(item.symbol)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </td>
    </tr>
  )
}

type SortKey = "symbol" | "price" | "change" | "date"
type SortDir = "asc" | "desc"
type FilterType = "all" | "gainers" | "losers" | "nodata"

const SortIndicator = ({ column, currentKey, currentDir }: { column: SortKey, currentKey: SortKey, currentDir: SortDir }) => {
  if (currentKey !== column) return null
  return currentDir === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />
}

export default function WishlistPage() {
  const { items, isLoading: isListLoading } = useWishlist()
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState<FilterType>("all")
  const [quotes, setQuotes] = React.useState<Record<string, QuoteData>>({})
  const [isQuotesLoading, setIsQuotesLoading] = React.useState(true)
  const [sortConfig, setSortConfig] = React.useState<{ key: SortKey, dir: SortDir }>({ key: "date", dir: "desc" })

  React.useEffect(() => {
    if (items.length === 0) {
      setIsQuotesLoading(false)
      return
    }

    async function fetchAll() {
      setIsQuotesLoading(true)
      const results: Record<string, QuoteData> = {}
      await Promise.all(
        items.map(async (item) => {
          try {
            const res = await fetch(`/api/quote?symbol=${item.symbol}`)
            if (res.ok) {
              results[item.symbol] = await res.json()
            }
          } catch (e) {
            console.error(e)
          }
        })
      )
      setQuotes(results)
      setIsQuotesLoading(false)
    }
    fetchAll()
  }, [items])

  const toggleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc"
    }))
  }

  const processedItems = React.useMemo(() => {
    let result = [...items]

    // 1. Search filter
    if (search.trim()) {
      const query = search.toLowerCase()
      result = result.filter(
        (item) =>
          item.symbol.toLowerCase().includes(query) ||
          (item.name?.toLowerCase().includes(query) ?? false)
      )
    }

    // 2. Status filter
    if (filter !== "all") {
      result = result.filter((item) => {
        const q = quotes[item.symbol]
        if (filter === "nodata") return !q || q.dp === undefined
        if (!q || q.dp === undefined) return false
        if (filter === "gainers") return q.dp > 0
        if (filter === "losers") return q.dp < 0
        return true
      })
    }

    // 3. Sorting
    result.sort((a, b) => {
      let valA: string | number, valB: string | number

      switch (sortConfig.key) {
        case "symbol":
          valA = a.symbol
          valB = b.symbol
          break
        case "price":
          valA = quotes[a.symbol]?.c ?? 0
          valB = quotes[b.symbol]?.c ?? 0
          break
        case "change":
          valA = quotes[a.symbol]?.dp ?? -Infinity
          valB = quotes[b.symbol]?.dp ?? -Infinity
          break
        case "date":
          valA = new Date(a.created_at).getTime()
          valB = new Date(b.created_at).getTime()
          break
      }

      if (valA < valB) return sortConfig.dir === "asc" ? -1 : 1
      if (valA > valB) return sortConfig.dir === "asc" ? 1 : -1
      return 0
    })

    return result
  }, [items, search, quotes, sortConfig, filter])

  const renderSortIndicator = (column: SortKey) => (
    <SortIndicator column={column} currentKey={sortConfig.key} currentDir={sortConfig.dir} />
  )

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      <main className="mx-auto w-full max-w-7xl space-y-10 px-6 py-10">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Wishlist
            </h1>
            <p className="text-base font-medium text-muted-foreground max-w-2xl">
              Keep track of stocks you&apos;re watching. Monitor prices and jump into analysis when the time is right.
            </p>
          </div>

          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search wishlist..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9 bg-card border-border/20 shadow-sm"
            />
          </div>
        </header>

        {!isListLoading && items.length > 0 && (
          <WishlistSummary items={items} quotes={quotes} loading={isQuotesLoading} />
        )}

        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {(["all", "gainers", "losers", "nodata"] as FilterType[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                className={cn(
                  "h-8 rounded-full px-4 text-xs font-bold capitalize transition-all",
                  filter !== f && "bg-card border-border/20 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {f === "nodata" ? "No Data" : f}
              </Button>
            ))}
          </div>

          {isListLoading ? (
            <Card className="border-border/10 bg-card/50">
              <CardContent className="p-0">
                <div className="divide-y divide-border/10">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-6">
                      <div className="flex gap-4 items-center">
                        <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
                        <div className="space-y-2">
                          <div className="h-5 w-16 rounded bg-muted animate-pulse" />
                          <div className="h-3 w-32 rounded bg-muted animate-pulse" />
                        </div>
                      </div>
                      <div className="h-8 w-24 rounded-lg bg-muted animate-pulse" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            <Card className="border-2 border-dashed border-border/10 bg-muted/5 py-20 text-center shadow-none">
              <CardContent className="flex flex-col items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted/10">
                  <Search className="size-8 text-muted-foreground/30" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-foreground">Your wishlist is empty</p>
                  <p className="text-sm text-muted-foreground">Search for a stock and tap the star to add it here.</p>
                </div>
                <Link href="/dashboard">
                  <Button className="mt-4 font-bold">
                    Go to Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden border-border/10 bg-card shadow-md shadow-foreground/5">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border/10 bg-muted/5 text-sm font-semibold text-muted-foreground">
                        <th
                          className="px-6 py-4 font-semibold cursor-pointer hover:text-primary transition-colors text-sm"
                          onClick={() => toggleSort("symbol")}
                        >
                          <div className="flex items-center gap-1">
                            Symbol | Company
                            {renderSortIndicator("symbol")}
                          </div>
                        </th>
                        <th
                          className="px-6 py-4 font-semibold cursor-pointer hover:text-primary transition-colors text-sm"
                          onClick={() => toggleSort("price")}
                        >
                          <div className="flex items-center gap-1">
                            Price
                            <SortIndicator column="price" currentKey={sortConfig.key} currentDir={sortConfig.dir} />
                          </div>
                        </th>
                        <th
                          className="px-6 py-4 font-semibold cursor-pointer hover:text-primary transition-colors text-sm"
                          onClick={() => toggleSort("change")}
                        >
                          <div className="flex items-center gap-1">
                            Daily Change
                            <SortIndicator column="change" currentKey={sortConfig.key} currentDir={sortConfig.dir} />
                          </div>
                        </th>
                        <th
                          className="px-6 py-4 font-semibold cursor-pointer hover:text-primary transition-colors text-sm"
                          onClick={() => toggleSort("date")}
                        >
                          <div className="flex items-center gap-1">
                            Added Date
                            <SortIndicator column="date" currentKey={sortConfig.key} currentDir={sortConfig.dir} />
                          </div>
                        </th>
                        <th className="px-6 py-4 text-right font-semibold text-sm">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/10">
                      {processedItems.map((item) => (
                        <WishlistRow
                          key={item.id}
                          item={item}
                          quote={quotes[item.symbol]}
                          loading={isQuotesLoading}
                        />
                      ))}
                      {processedItems.length === 0 && (
                         <tr>
                           <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                         Keep an eye on your favorite companies. You haven&apos;t added anything to your wishlist yet.
                           </td>
                         </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
