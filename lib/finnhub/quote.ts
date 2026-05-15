const FINNHUB_QUOTE_URL = "https://finnhub.io/api/v1/quote";

export type FinnhubQuotePayload = {
  c?: number;
  d?: number;
  dp?: number;
  h?: number;
  l?: number;
  o?: number;
  pc?: number;
  t?: number;
};

export type FetchFinnhubQuoteInit = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

export const validateQuoteSymbol = (
  raw: string | null | undefined,
): string | null => {
  const s = raw?.trim() ?? "";
  if (!s || s.length > 32) return null;
  if (!/^[\w.:^-]+$/i.test(s)) return null;
  return s;
};

export const getExecutableLastPriceUsd = (
  quote: FinnhubQuotePayload,
): number | null => {
  const last = quote.c;
  return typeof last === "number" && Number.isFinite(last) && last > 0
    ? last
    : null;
};

export async function fetchFinnhubQuote(
  symbol: string,
  init: FetchFinnhubQuoteInit = {},
): Promise<FinnhubQuotePayload> {
  const validated = validateQuoteSymbol(symbol);
  if (!validated) {
    throw new Error("Invalid Finnhub quote symbol");
  }

  const token = process.env.FINNHUB_API_KEY?.trim();
  if (!token) {
    throw new Error("FINNHUB_API_KEY is not configured");
  }

  const params = new URLSearchParams({
    symbol: validated,
    token,
  });

  const upstream = await fetch(`${FINNHUB_QUOTE_URL}?${params}`, init);
  if (!upstream.ok) {
    throw new Error(`Finnhub quote request failed (${upstream.status})`);
  }

  const payload = (await upstream.json()) as FinnhubQuotePayload;
  if (!payload || typeof payload !== "object") {
    throw new Error("Finnhub quote response was not an object");
  }

  return payload;
}
