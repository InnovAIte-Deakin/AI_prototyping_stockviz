import { fetchFinnhubQuote, getExecutableLastPriceUsd } from "@/lib/finnhub/quote"

/** Best-effort last prices for open positions (for unrealized P/L). */
export const fetchMarkPricesBySymbol = async (
  symbols: string[]
): Promise<Map<string, number>> => {
  const map = new Map<string, number>()
  const unique = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))]
  await Promise.all(
    unique.map(async (sym) => {
      try {
        const quote = await fetchFinnhubQuote(sym, { cache: "no-store" })
        const last = getExecutableLastPriceUsd(quote)
        if (last !== null) {
          map.set(sym, last)
        }
      } catch {
        // omit failed symbols
      }
    })
  )
  return map
}
