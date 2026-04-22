import { NextResponse } from "next/server";

const FINNHUB_API = "https://finnhub.io/api/v1/stock/recommendation";

const validateSymbol = (raw: string | null): string | null => {
  const s = raw?.trim() ?? "";
  if (!s || s.length > 32) {
    return null;
  }
  if (!/^[\w.:^-]+$/i.test(s)) {
    return null;
  }
  return s;
};

/** Proxies Finnhub `GET /stock/recommendation`. */
export async function GET(request: Request) {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) {
    return NextResponse.json(
      { error: "FINNHUB_API_KEY is not configured" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const symbol = validateSymbol(searchParams.get("symbol"));
  if (!symbol) {
    return NextResponse.json(
      { error: "Missing or invalid query parameter symbol" },
      { status: 400 },
    );
  }

  const params = new URLSearchParams({ symbol, token });
  const url = `${FINNHUB_API}?${params}`;
  const upstream = await fetch(url, {
    next: { revalidate: 3600 },
  });

  if (!upstream.ok) {
    const body = await upstream.text();
    return NextResponse.json(
      { error: "Finnhub stock recommendation request failed", details: body },
      { status: upstream.status },
    );
  }

  const data: unknown = await upstream.json();
  return NextResponse.json(data);
}
