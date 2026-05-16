import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/database.types"

export type PortfolioHistoryPoint = {
  total_value_usd: number
  recorded_at: string
}

export type PaperPortfolioSnapshot = {
  paperCashUsd: number
  holdings: Tables<"portfolio_holdings">[]
  transactions: Tables<"portfolio_transactions">[]
  history: PortfolioHistoryPoint[]
  realizedPlUsd: number
}

export const loadPaperPortfolioSnapshot = async (
  userId: string
): Promise<PaperPortfolioSnapshot> => {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("paper_cash_usd")
    .eq("id", userId)
    .maybeSingle()

  const paperCashUsd = profile?.paper_cash_usd ?? 100000

  const { data: holdings } = await supabase
    .from("portfolio_holdings")
    .select("*")
    .eq("user_id", userId)
    .order("symbol", { ascending: true })

  const { data: sellPlRows } = await supabase
    .from("portfolio_transactions")
    .select("realized_pl_usd")
    .eq("user_id", userId)
    .eq("side", "sell")

  let realizedPlUsd = 0
  for (const row of sellPlRows ?? []) {
    if (row.realized_pl_usd != null) {
      realizedPlUsd += row.realized_pl_usd
    }
  }

  const { data: transactions } = await supabase
    .from("portfolio_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("executed_at", { ascending: false })
    .limit(200)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: history } = (await (supabase as any)
    .from("portfolio_history")
    .select("total_value_usd, recorded_at")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: true })
    .limit(30)) as { data: PortfolioHistoryPoint[] | null }

  return {
    paperCashUsd: paperCashUsd,
    holdings: holdings ?? [],
    transactions: transactions ?? [],
    history: history ?? [],
    realizedPlUsd,
  }
}
