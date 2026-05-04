import type { FinnhubQuote } from "@/lib/types"

const FINNHUB_API = "https://finnhub.io/api/v1/quote"

/** Validates a symbol for Finnhub quote requests (matches `/api/quote`). */
export const validateQuoteSymbol = (raw: string | null): string | null => {
  const s = raw?.trim() ?? ""
  if (!s || s.length > 32) {
    return null
  }
  if (!/^[\w.:^-]+$/i.test(s)) {
    return null
  }
  return s
}

export type FetchFinnhubQuoteOptions = {
  /** Route handler may cache; server actions should use `no-store`. */
  cache?: RequestCache
  next?: { revalidate?: number }
}

/**
 * Fetches Finnhub `GET /quote` for a validated symbol.
 * @throws Error when FINNHUB_API_KEY is missing, symbol invalid, or upstream fails.
 */
export const fetchFinnhubQuote = async (
  symbol: string,
  options: FetchFinnhubQuoteOptions = {}
): Promise<FinnhubQuote> => {
  const trimmed = validateQuoteSymbol(symbol)
  if (!trimmed) {
    throw new Error("Invalid symbol")
  }

  const token = process.env.FINNHUB_API_KEY
  if (!token) {
    throw new Error("FINNHUB_API_KEY is not configured")
  }

  const params = new URLSearchParams({ symbol: trimmed, token })
  const url = `${FINNHUB_API}?${params}`
  const upstream = await fetch(url, {
    cache: options.cache ?? "default",
    next: options.next,
  })

  if (!upstream.ok) {
    const body = await upstream.text()
    throw new Error(`Finnhub quote request failed (${upstream.status}): ${body}`)
  }

  return (await upstream.json()) as FinnhubQuote
}

/** Last trade price `c` suitable for paper execution; null if unusable. */
export const getExecutableLastPriceUsd = (quote: FinnhubQuote): number | null => {
  const c = quote.c
  if (c === undefined || !Number.isFinite(c) || c <= 0) {
    return null
  }
  return c
}
