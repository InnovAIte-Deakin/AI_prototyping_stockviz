import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  DatabaseZap,
  Search,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  liveRouteShortcuts,
  primaryNavItems,
  shellHighlights,
} from "@/components/layout/shell-navigation";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const plannedRoutes = primaryNavItems.filter(
    (item) => item.status === "planned",
  );

  return (
    <footer
      id="main-footer"
      className="mt-16 border-t border-[#ddd6d0] bg-[#f4f1ed]/80"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <Badge className="border-[#ddd6d0] bg-white text-[#6a706f]">
              Shared shell
            </Badge>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d8d1cb] bg-white text-[#5f5e5e] shadow-[0_10px_30px_rgba(55,49,45,0.05)]">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight text-[#4f4e4e]">
                  StockViz
                </p>
                <p className="text-sm text-[#6a706f]">
                  App Router migration shell
                </p>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-7 text-[#636968]">
              The lightweight header has been replaced by the routed shell used
              across the protected Next.js workspace. Live routes stay easy to
              reach, while unfinished surfaces remain visible as planned work.
            </p>
            <div className="rounded-[22px] border border-[#e2dbd4] bg-white p-4 shadow-[0_12px_28px_rgba(55,49,45,0.04)]">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-[#f3eeea] p-2 text-[#5f5e5e]">
                  <Search className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-[#4f4e4e]">
                    Symbol-first workflow
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#6a706f]">
                    Use the header search to jump directly into
                    `/stock/[symbol]` from anywhere in the protected shell.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-[#4f4e4e]">Live routes</h3>
            <ul className="space-y-2 text-sm">
              {liveRouteShortcuts.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-[#e2dbd4] bg-white px-4 py-3 transition-colors hover:bg-[#f8f5f2]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#4f4e4e]">
                          {item.label}
                        </span>
                        <Badge
                          variant="outline"
                          className="border-[#d7dfdb] bg-[#eef4f1] text-[#2f6b43]"
                        >
                          Live
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-[#6a706f]">
                        {item.description}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#7b7f7f]" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-[#4f4e4e]">Roadmap in shell</h3>
            <ul className="space-y-2 text-sm">
              {plannedRoutes.map((item) => {
                const Icon = item.icon;

                return (
                  <li
                    key={item.label}
                    className="flex items-start gap-3 rounded-2xl border border-[#e2dbd4] bg-white px-4 py-3"
                  >
                    <div className="rounded-2xl bg-[#f3eeea] p-2 text-[#5f5e5e]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#4f4e4e]">
                          {item.label}
                        </span>
                        <Badge
                          variant="outline"
                          className="border-[#ddd6d0] bg-[#f5f1ee] text-[#7b7f7f]"
                        >
                          Planned
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-[#6a706f]">
                        {item.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-[#4f4e4e]">Migration signals</h3>
            <div className="space-y-3">
              {shellHighlights.map((item, index) => {
                const Icon =
                  index === 0
                    ? Search
                    : index === 1
                      ? ShieldCheck
                      : DatabaseZap;

                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-[#e2dbd4] bg-white px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-[#f3eeea] p-2 text-[#5f5e5e]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-[#4f4e4e]">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#6a706f]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-[#ddd6d0] pt-8 text-sm text-[#6a706f] sm:flex-row sm:items-center sm:justify-between">
          <p>
            (c) {currentYear} StockViz. Shared shell parity is live; route
            expansion continues from the migration plan.
          </p>
          <p className="sm:text-right">
            Dashboard, market, portfolio, analysis, and stock detail are live.
            Learn remains staged, while indicators and weights now live inside
            analysis.
          </p>
        </div>
      </div>
    </footer>
  );
}
