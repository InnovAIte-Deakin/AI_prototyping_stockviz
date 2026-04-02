import { ArrowRight, ChartNoAxesCombined, SearchCode, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { SymbolSearch } from "@/components/search/symbol-search";
import { Button } from "@/components/ui/button";

const launchCards = [
  {
    title: "Live search",
    description: "Search symbols from the new root market service and jump straight into analysis.",
    icon: SearchCode,
  },
  {
    title: "Root analysis route",
    description: "Review score, recommendation, sentiment, and chart output in the migrated app shell.",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Protected flow",
    description: "The new slice runs inside the authenticated Next.js product surface rather than legacy routes.",
    icon: ShieldCheck,
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#f9f9f8] px-6 py-10 text-[#2d3433] md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 rounded-[28px] border border-[#e6e0db] bg-white p-8 shadow-[0_20px_60px_rgba(55,49,45,0.06)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7b7f7f]">
                Migration Launch Surface
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-[#5f5e5e] md:text-5xl">
                Search a symbol and open the first migrated analysis slice.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[#636968]">
                The dashboard now acts as the authenticated handoff into the new market-data pipeline.
                Search for a stock, open its analysis page, and validate the root services without
                going back through the legacy Express app.
              </p>
            </div>

            <form action={signOut}>
              <Button
                type="submit"
                variant="outline"
                className="h-11 rounded-xl border-[#d6d0cb] bg-[#f9f9f8] px-5 text-[#5f5e5e] hover:bg-[#f2efec]"
              >
                Sign Out
              </Button>
            </form>
          </div>

          <div className="rounded-[24px] border border-[#ece6e1] bg-[#fbf8f6] p-5">
            <p className="mb-3 text-sm font-medium text-[#6a706f]">Open analysis</p>
            <SymbolSearch submitLabel="Analyze symbol" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {launchCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="rounded-[22px] border border-[#e6e0db] bg-white p-5 shadow-[0_12px_32px_rgba(55,49,45,0.04)]"
              >
                <div className="mb-4 inline-flex rounded-2xl bg-[#f1ece8] p-3 text-[#5f5e5e]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-[#4f4e4e]">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#6a706f]">{card.description}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-[24px] border border-dashed border-[#d9d2cc] bg-white/70 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-[#4f4e4e]">Need a quick example?</p>
              <p className="text-sm text-[#6a706f]">
                Open the migrated route with a well-known ticker and verify the chart plus blended
                score output.
              </p>
            </div>
            <Button asChild className="h-11 rounded-xl bg-[#5f5e5e] px-5 text-white hover:bg-[#4f4e4e]">
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
