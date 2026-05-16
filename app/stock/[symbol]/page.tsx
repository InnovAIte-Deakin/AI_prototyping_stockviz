import { notFound } from "next/navigation"

import { StockSymbolView } from "@/components/stock/stock-symbol-view"
import { createClient } from "@/lib/supabase/server"

const decodeSymbol = (raw: string): string => {
  try {
    return decodeURIComponent(raw).trim()
  } catch {
    return raw.trim()
  }
}

export default async function StockSymbolPage({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const { symbol: raw } = await params
  const symbol = decodeSymbol(raw)
  if (!symbol) {
    notFound()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let paperCashUsd: number | undefined
  let sharesOwned: number = 0
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("paper_cash_usd")
      .eq("id", user.id)
      .maybeSingle()
    if (profile) {
      paperCashUsd = profile.paper_cash_usd
    }

    const { data: holding } = await supabase
      .from("portfolio_holdings")
      .select("shares")
      .eq("user_id", user.id)
      .eq("symbol", symbol.toUpperCase())
      .maybeSingle()
    if (holding) {
      sharesOwned = holding.shares
    }
  }

  return <StockSymbolView symbol={symbol} paperCashUsd={paperCashUsd} initialSharesOwned={sharesOwned} />
}
