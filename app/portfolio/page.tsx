import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PaperPortfolioPanel } from "@/components/portfolio/paper-portfolio-panel";
import { PortfolioView } from "@/components/portfolio/portfolio-view";
import {
  PortfolioAuthError,
  getPortfolioSnapshotForCurrentUser,
} from "@/lib/portfolio/holdings-service";
import { loadPaperPortfolioSnapshot } from "@/lib/portfolio/paper-trading-service";
import { createClient } from "@/lib/supabase/server";
import { UserFeatureAuthError } from "@/lib/user/session";
import { getUserFeatureSnapshotForCurrentUser } from "@/lib/user/user-feature-service";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Manage your persisted StockViz holdings with authenticated Supabase-backed portfolio storage.",
};

async function getCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return user.id;
}

async function loadPortfolioSnapshot() {
  const userId = await getCurrentUserId();

  try {
    const [portfolio, userFeatures, paperPortfolio] = await Promise.all([
      getPortfolioSnapshotForCurrentUser(),
      getUserFeatureSnapshotForCurrentUser(),
      loadPaperPortfolioSnapshot(userId),
    ]);

    return { paperPortfolio, portfolio, userFeatures };
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
  const { paperPortfolio, portfolio, userFeatures } =
    await loadPortfolioSnapshot();

  return (
    <>
      <PortfolioView
        holdings={portfolio.holdings}
        personalization={userFeatures}
        summary={portfolio.summary}
      />
      <PaperPortfolioPanel snapshot={paperPortfolio} />
    </>
  );
}
