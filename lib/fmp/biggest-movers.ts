const FMP_BASE = "https://financialmodelingprep.com/stable"

export type FmpBigMoverRaw = {
  symbol?: string
  name?: string
  price?: number | string
  change?: number | string
  changesPercentage?: number | string
  exchange?: string
}

export type MoverRow = {
  kind: "gainer" | "loser"
  symbol: string
  name: string
  price: number | null
  change: number | null
  changePct: number | null
  exchange: string | null
}

const toNum = (v: number | string | undefined): number | null => {
  if (v === undefined || v === null) return null
  const n = typeof v === "number" ? v : Number.parseFloat(String(v).replace(/,/g, ""))
  return Number.isFinite(n) ? n : null
}

const normalizeRow = (
  raw: FmpBigMoverRaw,
  kind: "gainer" | "loser"
): MoverRow | null => {
  const symbol = raw.symbol?.trim()
  if (!symbol) return null
  return {
    kind,
    symbol,
    name: (raw.name ?? symbol).trim(),
    price: toNum(raw.price),
    change: toNum(raw.change),
    changePct: toNum(raw.changesPercentage),
    exchange: raw.exchange?.trim() ?? null,
  }
}

const parseList = (data: unknown, kind: "gainer" | "loser"): MoverRow[] => {
  if (!Array.isArray(data)) return []
  return data
    .map((row) => normalizeRow(row as FmpBigMoverRaw, kind))
    .filter((r): r is MoverRow => r !== null)
}

export type BiggestMoversResult = {
  gainers: MoverRow[]
  losers: MoverRow[]
  error: string | null
}

export const fetchBiggestMovers = async (): Promise<BiggestMoversResult> => {
  const key = process.env.FMP_API_KEY?.trim()
  if (!key) {
    return {
      gainers: [],
      losers: [],
      error: "FMP_API_KEY is not configured",
    }
  }

  const gainersUrl = `${FMP_BASE}/biggest-gainers?apikey=${encodeURIComponent(key)}`
  const losersUrl = `${FMP_BASE}/biggest-losers?apikey=${encodeURIComponent(key)}`

  try {
    const [gRes, lRes] = await Promise.all([
      fetch(gainersUrl, { next: { revalidate: 120 } }),
      fetch(losersUrl, { next: { revalidate: 120 } }),
    ])

    if (!gRes.ok || !lRes.ok) {
      return {
        gainers: [],
        losers: [],
        error: "Could not load movers from Financial Modeling Prep",
      }
    }

    const gainersJson: unknown = await gRes.json()
    const losersJson: unknown = await lRes.json()

    const fmpError = (data: unknown): string | null => {
      if (!data || typeof data !== "object") return null
      const msg = (data as { "Error Message"?: string })["Error Message"]
      return msg ? String(msg) : null
    }

    const errG = fmpError(gainersJson)
    const errL = fmpError(losersJson)
    if (errG || errL) {
      return {
        gainers: [],
        losers: [],
        error: errG ?? errL ?? "FMP API error",
      }
    }

    return {
      gainers: parseList(gainersJson, "gainer"),
      losers: parseList(losersJson, "loser"),
      error: null,
    }
  } catch {
    return {
      gainers: [],
      losers: [],
      error: "Network error while loading movers",
    }
  }
}
