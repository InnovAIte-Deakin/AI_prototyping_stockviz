import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Globe,
  Scale,
  ServerCog,
  Sliders,
  Star,
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
    label: "Wishlist",
    description: "Track saved symbols and jump back into research quickly.",
    icon: Star,
    href: "/wishlist",
    status: "live",
    matchPrefixes: ["/wishlist"],
  },
  {
    label: "Compare",
    description: "Compare symbols side by side with the new comparison surface.",
    icon: Scale,
    href: "/compare",
    status: "live",
    matchPrefixes: ["/compare"],
  },
  {
    label: "Learn",
    description: "Open the guided learning center for investing concepts.",
    icon: BookOpen,
    href: "/learn",
    status: "live",
    matchPrefixes: ["/learn"],
  },
  {
    label: "Admin",
    description:
      "Inspect runtime diagnostics, service readiness, cache state, and API usage.",
    icon: ServerCog,
    href: "/admin",
    status: "live",
    matchPrefixes: ["/admin"],
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
    label: "Wishlist",
    href: "/wishlist",
    description: "Review saved symbols and current quote movement.",
  },
  {
    label: "Compare",
    href: "/compare",
    description: "Compare multiple symbols in one workspace.",
  },
  {
    label: "Learn",
    href: "/learn",
    description: "Explore guided investing concepts.",
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
  {
    label: "Admin diagnostics",
    href: "/admin",
    description:
      "Inspect service configuration, cache state, and API usage from the root app.",
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
