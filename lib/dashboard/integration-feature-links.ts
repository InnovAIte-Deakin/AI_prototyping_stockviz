export type DashboardIntegrationFeature = {
  description: string;
  href: string;
  label: string;
  title:
    | "Market movers"
    | "Paper trading"
    | "Price range explanations"
    | "Recommendation trends"
    | "Rich fundamentals"
    | "Technical analysis"
    | "Wishlist stars";
};

export const dashboardIntegrationFeatures = [
  {
    description:
      "Open a stock page to see SMA, Bollinger, RSI, MACD, ATR, and OBV computed from provider-backed OHLC data.",
    href: "/stock/AAPL",
    label: "Stock detail",
    title: "Technical analysis",
  },
  {
    description:
      "Select a range on the price chart and request a Gemini-backed explanation using FMP news context.",
    href: "/stock/AAPL",
    label: "Stock detail",
    title: "Price range explanations",
  },
  {
    description:
      "Review grouped fundamental metric charts, highlights, and the full metric table on the stock page.",
    href: "/stock/AAPL",
    label: "Stock detail",
    title: "Rich fundamentals",
  },
  {
    description:
      "Browse recommendation trend periods with a stacked visual and supporting analyst count table.",
    href: "/stock/AAPL",
    label: "Stock detail",
    title: "Recommendation trends",
  },
  {
    description:
      "Use star controls in dashboard search results and stock headers to manage your wishlist faster.",
    href: "/stock/AAPL",
    label: "Wishlist",
    title: "Wishlist stars",
  },
  {
    description:
      "Use simulated cash, stock-page buy/sell actions, and the portfolio ledger once paper cash is enabled.",
    href: "/portfolio",
    label: "Portfolio",
    title: "Paper trading",
  },
  {
    description:
      "Watch FMP-backed gainers and losers on this dashboard, with optional AI explanations for big moves.",
    href: "/dashboard#market-movers",
    label: "Dashboard",
    title: "Market movers",
  },
] satisfies DashboardIntegrationFeature[];
