import { Suspense } from "react"
import { DashboardSpotlightChart } from "@/components/dashboard/dashboard-spotlight-chart"
import { MoversCarousel } from "@/components/dashboard/movers-carousel"
import { PortfolioSummaryRow, PortfolioSummarySkeleton } from "@/components/dashboard/portfolio-summary-row"
import { PortfolioPerformanceChart } from "@/components/dashboard/portfolio-performance-chart"
import { MarketStatusCard } from "@/components/dashboard/market-status-card"
import { WishlistCard } from "@/components/dashboard/wishlist-card"
import { fetchBiggestMovers } from "@/lib/fmp/biggest-movers"
import { createClient } from "@/lib/supabase/server"
import { loadPaperPortfolioSnapshot } from "@/lib/portfolio/data"
import { ensurePortfolioHistory } from "@/lib/portfolio/history"
import { fetchMarkPricesBySymbol } from "@/lib/portfolio/mark-prices"
import { checkAndExecuteTriggers } from "@/lib/triggers/execution"
import type { User } from "@supabase/supabase-js"

const resolveFirstName = (
  user: User | null,
  profileFullName: string | null | undefined
): string => {
  const fromProfile = profileFullName?.trim().split(/\s+/)[0]
  if (fromProfile) {
    return fromProfile
  }
  const meta = user?.user_metadata
  const rawName =
    meta && typeof meta.full_name === "string" ? meta.full_name.trim() : ""
  if (rawName) {
    return rawName.split(/\s+/)[0] ?? "there"
  }
  return "there"
}

const DashboardPage = async () => {
  await checkAndExecuteTriggers()
  const { gainers, losers, error } = await fetchBiggestMovers()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profileFullName: string | null | undefined
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle()
    profileFullName = profile?.full_name
  }

  const snapshot = user ? await loadPaperPortfolioSnapshot(user.id) : null

  let currentBalance = 1_000_000
  let portfolioHistory: Awaited<ReturnType<typeof ensurePortfolioHistory>> = []

  if (snapshot && user) {
    const marks = await fetchMarkPricesBySymbol(snapshot.holdings.map((h) => h.symbol))
    const currentHoldingsValue = snapshot.holdings.reduce((acc, h) => {
      const mark = marks.get(h.symbol.toUpperCase())
      return acc + (mark ?? h.avg_price) * h.shares
    }, 0)
    currentBalance = snapshot.paperCashUsd + currentHoldingsValue
    portfolioHistory = await ensurePortfolioHistory(user.id, snapshot, currentBalance)
  }

  const firstName = resolveFirstName(user, profileFullName)
  const greetingName =
    firstName === "there" ? "there" : `${firstName.charAt(0).toUpperCase()}${firstName.slice(1)}`

  const spotlightGainer = gainers.at(0) ?? null

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      {/* Top Section: Market Movers */}
      <section className="bg-card/50 border-b border-border/20 py-1">
        {error ? (
          <div className="mx-auto max-w-7xl px-4 py-2 text-xs text-rose-600" role="alert">
            {error}
          </div>
        ) : (
          <MoversCarousel gainers={gainers} losers={losers} />
        )}
      </section>

      <main className="mx-auto w-full max-w-7xl space-y-12 px-6 py-10">
        {/* Header Section */}
        <header className="space-y-8">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Hi {greetingName}, welcome back
            </h1>
            <p className="text-base font-medium text-muted-foreground max-w-2xl">
              Everything you need to track your investment strategy in one place.
            </p>
          </div>
          
          <Suspense fallback={<PortfolioSummarySkeleton />}>
            {user ? (
              <div className="pt-2">
                <PortfolioSummaryRow userId={user.id} />
              </div>
            ) : null}
          </Suspense>
        </header>

        {/* Main Section: Row 1 - Performance & Status */}
        <div className="grid gap-10 lg:grid-cols-3 lg:items-stretch">
          {/* Performance Column - 2/3 Width */}
          <div className="lg:col-span-2">
            <PortfolioPerformanceChart 
              currentBalance={currentBalance} 
              history={portfolioHistory}
              className="h-full" 
            />
          </div>

          {/* Sidebar - 1/3 Width Stacked & Aligned */}
          <div className="flex flex-col gap-8 lg:col-span-1">
            <MarketStatusCard />
            <WishlistCard className="flex-1" />
          </div>
        </div>

        {/* Main Section: Row 2 - Spotlight (Wider) */}
        <section className="pt-6">
          {spotlightGainer && (
            <DashboardSpotlightChart
              symbol={spotlightGainer.symbol}
              companyName={spotlightGainer.name}
              changePct={spotlightGainer.changePct}
              className="border-dashed"
            />
          )}
        </section>
      </main>
    </div>
  )
}

export default DashboardPage
