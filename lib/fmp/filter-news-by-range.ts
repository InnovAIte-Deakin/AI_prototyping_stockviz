import type { FmpStockNewsArticle } from "@/lib/fmp/stock-news"

const startOfUtcDay = (isoDate: string): number => {
  const t = Date.parse(`${isoDate}T00:00:00.000Z`)
  return Number.isNaN(t) ? NaN : t
}

const endOfUtcDay = (isoDate: string): number => {
  const t = Date.parse(`${isoDate}T23:59:59.999Z`)
  return Number.isNaN(t) ? NaN : t
}

/**
 * Parses FMP `publishedDate` into UTC ms (supports "YYYY-MM-DD HH:mm:ss" and ISO-like strings).
 */
export const parseFmpPublishedTime = (raw: string | undefined): number | null => {
  if (!raw || typeof raw !== "string") {
    return null
  }
  const trimmed = raw.trim()
  if (!trimmed) {
    return null
  }
  if (/^\d{4}-\d{2}-\d{2}\s+\d/.test(trimmed)) {
    const t = Date.parse(trimmed.replace(" ", "T") + "Z")
    return Number.isNaN(t) ? null : t
  }
  const t = Date.parse(trimmed)
  return Number.isNaN(t) ? null : t
}

/**
 * Keeps articles whose published time falls in [from, to] (inclusive, UTC date boundaries).
 * Optionally prefers title/text mentioning symbol or company (soft ranking).
 */
export const filterAndRankFmpNewsForRange = (
  articles: FmpStockNewsArticle[],
  params: {
    from: string
    to: string
    symbol: string
    companyName?: string
    maxItems: number
  }
): FmpStockNewsArticle[] => {
  const fromMs = startOfUtcDay(params.from)
  const toMs = endOfUtcDay(params.to)
  if (Number.isNaN(fromMs) || Number.isNaN(toMs)) {
    return []
  }

  const sym = params.symbol.trim().toUpperCase()
  const company = params.companyName?.trim()
  const symLo = sym.toLowerCase()
  const companyLo = company?.toLowerCase()

  const inRange = articles.filter((a) => {
    const t = parseFmpPublishedTime(a.publishedDate)
    if (t === null) {
      return false
    }
    return t >= fromMs && t <= toMs
  })

  const score = (a: FmpStockNewsArticle): number => {
    let s = 0
    const title = (a.title ?? "").toLowerCase()
    const text = (a.text ?? "").toLowerCase()
    if (title.includes(symLo) || text.includes(symLo)) {
      s += 3
    }
    if (companyLo && (title.includes(companyLo) || text.includes(companyLo))) {
      s += 2
    }
    const t = parseFmpPublishedTime(a.publishedDate)
    if (t !== null) {
      s += Math.min(1, (t - fromMs) / (toMs - fromMs + 1))
    }
    return s
  }

  return [...inRange]
    .sort((a, b) => score(b) - score(a))
    .slice(0, params.maxItems)
}
