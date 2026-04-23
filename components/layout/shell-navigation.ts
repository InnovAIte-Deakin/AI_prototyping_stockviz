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
      "Browse the live market session, news, and curated symbol discovery from the root app.",
    icon: Globe,
    href: "/market",
    status: "live",
    matchPrefixes: ["/market"],
  },
  {
    label: "Portfolio",
    description:
      "Manage persisted holdings for the signed-in user from the root app portfolio route.",
    icon: TrendingUp,
    href: "/portfolio",
    status: "live",
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
      "Indicator controls now live inside analysis; a standalone route is still deferred.",
    icon: Activity,
    href: null,
    status: "planned",
    matchPrefixes: ["/indicators"],
  },
  {
    label: "Weights",
    description:
      "Weight controls now live inside analysis; a standalone route is still deferred.",
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
    label: "Market",
    href: "/market",
    description:
      "Browse live session status, news, and curated stock discovery.",
  },
  {
    label: "Portfolio",
    href: "/portfolio",
    description:
      "View, add, edit, and delete persisted holdings for the signed-in user.",
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
