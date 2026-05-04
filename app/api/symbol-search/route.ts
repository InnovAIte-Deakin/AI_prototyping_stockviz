import { NextResponse } from "next/server"

const FINNHUB_API = "https://finnhub.io/api/v1/search"

/** Proxies Finnhub symbol lookup (`/search`). */
export async function GET(request: Request) {
  const token = process.env.FINNHUB_API_KEY
  if (!token) {
    return NextResponse.json(
      { error: "FINNHUB_API_KEY is not configured" },
      { status: 503 }
    )
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim() ?? ""
  if (!q) {
    return NextResponse.json(
      { error: "Missing or empty query parameter q" },
      { status: 400 }
    )
  }

  const exchange = searchParams.get("exchange")?.trim()
  const params = new URLSearchParams({ q, token })
  if (exchange) {
    params.set("exchange", exchange)
  }

  const url = `${FINNHUB_API}?${params}`
  const upstream = await fetch(url, {
    next: { revalidate: 0 },
  })

  if (!upstream.ok) {
    const body = await upstream.text()
    return NextResponse.json(
      { error: "Finnhub symbol search request failed", details: body },
      { status: upstream.status }
    )
  }

  const data: unknown = await upstream.json()
  return NextResponse.json(data)
}
