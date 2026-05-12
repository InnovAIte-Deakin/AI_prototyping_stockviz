import { signOut } from "@/app/auth/actions"
import { DashboardSpotlightChart } from "@/components/dashboard/dashboard-spotlight-chart"
import { MoversCarousel } from "@/components/dashboard/movers-carousel"
import { PortfolioSummaryCard } from "@/components/dashboard/portfolio-summary-card"
import { WishlistCard } from "@/components/dashboard/wishlist-card"
import { Button } from "@/components/ui/button"
import { fetchBiggestMovers } from "@/lib/fmp/biggest-movers"
import { createClient } from "@/lib/supabase/server"
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

  const firstName = resolveFirstName(user, profileFullName)
  const greetingName =
    firstName === "there" ? "there" : `${firstName.charAt(0).toUpperCase()}${firstName.slice(1)}`

  const spotlightGainer = gainers.at(0) ?? null

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <section className="border-b border-zinc-900 bg-gradient-to-b from-zinc-950 to-black pb-6 pt-5">
        {error ? (
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <p
              className="rounded-lg border border-amber-900/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-200"
              role="alert"
            >
              {error}
            </p>
          </div>
        ) : (
          <MoversCarousel gainers={gainers} losers={losers} />
        )}
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-6 border-b border-zinc-900/80 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Hi {greetingName}, welcome back
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
              Track your paper portfolio and wishlist, skim today&apos;s movers, and explore a
              highlighted gainer below.
            </p>
          </div>
          <form action={signOut} className="shrink-0">
            <Button
              type="submit"
              variant="outline"
              className="h-11 w-full rounded-xl border-zinc-700 bg-zinc-950 px-8 font-semibold text-zinc-100 hover:bg-zinc-900 sm:w-auto"
            >
              Sign out
            </Button>
          </form>
        </header>

        <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
          <div className="space-y-6 lg:col-span-2">
            {spotlightGainer ? (
              <DashboardSpotlightChart
                symbol={spotlightGainer.symbol}
                companyName={spotlightGainer.name}
                changePct={spotlightGainer.changePct}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-10 text-center text-sm text-zinc-500">
                {error
                  ? "Mover data is unavailable, so no spotlight chart this session."
                  : "No gainer data right now. Check back after the market updates."}
              </div>
            )}

            {user ? (
              <PortfolioSummaryCard userId={user.id} />
            ) : null}
          </div>

          <div className="lg:col-span-1">
            <WishlistCard />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
