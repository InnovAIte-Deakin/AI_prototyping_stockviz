import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/admin"
import { loadPaperPortfolioSnapshot, type PaperPortfolioSnapshot, type PortfolioHistoryPoint } from "./data"
import { fetchMarkPricesBySymbol } from "./mark-prices"

export const DEFAULT_PAPER_START_USD = 1_000_000

const holdingCostValue = (positions: Map<string, { shares: number; avgPrice: number }>): number => {
  let total = 0
  for (const pos of positions.values()) {
    total += pos.shares * pos.avgPrice
  }
  return total
}

/**
 * Reconstructs a performance curve from paper trade transactions when DB snapshots are missing.
 */
export const buildHistoryFromTransactions = (
  snapshot: PaperPortfolioSnapshot,
  currentTotalValue: number
): PortfolioHistoryPoint[] => {
  const txs = [...snapshot.transactions].sort(
    (a, b) => new Date(a.executed_at).getTime() - new Date(b.executed_at).getTime()
  )

  if (txs.length === 0) {
    const earliest =
      snapshot.holdings
        .map((h) => h.acquired_at ?? h.created_at)
        .sort()[0] ?? new Date().toISOString()
    return [
      { total_value_usd: DEFAULT_PAPER_START_USD, recorded_at: earliest },
      { total_value_usd: currentTotalValue, recorded_at: new Date().toISOString() },
    ]
  }

  let cash = DEFAULT_PAPER_START_USD
  const positions = new Map<string, { shares: number; avgPrice: number }>()
  const points: PortfolioHistoryPoint[] = []

  for (const tx of txs) {
    const sym = tx.symbol.toUpperCase()
    cash += tx.total_cash_delta_usd

    if (tx.side === "buy") {
      const existing = positions.get(sym)
      if (!existing) {
        positions.set(sym, { shares: tx.shares, avgPrice: tx.unit_price_usd })
      } else {
        const newShares = existing.shares + tx.shares
        const newAvg =
          (existing.shares * existing.avgPrice + tx.shares * tx.unit_price_usd) / newShares
        positions.set(sym, { shares: newShares, avgPrice: newAvg })
      }
    } else if (tx.side === "sell") {
      const existing = positions.get(sym)
      if (existing) {
        const remaining = existing.shares - tx.shares
        if (remaining <= 0) {
          positions.delete(sym)
        } else {
          positions.set(sym, { shares: remaining, avgPrice: existing.avgPrice })
        }
      }
    }

    points.push({
      total_value_usd: cash + holdingCostValue(positions),
      recorded_at: tx.executed_at,
    })
  }

  const last = points[points.length - 1]
  if (!last || Math.abs(last.total_value_usd - currentTotalValue) > 0.01) {
    points.push({
      total_value_usd: currentTotalValue,
      recorded_at: new Date().toISOString(),
    })
  }

  return points
}

/**
 * Returns persisted history when available; otherwise backfills or synthesizes from trades.
 */
export const ensurePortfolioHistory = async (
  userId: string,
  snapshot: PaperPortfolioSnapshot,
  currentTotalValue: number
): Promise<PortfolioHistoryPoint[]> => {
  if (snapshot.history.length > 0) {
    return snapshot.history
  }

  const hasActivity = snapshot.holdings.length > 0 || snapshot.transactions.length > 0
  if (!hasActivity) {
    return []
  }

  const recorded = await recordCurrentPortfolioSnapshot(userId)
  if (recorded) {
    const supabase = await createClient()
    const { data: history } = await supabase
      .from("portfolio_history")
      .select("total_value_usd, recorded_at")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: true })
      .limit(30)

    if (history && history.length > 0) {
      return history
    }
  }

  return buildHistoryFromTransactions(snapshot, currentTotalValue)
}

/**
 * Calculates current portfolio value and records a snapshot in portfolio_history.
 * Should be called after trades or daily via cron.
 * Uses a direct insert via service role (bypasses RLS) instead of the RPC, which
 * may lack execute grants for service_role in older migrations.
 */
export async function recordCurrentPortfolioSnapshot(userId: string): Promise<boolean> {
  let admin
  try {
    admin = createServiceRoleClient()
  } catch {
    return false
  }

  const snapshot = await loadPaperPortfolioSnapshot(userId)

  const marks = await fetchMarkPricesBySymbol(snapshot.holdings.map((h) => h.symbol))

  let currentHoldingsValue = 0
  for (const h of snapshot.holdings) {
    const mark = marks.get(h.symbol.toUpperCase())
    currentHoldingsValue += (mark ?? h.avg_price) * h.shares
  }

  const totalValue = snapshot.paperCashUsd + currentHoldingsValue

  const { error } = await admin.from("portfolio_history").insert({
    user_id: userId,
    total_value_usd: totalValue,
    paper_cash_usd: snapshot.paperCashUsd,
    holdings_value_usd: currentHoldingsValue,
  })

  if (error) {
    console.error(
      "Failed to record portfolio snapshot:",
      error.message,
      error.code,
      error.details,
      error.hint
    )
    return false
  }

  return true
}
