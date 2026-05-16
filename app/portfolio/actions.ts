"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  fetchFinnhubQuote,
  getExecutableLastPriceUsd,
  validateQuoteSymbol,
} from "@/lib/finnhub/quote"
import { createServiceRoleClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const tradeInputSchema = z.object({
  symbol: z.string().trim().min(1).max(32),
  shares: z.number().int().positive().finite().max(1e12),
})

const mapRpcMessage = (raw: string): string => {
  const lower = raw.toLowerCase()
  if (lower.includes("insufficient_cash")) {
    return "Insufficient paper cash for this purchase."
  }
  if (lower.includes("insufficient_shares")) {
    return "You do not have enough shares to sell."
  }
  if (lower.includes("no_position")) {
    return "You have no position in this symbol."
  }
  if (lower.includes("profile_not_found")) {
    return "Account not ready for trading."
  }
  if (lower.includes("invalid_symbol")) {
    return "Invalid symbol."
  }
  if (lower.includes("invalid_shares")) {
    return "Invalid share quantity. Please use whole numbers."
  }
  if (lower.includes("invalid_price")) {
    return "Invalid or missing market price."
  }
  if (lower.includes("429") || lower.includes("limit")) {
    return "The daily trade limit has been reached. Please try again later."
  }
  if (lower.includes("not authorized") || lower.includes("42501") || lower.includes("schema cache")) {
    return "Trade could not be saved. Please check the portfolio database setup."
  }
  return "Trade could not be completed. Please try again."
}

const revalidatePortfolioSurfaces = (symbolUpper: string) => {
  revalidatePath("/portfolio")
  revalidatePath("/dashboard")
  revalidatePath(`/stock/${encodeURIComponent(symbolUpper)}`)
}

export type PaperTradeResult =
  | { ok: true }
  | { ok: false; error: string }

export const buyPaperShares = async (symbol: string, shares: number): Promise<PaperTradeResult> => {
  const parsed = tradeInputSchema.safeParse({ symbol, shares })
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid symbol and a positive number of shares." }
  }

  const normalized = validateQuoteSymbol(parsed.data.symbol)
  if (!normalized) {
    return { ok: false, error: "Invalid symbol." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: "You must be signed in to trade." }
  }

  let unitPrice: number
  try {
    const quote = await fetchFinnhubQuote(normalized, { cache: "no-store" })
    const last = getExecutableLastPriceUsd(quote)
    if (last === null) {
      return { ok: false, error: "No live price is available for this symbol right now." }
    }
    unitPrice = last
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not load quote."
    return { ok: false, error: msg }
  }

  let admin
  try {
    admin = createServiceRoleClient()
  } catch {
    return { ok: false, error: "Trading is not configured (missing service role key)." }
  }

  const { error } = await admin.rpc("paper_buy", {
    p_user_id: user.id,
    p_symbol: normalized,
    p_shares: parsed.data.shares,
    p_unit_price_usd: unitPrice,
  })

  if (error) {
    return { ok: false, error: mapRpcMessage(error.message) }
  }

  revalidatePortfolioSurfaces(normalized.toUpperCase())
  return { ok: true }
}

export const sellPaperShares = async (symbol: string, shares: number): Promise<PaperTradeResult> => {
  const parsed = tradeInputSchema.safeParse({ symbol, shares })
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid symbol and a positive number of shares." }
  }

  const normalized = validateQuoteSymbol(parsed.data.symbol)
  if (!normalized) {
    return { ok: false, error: "Invalid symbol." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: "You must be signed in to trade." }
  }

  let unitPrice: number
  try {
    const quote = await fetchFinnhubQuote(normalized, { cache: "no-store" })
    const last = getExecutableLastPriceUsd(quote)
    if (last === null) {
      return { ok: false, error: "No live price is available for this symbol right now." }
    }
    unitPrice = last
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not load quote."
    return { ok: false, error: msg }
  }

  let admin
  try {
    admin = createServiceRoleClient()
  } catch {
    return { ok: false, error: "Trading is not configured (missing service role key)." }
  }

  const { error } = await admin.rpc("paper_sell", {
    p_user_id: user.id,
    p_symbol: normalized,
    p_shares: parsed.data.shares,
    p_unit_price_usd: unitPrice,
  })

  if (error) {
    return { ok: false, error: mapRpcMessage(error.message) }
  }

  revalidatePortfolioSurfaces(normalized.toUpperCase())
  return { ok: true }
}
