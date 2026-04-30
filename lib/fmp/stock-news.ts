const FMP_STABLE = "https://financialmodelingprep.com/stable"

export type FmpStockNewsArticle = {
  symbol?: string
  title?: string
  text?: string
  site?: string
  url?: string
  publishedDate?: string
  image?: string
}

const normalizeArticle = (raw: unknown): FmpStockNewsArticle | null => {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  return {
    symbol: typeof o.symbol === "string" ? o.symbol : undefined,
    title: typeof o.title === "string" ? o.title : undefined,
    text: typeof o.text === "string" ? o.text : undefined,
    site: typeof o.site === "string" ? o.site : undefined,
    url: typeof o.url === "string" ? o.url : undefined,
    publishedDate:
      typeof o.publishedDate === "string" ? o.publishedDate : undefined,
    image: typeof o.image === "string" ? o.image : undefined,
  }
}

/**
 * Symbol-specific stock news from FMP stable API.
 * @see https://financialmodelingprep.com/stable/news/stock?symbols=AAPL
 */
export const fetchFmpStockNews = async (
  symbol: string,
  apiKey: string,
  options?: { limit?: number; signal?: AbortSignal; cache?: RequestCache }
): Promise<FmpStockNewsArticle[]> => {
  const sym = symbol.trim().toUpperCase()
  const limit = Math.min(100, Math.max(1, options?.limit ?? 30))
  const params = new URLSearchParams({
    symbols: sym,
    apikey: apiKey,
  })
  const url = `${FMP_STABLE}/news/stock?${params.toString()}`
  const cache = options?.cache ?? "default"
  const res = await fetch(url, {
    signal: options?.signal,
    ...(cache === "no-store"
      ? { cache: "no-store" as const }
      : { next: { revalidate: 300 } }),
  })
  if (!res.ok) {
    return []
  }
  const data: unknown = await res.json()
  if (!Array.isArray(data)) return []
  const articles = data
    .map(normalizeArticle)
    .filter((a): a is FmpStockNewsArticle => a !== null)
  return articles.slice(0, limit)
}
