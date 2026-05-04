import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/database.types"

export type PaperPortfolioSnapshot = {
  paperCashUsd: number
  holdings: Tables<"portfolio_holdings">[]
  transactions: Tables<"portfolio_transactions">[]
  realizedPlUsd: number
}

export const loadPaperPortfolioSnapshot = async (
  userId: string
): Promise<PaperPortfolioSnapshot | null> => {
  const supabase = await createClient()

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("paper_cash_usd")
    .eq("id", userId)
    .maybeSingle()

  if (profileError || !profile) {
    return null
  }

  const { data: holdings, error: holdingsError } = await supabase
    .from("portfolio_holdings")
    .select("*")
    .eq("user_id", userId)
    .order("symbol", { ascending: true })

  if (holdingsError) {
    return null
  }

  const { data: sellPlRows, error: sellPlError } = await supabase
    .from("portfolio_transactions")
    .select("realized_pl_usd")
    .eq("user_id", userId)
    .eq("side", "sell")

  if (sellPlError) {
    return null
  }

  let realizedPlUsd = 0
  for (const row of sellPlRows ?? []) {
    if (row.realized_pl_usd != null) {
      realizedPlUsd += row.realized_pl_usd
    }
  }

  const { data: transactions, error: txError } = await supabase
    .from("portfolio_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("executed_at", { ascending: false })
    .limit(200)

  if (txError) {
    return null
  }

  return {
    paperCashUsd: profile.paper_cash_usd,
    holdings: holdings ?? [],
    transactions: transactions ?? [],
    realizedPlUsd,
  }
}
