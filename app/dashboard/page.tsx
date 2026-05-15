import {
  ArrowRight,
  ChartNoAxesCombined,
  SearchCode,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { DashboardSpotlightChart } from "@/components/dashboard/dashboard-spotlight-chart";
import { MoversCarousel } from "@/components/dashboard/movers-carousel";
import { SymbolSearch } from "@/components/search/symbol-search";
import { Button } from "@/components/ui/button";
import { fetchBiggestMovers } from "@/lib/fmp/biggest-movers";

const launchCards = [
  {
    title: "Live search",
    description:
      "Search symbols from the active market service and jump straight into analysis.",
    icon: SearchCode,
  },
  {
    title: "Analysis workspace",
    description:
      "Review score, recommendation, sentiment, and chart output in the product workspace.",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Protected flow",
    description:
      "The analysis flow runs inside the authenticated Next.js product surface.",
    icon: ShieldCheck,
  },
];

export default async function DashboardPage() {
  const movers = await fetchBiggestMovers();
  const spotlight = movers.gainers[0] ?? null;

  return (
    <div className="min-h-screen bg-surface px-6 py-10 text-on-background md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 rounded-[28px] border border-border bg-white p-8 shadow-[0_20px_60px_rgba(55,49,45,0.06)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Research Workspace
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-surface-tint md:text-5xl">
                Search a symbol and open a full analysis workspace.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Search for a stock, open its analysis page, and review the
                latest market-data-backed signal.
              </p>
            </div>

            <form action={signOut}>
              <Button
                type="submit"
                variant="outline"
                className="h-11 rounded-xl border-border bg-surface px-5 text-surface-tint hover:bg-muted"
              >
                Sign Out
              </Button>
            </form>
          </div>

          <div className="rounded-[24px] border border-border bg-card p-5">
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              Open analysis
            </p>
            <SymbolSearch submitLabel="Analyze symbol" />
          </div>
        </div>

        <section className="space-y-4 rounded-[24px] border border-border bg-white p-5 shadow-[0_12px_32px_rgba(55,49,45,0.04)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Market movers
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-on-surface">
                Biggest gainers and losers
              </h2>
            </div>
            {movers.error ? (
              <p className="max-w-xl text-sm text-muted-foreground">
                {movers.error}
              </p>
            ) : null}
          </div>

          {!movers.error ? (
            <MoversCarousel gainers={movers.gainers} losers={movers.losers} />
          ) : null}
        </section>

        {spotlight ? (
          <DashboardSpotlightChart
            changePct={spotlight.changePct}
            companyName={spotlight.name}
            symbol={spotlight.symbol}
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          {launchCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="rounded-[22px] border border-border bg-white p-5 shadow-[0_12px_32px_rgba(55,49,45,0.04)]"
              >
                <div className="mb-4 inline-flex rounded-2xl bg-muted p-3 text-surface-tint">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-on-surface">
                  {card.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="rounded-[24px] border border-dashed border-border bg-white/70 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-on-surface">
                Need a quick example?
              </p>
              <p className="text-sm text-muted-foreground">
                Open the analysis route with a well-known ticker and review the
                chart plus blended score output.
              </p>
            </div>
            <Button
              asChild
              className="h-11 rounded-xl bg-primary px-5 text-white hover:bg-primary/90"
            >
              <Link href="/analysis/AAPL">
                Open AAPL
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

