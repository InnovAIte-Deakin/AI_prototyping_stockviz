import { NextResponse } from "next/server"

import { parseAlphaVantageTimeSeries } from "@/lib/alphavantage/parse-time-series"

const ALPHA_VANTAGE_QUERY = "https://www.alphavantage.co/query"

const validateSymbol = (raw: string | null): string | null => {
  const s = raw?.trim() ?? ""
  if (!s || s.length > 32) {
    return null
  }
  if (!/^[\w.:^-]+$/i.test(s)) {
    return null
  }
  return s
}

const validateInterval = (
  raw: string | null
): "daily" | "monthly" | null => {
  const v = raw?.trim().toLowerCase() ?? ""
  if (v === "daily" || v === "monthly") {
    return v
  }
  return null
}

/** Proxies Alpha Vantage `TIME_SERIES_DAILY` (compact) or `TIME_SERIES_MONTHLY`. */
export async function GET(request: Request) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "ALPHA_VANTAGE_API_KEY is not configured" },
      { status: 503 }
    )
  }

  const { searchParams } = new URL(request.url)
  const symbol = validateSymbol(searchParams.get("symbol"))
  const interval = validateInterval(searchParams.get("interval"))

  if (!symbol) {
    return NextResponse.json(
      { error: "Missing or invalid query parameter symbol" },
      { status: 400 }
    )
  }

  if (!interval) {
    return NextResponse.json(
      { error: "Missing or invalid query parameter interval (daily|monthly)" },
      { status: 400 }
    )
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    symbol,
    function:
      interval === "daily" ? "TIME_SERIES_DAILY" : "TIME_SERIES_MONTHLY",
  })

  if (interval === "daily") {
    params.set("outputsize", "compact")
  }

  const url = `${ALPHA_VANTAGE_QUERY}?${params}`
  const revalidate = interval === "daily" ? 120 : 3600

  const upstream = await fetch(url, {
    next: { revalidate },
  })

  if (!upstream.ok) {
    const body = await upstream.text()
    // Sanitize body to remove API key mentions
    const sanitized = body.replace(/[a-z0-9]{15,}/gi, "***")
    return NextResponse.json(
      { error: "Alpha Vantage time series request failed", details: sanitized },
      { status: upstream.status }
    )
  }

  const raw: unknown = await upstream.json()
  const parsed = parseAlphaVantageTimeSeries(raw)

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 422 })
  }

  return NextResponse.json({ series: parsed.series })
}
