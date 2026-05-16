import { NextResponse } from "next/server"

const FINNHUB_AGG = "https://finnhub.io/api/v1/scan/technical-indicator"

const validateSymbol = (raw: string | null): string | null => {
  const s = raw?.trim() ?? ""
  if (!s || s.length > 32) return null
  if (!/^[\w.:^-]+$/i.test(s)) return null
  return s
}

/**
 * Proxies Finnhub aggregate technical scan (docs: Technical Analysis → Aggregate Indicators).
 * May require a paid Finnhub plan; returns upstream status/body on failure.
 */
export async function GET(request: Request) {
  const token = process.env.FINNHUB_API_KEY?.trim()
  if (!token) {
    return NextResponse.json(
      { error: "FINNHUB_API_KEY is not configured" },
      { status: 503 }
    )
  }

  const { searchParams } = new URL(request.url)
  const symbol = validateSymbol(searchParams.get("symbol"))
  if (!symbol) {
    return NextResponse.json({ error: "Missing or invalid symbol" }, { status: 400 })
  }

  const resolution = (searchParams.get("resolution") ?? "D").trim().toUpperCase()
  const allowed = new Set(["1", "5", "15", "30", "60", "D", "W", "M"])
  const res = allowed.has(resolution) ? resolution : "D"

  const url = `${FINNHUB_AGG}?${new URLSearchParams({
    symbol,
    resolution: res,
    token,
  })}`

  const upstream = await fetch(url, { next: { revalidate: 300 } })
  const body: unknown = await upstream.json().catch(() => ({}))

  return NextResponse.json(body, { status: upstream.ok ? 200 : upstream.status })
}
