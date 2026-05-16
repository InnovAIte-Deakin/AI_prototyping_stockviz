import { createServiceRoleClient } from "@/lib/supabase/admin"
import { loadPaperPortfolioSnapshot } from "./data"
import { fetchMarkPricesBySymbol } from "./mark-prices"

/**
 * Calculates current portfolio value and records a snapshot in portfolio_history.
 * Should be called after trades or daily via cron.
 */
export async function recordCurrentPortfolioSnapshot(userId: string) {
  const admin = createServiceRoleClient()
  const snapshot = await loadPaperPortfolioSnapshot(userId)
  
  const marks = await fetchMarkPricesBySymbol(snapshot.holdings.map((h) => h.symbol))
  
  let currentHoldingsValue = 0
  for (const h of snapshot.holdings) {
    const mark = marks.get(h.symbol.toUpperCase())
    currentHoldingsValue += (mark ?? h.avg_price) * h.shares
  }

  const totalValue = snapshot.paperCashUsd + currentHoldingsValue

  const { error } = await admin.rpc("record_portfolio_snapshot", {
    p_user_id: userId,
    p_total_value: totalValue,
    p_cash: snapshot.paperCashUsd,
    p_holdings_value: currentHoldingsValue
  })

  if (error) {
    console.error("Failed to record portfolio snapshot:", error)
  }
}
