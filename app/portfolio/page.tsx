import { redirect } from "next/navigation"
import { PortfolioClientView } from "@/components/portfolio/portfolio-client-view"
import { fetchMarkPricesBySymbol } from "@/lib/portfolio/mark-prices"
import { loadPaperPortfolioSnapshot } from "@/lib/portfolio/data"
import { ensurePortfolioHistory } from "@/lib/portfolio/history"
import { createClient } from "@/lib/supabase/server"

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

  const totalValue =
    snapshot.paperCashUsd +
    snapshot.holdings.reduce((acc, h) => {
      const mark = marks.get(h.symbol.toUpperCase())
      return acc + (mark ?? h.avg_price) * h.shares
    }, 0)

  const history = await ensurePortfolioHistory(user.id, snapshot, totalValue)

  // Convert marks Map to a plain Record<string, number> for the client component
  const marksRecord: Record<string, number> = {}
  marks.forEach((val, key) => {
    marksRecord[key] = val
  })

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      <PortfolioClientView snapshot={{ ...snapshot, history }} marks={marksRecord} />
    </div>
  )
}
