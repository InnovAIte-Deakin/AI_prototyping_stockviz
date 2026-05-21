import { notFound } from "next/navigation"

import { StockSymbolView } from "@/components/stock/stock-symbol-view"
import { createClient } from "@/lib/supabase/server"
import { checkAndExecuteTriggers } from "@/lib/triggers/execution"
import { UserFeatureAuthError } from "@/lib/user/session"
import {
  getWishlistItemForCurrentUserBySymbol,
  toWishlistItemSummary,
} from "@/lib/user/wishlist-service"

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
  await checkAndExecuteTriggers()
  const { symbol: raw } = await params
  const symbol = decodeSymbol(raw)
  if (!symbol) {
    notFound()
  }

  let wishlistItem = null
  try {
    const item = await getWishlistItemForCurrentUserBySymbol(symbol)
    wishlistItem = item ? toWishlistItemSummary(item) : null
  } catch (error) {
    if (!(error instanceof UserFeatureAuthError)) {
      throw error
    }
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

  return (
    <StockSymbolView
      symbol={symbol}
      paperCashUsd={paperCashUsd}
      initialSharesOwned={sharesOwned}
      initialWishlistItem={wishlistItem}
    />
  )
}
