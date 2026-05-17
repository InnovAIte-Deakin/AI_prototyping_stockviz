import { redirect } from "next/navigation"
import { PortfolioClientView } from "@/components/portfolio/portfolio-client-view"
import { fetchMarkPricesBySymbol } from "@/lib/portfolio/mark-prices"
import { loadPaperPortfolioSnapshot } from "@/lib/portfolio/data"
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

  // Convert marks Map to a plain Record<string, number> for the client component
  const marksRecord: Record<string, number> = {}
  marks.forEach((val, key) => {
    marksRecord[key] = val
  })

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      <PortfolioClientView snapshot={snapshot} marks={marksRecord} />
    </div>
  )
}
