import { signOut } from "@/app/auth/actions"
import { PortfolioSummaryCard } from "@/components/dashboard/portfolio-summary-card"
import { MoversCarousel } from "@/components/dashboard/movers-carousel"
import { WishlistCard } from "@/components/dashboard/wishlist-card"
import { Button } from "@/components/ui/button"
import { fetchBiggestMovers } from "@/lib/fmp/biggest-movers"
import { createClient } from "@/lib/supabase/server"

const DashboardPage = async () => {
  const { gainers, losers, error } = await fetchBiggestMovers()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <section className="border-b border-zinc-900 bg-black pb-8 pt-6">
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

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <WishlistCard />
        </div>
      </section>

      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <p className="mb-10 text-sm text-zinc-500">You are signed in.</p>
        <form action={signOut}>
          <Button
            type="submit"
            variant="outline"
            className="h-11 rounded-xl border-zinc-700 bg-zinc-950 px-8 font-semibold text-zinc-100 hover:bg-zinc-900"
          >
            Sign out
          </Button>
        </form>
      </div>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
        {user ? (
          <div className="max-w-4xl">
            <PortfolioSummaryCard userId={user.id} />
          </div>
        ) : null}

        <div className="flex flex-col items-center justify-center px-2 py-8 text-center">
          <p className="mb-10 text-sm text-zinc-500">You are signed in.</p>
          <form action={signOut}>
            <Button
              type="submit"
              variant="outline"
              className="h-11 rounded-xl border-zinc-700 bg-zinc-950 px-8 font-semibold text-zinc-100 hover:bg-zinc-900"
            >
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
