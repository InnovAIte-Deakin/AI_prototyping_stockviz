import type { Metadata } from "next";

import { MarketOverview } from "@/components/market/market-overview";

export const metadata: Metadata = {
  title: "Market",
  description:
    "Browse the live US market session, recent news, and curated symbols from the migrated StockViz workspace.",
};

export default function MarketPage() {
  return <MarketOverview />;
}
