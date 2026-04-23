import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PortfolioView } from "@/components/portfolio/portfolio-view";
import {
  PortfolioAuthError,
  getPortfolioSnapshotForCurrentUser,
} from "@/lib/portfolio/holdings-service";
import { UserFeatureAuthError } from "@/lib/user/session";
import { getUserFeatureSnapshotForCurrentUser } from "@/lib/user/user-feature-service";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Manage your persisted StockViz holdings with authenticated Supabase-backed portfolio storage.",
};

async function loadPortfolioSnapshot() {
  try {
    const [portfolio, userFeatures] = await Promise.all([
      getPortfolioSnapshotForCurrentUser(),
      getUserFeatureSnapshotForCurrentUser(),
    ]);

    return { portfolio, userFeatures };
  } catch (error) {
    if (
      error instanceof PortfolioAuthError ||
      error instanceof UserFeatureAuthError
    ) {
      redirect("/login");
    }

    throw error;
  }
}

export default async function PortfolioPage() {
  const { portfolio, userFeatures } = await loadPortfolioSnapshot();

  return (
    <PortfolioView
      holdings={portfolio.holdings}
      personalization={userFeatures}
      summary={portfolio.summary}
    />
  );
}
