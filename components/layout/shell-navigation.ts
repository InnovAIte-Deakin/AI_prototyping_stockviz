import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Globe,
  Sliders,
  TrendingUp,
} from "lucide-react";

export type ShellNavItem = {
  label: string;
  description: string;
  icon: LucideIcon;
  href: string | null;
  status: "live" | "planned";
  matchPrefixes: string[];
};

export const primaryNavItems: ShellNavItem[] = [
  {
    label: "Dashboard",
    description:
      "Launch search, analysis, and stock detail from the migrated workspace.",
    icon: BarChart3,
    href: "/dashboard",
    status: "live",
    matchPrefixes: ["/dashboard", "/analysis", "/stock"],
  },
  {
    label: "Market",
    description:
      "Dedicated market overview routing is still pending migration into the root app.",
    icon: Globe,
    href: null,
    status: "planned",
    matchPrefixes: ["/market"],
  },
  {
    label: "Portfolio",
    description:
      "Portfolio persistence and holdings workflows are queued after the shell work.",
    icon: TrendingUp,
    href: null,
    status: "planned",
    matchPrefixes: ["/portfolio"],
  },
  {
    label: "Learn",
    description:
      "Learning content remains in the legacy surface and still needs a root route.",
    icon: BookOpen,
    href: null,
    status: "planned",
    matchPrefixes: ["/learn"],
  },
  {
    label: "Indicators",
    description:
      "Technical indicator controls still need to move into the root analysis UX.",
    icon: Activity,
    href: null,
    status: "planned",
    matchPrefixes: ["/indicators"],
  },
  {
    label: "Weights",
    description:
      "Analysis weighting controls remain on the migration backlog for the root app.",
    icon: Sliders,
    href: null,
    status: "planned",
    matchPrefixes: ["/weights"],
  },
];

export const liveRouteShortcuts = [
  {
    label: "Dashboard",
    href: "/dashboard",
    description: "Protected launch surface for the migrated workspace.",
  },
  {
    label: "Sample analysis",
    href: "/analysis/AAPL",
    description:
      "Quick way to validate the analysis slice with a known symbol.",
  },
  {
    label: "Sample stock detail",
    href: "/stock/AAPL",
    description: "Open the stock detail widgets without typing a symbol first.",
  },
];

export const shellHighlights = [
  {
    title: "Global symbol search",
    description:
      "The shared header keeps Finnhub symbol lookup available from every protected page.",
  },
  {
    title: "Protected routing",
    description:
      "Supabase-backed session checks still gate the migrated app surface through proxy auth.",
  },
  {
    title: "Incremental migration",
    description:
      "Pending routes stay visible in the shell, but no longer send users into dead pages.",
  },
];

export function isNavItemActive(
  pathname: string | null,
  item: ShellNavItem,
): boolean {
  if (!pathname || item.status !== "live") {
    return false;
  }

  return item.matchPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
