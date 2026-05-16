import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { fetchMarkPricesBySymbol } from "@/lib/portfolio/mark-prices"
import { loadPaperPortfolioSnapshot } from "@/lib/portfolio/data"
import { cn } from "@/lib/utils"
import { Wallet, Banknote, LineChart, PieChart } from "lucide-react"

const formatUsd = (n: number): string =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

export const PortfolioSummarySkeleton = () => (
  <div className="flex w-full gap-4 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-4 md:pb-0">
    {[...Array(4)].map((_, i) => (
      <Card key={i} className="min-w-[160px] shrink-0 flex-1 border-[#adb3b2]/20 bg-white shadow-sm md:min-w-0">
        <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
          <div className="h-3 w-16 bg-[#f2f4f3] rounded animate-pulse" />
          <div className="h-3.5 w-3.5 bg-[#f2f4f3] rounded animate-pulse" />
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2">
          <div className="h-6 w-24 bg-[#f2f4f3] rounded animate-pulse" />
          <div className="h-3 w-20 bg-[#f2f4f3] rounded animate-pulse" />
        </CardContent>
      </Card>
    ))}
  </div>
)

export const PortfolioSummaryRow = async ({ userId }: { userId: string }) => {
  let stats: Array<{ label: string; value: string; sub: string; trend?: number; icon: React.ComponentType<{ className?: string }> }> = []
  
  try {
    const snapshot = await loadPaperPortfolioSnapshot(userId)
    
    // If no snapshot, use default values for a new account
    const safeSnapshot = snapshot ?? {
      paperCashUsd: 100000,
      holdings: [],
      realizedPlUsd: 0,
      history: []
    }

    const marks = await fetchMarkPricesBySymbol(safeSnapshot.holdings.map((h) => h.symbol))

    const totalValue = safeSnapshot.paperCashUsd + (safeSnapshot.holdings.reduce((acc, h) => {
      const mark = marks.get(h.symbol.toUpperCase())
      return acc + (mark ?? h.avg_price) * h.shares
    }, 0))

    stats = [
      { label: "Total Value", value: formatUsd(totalValue), sub: "Total equity + cash", icon: Wallet },
      { label: "Cash Balance", value: formatUsd(safeSnapshot.paperCashUsd), sub: "Available capital", icon: Banknote },
      { label: "Today's Return", value: "+0.00%", sub: "Since market open", trend: 0, icon: LineChart },
      { label: "Holdings", value: `${safeSnapshot.holdings.length} stocks`, sub: "Active positions", icon: PieChart },
    ]
  } catch (error) {
    console.error("Error loading portfolio summary:", error)
    return (
      <Card className="border-[#fe8983]/30 bg-rose-50/50 p-6 text-center">
        <p className="text-sm font-bold text-rose-700">Portfolio summary unavailable</p>
        <p className="text-xs text-rose-600 mt-1">We&apos;re having trouble loading your balance right now. Please try refreshing.</p>
      </Card>
    )
  }

  return (
    <div className="flex w-full gap-4 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
      {stats.map((s) => (
        <Card key={s.label} className="group min-w-[160px] shrink-0 flex-1 border-[#adb3b2]/20 bg-white shadow-sm hover:shadow-md transition-all duration-200 md:min-w-0">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-medium text-[#adb3b2]">{s.label}</span>
            <s.icon className="h-3.5 w-3.5 text-[#adb3b2] transition-colors group-hover:text-[#5a6060]" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className={cn(
              "text-lg font-bold tabular-nums text-[#2d3433]",
              s.label === "Today's Return" && (
                (s.trend ?? 0) > 0 ? "text-emerald-600" : 
                (s.trend ?? 0) < 0 ? "text-rose-600" : 
                "text-[#5a6060]"
              )
            )}>
              {s.value}
            </p>
            <p className="text-[10px] text-[#5a6060] font-medium">{s.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
