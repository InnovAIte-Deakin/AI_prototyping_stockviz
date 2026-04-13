import { NextResponse } from "next/server"

import type { FinnhubMarketNewsCategory } from "@/lib/types"

const FINNHUB_API = "https://finnhub.io/api/v1/news"

const CATEGORIES = new Set<FinnhubMarketNewsCategory>([
  "general",
  "forex",
  "crypto",
  "merger",
])

/** Proxies Finnhub market news; optional `limit` trims the newest N items. */
export async function GET(request: Request) {
  const token = process.env.FINNHUB_API_KEY
  if (!token) {
    return NextResponse.json(
      { error: "FINNHUB_API_KEY is not configured" },
      { status: 503 }
    )
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category") as FinnhubMarketNewsCategory | null
  if (!category || !CATEGORIES.has(category)) {
    return NextResponse.json(
      {
        error:
          "Invalid or missing category. Use one of: general, forex, crypto, merger.",
      },
      { status: 400 }
    )
  }

  const minIdRaw = searchParams.get("minId")
  const minId =
    minIdRaw != null && minIdRaw !== ""
      ? Number.parseInt(minIdRaw, 10)
      : undefined
  if (minIdRaw != null && minIdRaw !== "" && Number.isNaN(minId)) {
    return NextResponse.json({ error: "minId must be an integer" }, { status: 400 })
  }

  const limitRaw = searchParams.get("limit")
  let limit: number | undefined
  if (limitRaw != null && limitRaw !== "") {
    limit = Number.parseInt(limitRaw, 10)
    if (Number.isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { error: "limit must be a positive integer" },
        { status: 400 }
      )
    }
  }

  const params = new URLSearchParams({ category, token })
  if (minId != null && minId >= 0) {
    params.set("minId", String(minId))
  }

  const url = `${FINNHUB_API}?${params}`
  const upstream = await fetch(url, {
    next: { revalidate: 60 },
  })

  if (!upstream.ok) {
    const body = await upstream.text()
    return NextResponse.json(
      { error: "Finnhub market news request failed", details: body },
      { status: upstream.status }
    )
  }

  const data: unknown = await upstream.json()
  if (!Array.isArray(data)) {
    return NextResponse.json(
      { error: "Unexpected Finnhub response shape" },
      { status: 502 }
    )
  }

  if (limit != null) {
    return NextResponse.json(data.slice(0, limit))
  }

  return NextResponse.json(data)
}
