import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || "AAPL";
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing Finnhub API key" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/calendar/earnings?symbol=${symbol}&token=${apiKey}`
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}