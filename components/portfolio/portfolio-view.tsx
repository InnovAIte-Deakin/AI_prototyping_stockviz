"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  FolderHeart,
  Layers3,
  Plus,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { HoldingForm } from "@/components/portfolio/holding-form";
import { HoldingsTable } from "@/components/portfolio/holdings-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPersonalizationPanel } from "@/components/user/user-personalization-panel";
import type { Tables } from "@/lib/database.types";
import type { UserFeatureSnapshot } from "@/lib/user/user-feature-service";

type PortfolioHolding = Tables<"portfolio_holdings">;

type PortfolioViewProps = {
  holdings: PortfolioHolding[];
  personalization: UserFeatureSnapshot;
  summary: {
    holdingCount: number;
    totalCostBasis: number;
    totalShares: number;
    latestAcquiredAt: string | null;
    largestPosition: {
      symbol: string;
      costBasis: number;
    } | null;
  };
};

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const quantityFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

const formatCurrency = (value: number): string =>
  currencyFormatter.format(value);

const formatShares = (value: number): string => quantityFormatter.format(value);

const formatAcquiredDate = (value: string | null): string => {
  if (!value) {
    return "Not set";
  }

  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    dateStyle: "medium",
  });
};

const portfolioSignals = [
  {
    title: "Authenticated storage",
    description:
      "Holdings are read and written through the root Supabase server boundary, not directly from client components.",
    icon: ShieldCheck,
  },
  {
    title: "Single-lot model",
    description:
      "Each symbol is stored as one aggregated lot, which keeps the MVP simple and aligned with the schema contract.",
    icon: Layers3,
  },
  {
    title: "Next step ready",
    description:
      "This persistence slice keeps wishlist and preference work inside the active app.",
    icon: FolderHeart,
  },
] as const;

export function PortfolioView({
  holdings,
  personalization,
  summary,
}: PortfolioViewProps) {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingHolding, setEditingHolding] =
    React.useState<PortfolioHolding | null>(null);

  return (
    <div className="min-h-screen bg-[#f9f9f8] px-6 py-10 text-[#2d3433] md:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[30px] border border-[#e6e0db] bg-white p-8 shadow-[0_24px_64px_rgba(55,49,45,0.07)]">
          <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-[#d7dfdb] bg-[#eef4f1] text-[#2f6b43]">
                  Route live
                </Badge>
                <Badge className="border-[#ddd6d0] bg-[#f5f1ee] text-[#6a706f]">
                  Portfolio persistence MVP
                </Badge>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7b7f7f]">
                  Authenticated product surface
                </p>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[#5f5e5e] md:text-5xl">
                  Persist your holdings in the root app and keep the team on a
                  single branch of work.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[#636968]">
                  The portfolio route is now live in the migrated workspace. It
                  stores one aggregated holding per symbol for the signed-in
                  user, keeps reads and writes behind the server boundary, and
                  gives the team a stable surface to build on before wishlist
                  and preference flows land.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  className="h-11 rounded-xl bg-[#5f5e5e] px-5 text-white hover:bg-[#4f4e4e]"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add holding
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-xl border-[#d6d0cb] bg-[#f9f9f8] px-5 text-[#5f5e5e] hover:bg-[#f2efec]"
                >
                  <Link href="/market">
                    Browse market
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="rounded-[24px] border border-[#ece6e1] bg-[#fbf8f6] p-5">
                <p className="text-sm font-medium text-[#4f4e4e]">MVP scope</p>
                <p className="mt-2 text-sm leading-6 text-[#6a706f]">
                  This slice focuses on durable position storage: symbol,
                  shares, average cost, optional acquisition date, and notes.
                  Mark-to-market valuation and performance analytics can layer
                  on after the persistence contract is proven.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              {portfolioSignals.map((signal) => {
                const Icon = signal.icon;

                return (
                  <Card
                    key={signal.title}
                    className="rounded-[24px] border border-[#ece6e1] bg-[#fbf8f6] py-0 shadow-none"
                  >
                    <CardContent className="p-5">
                      <div className="mb-4 inline-flex rounded-2xl bg-white p-3 text-[#5f5e5e] shadow-[0_10px_24px_rgba(55,49,45,0.05)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h2 className="text-lg font-semibold text-[#4f4e4e]">
                        {signal.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-[#6a706f]">
                        {signal.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={<Wallet className="h-5 w-5" />}
            label="Total cost basis"
            value={formatCurrency(summary.totalCostBasis)}
            hint="Stored purchase value across all persisted lots."
          />
          <SummaryCard
            icon={<Layers3 className="h-5 w-5" />}
            label="Holding rows"
            value={String(summary.holdingCount)}
            hint="One aggregated row per symbol for the signed-in user."
          />
          <SummaryCard
            icon={<FolderHeart className="h-5 w-5" />}
            label="Total shares"
            value={formatShares(summary.totalShares)}
            hint="Combined share count across all stored symbols."
          />
          <SummaryCard
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Largest position"
            value={
              summary.largestPosition
                ? `${summary.largestPosition.symbol} (${formatCurrency(summary.largestPosition.costBasis)})`
                : "No holdings yet"
            }
            hint={`Latest acquired date: ${formatAcquiredDate(summary.latestAcquiredAt)}`}
          />
        </section>

        {holdings.length > 0 ? (
          <HoldingsTable
            holdings={holdings}
            onEditHolding={(holding) => setEditingHolding(holding)}
          />
        ) : (
          <section className="rounded-[28px] border border-dashed border-[#d9d2cc] bg-white/80 p-8 text-center shadow-[0_18px_48px_rgba(55,49,45,0.04)]">
            <div className="mx-auto max-w-2xl space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f3eeea] text-[#5f5e5e]">
                <Wallet className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-[#4f4e4e]">
                No holdings yet
              </h2>
              <p className="text-sm leading-7 text-[#6a706f]">
                Start with the first symbol you actually hold. Once the row is
                saved, the table, summary cards, and edit/delete workflows will
                all stay inside the migrated app surface.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  type="button"
                  className="h-11 rounded-xl bg-[#5f5e5e] px-5 text-white hover:bg-[#4f4e4e]"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add first holding
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-xl border-[#d6d0cb] bg-[#f9f9f8] px-5 text-[#5f5e5e] hover:bg-[#f2efec]"
                >
                  <Link href="/market">
                    Browse market
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        <UserPersonalizationPanel
          preferences={personalization.preferences}
          wishlist={personalization.wishlist}
        />
      </div>

      <HoldingForm
        mode="create"
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
      <HoldingForm
        mode="update"
        holding={editingHolding}
        open={Boolean(editingHolding)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingHolding(null);
          }
        }}
      />
    </div>
  );
}

function SummaryCard({
  hint,
  icon,
  label,
  value,
}: {
  hint: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-[24px] border border-[#e6e0db] bg-white py-0 shadow-[0_14px_34px_rgba(55,49,45,0.04)]">
      <CardContent className="p-5">
        <div className="mb-4 inline-flex rounded-2xl bg-[#f3eeea] p-3 text-[#5f5e5e]">
          {icon}
        </div>
        <p className="text-sm font-medium text-[#6a706f]">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[#4f4e4e]">
          {value}
        </p>
        <p className="mt-2 text-sm leading-6 text-[#7b7f7f]">{hint}</p>
      </CardContent>
    </Card>
  );
}
