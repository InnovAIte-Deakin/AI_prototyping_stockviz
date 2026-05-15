import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BotMessageSquare,
  ChartCandlestick,
  LineChart,
  ListChecks,
  Star,
  WalletCards,
} from "lucide-react";

import { dashboardIntegrationFeatures } from "@/lib/dashboard/integration-feature-links";

const featureIcons = {
  "Market movers": Activity,
  "Paper trading": WalletCards,
  "Price range explanations": BotMessageSquare,
  "Recommendation trends": ListChecks,
  "Rich fundamentals": ChartCandlestick,
  "Technical analysis": LineChart,
  "Wishlist stars": Star,
} as const;

export function StagingFeatureMap() {
  return (
    <section className="space-y-4" aria-labelledby="staging-feature-map-title">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            New in this branch
          </p>
          <h2
            className="mt-1 text-2xl font-semibold text-on-surface"
            id="staging-feature-map-title"
          >
            Integrated staging features
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          These cards map the new work to the pages where you can try it.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {dashboardIntegrationFeatures.map((feature) => {
          const Icon = featureIcons[feature.title];

          return (
            <Link
              className="group flex min-h-[168px] flex-col rounded-lg border border-border bg-white p-4 shadow-[0_10px_28px_rgba(55,49,45,0.04)] transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_16px_36px_rgba(55,49,45,0.08)]"
              href={feature.href}
              key={feature.title}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-lg bg-muted p-2 text-surface-tint">
                  <Icon className="size-4" />
                </div>
                <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
                  {feature.label}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <h3 className="font-heading text-base font-semibold text-on-surface">
                  {feature.title}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </div>

              <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-primary">
                Open
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
