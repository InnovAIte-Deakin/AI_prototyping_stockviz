import { NextResponse } from "next/server"

import { fetchFinnhubQuote, validateQuoteSymbol } from "@/lib/finnhub/quote"

/** Proxies Finnhub `GET /quote`. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = validateQuoteSymbol(searchParams.get("symbol"))
  if (!symbol) {
    return NextResponse.json(
      { error: "Missing or invalid query parameter symbol" },
      { status: 400 }
    )
  }

  try {
    const data = await fetchFinnhubQuote(symbol, { next: { revalidate: 30 } })
    return NextResponse.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch quote"
    if (msg.includes("FINNHUB_API_KEY")) {
      return NextResponse.json({ error: msg }, { status: 503 })
    }
    if (msg.startsWith("Finnhub quote request failed")) {
      return NextResponse.json({ error: msg }, { status: 502 })
    }
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
