import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PortfolioView } from "@/components/portfolio/portfolio-view";
import {
  PortfolioAuthError,
  getPortfolioSnapshotForCurrentUser,
} from "@/lib/portfolio/holdings-service";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Manage your persisted StockViz holdings with authenticated Supabase-backed portfolio storage.",
};

async function loadPortfolioSnapshot() {
  try {
    return await getPortfolioSnapshotForCurrentUser();
  } catch (error) {
    if (error instanceof PortfolioAuthError) {
      redirect("/login");
    }

    throw error;
  }
}

export default async function PortfolioPage() {
  const snapshot = await loadPortfolioSnapshot();

  return <PortfolioView holdings={snapshot.holdings} summary={snapshot.summary} />;
}
