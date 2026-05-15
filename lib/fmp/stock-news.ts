const FMP_STOCK_NEWS_URL = "https://financialmodelingprep.com/stable/news/stock";

export type FmpStockNewsArticle = {
  symbol?: string;
  title?: string;
  text?: string;
  site?: string;
  url?: string;
  publishedDate?: string;
  image?: string;
};

const normalizeArticle = (raw: unknown): FmpStockNewsArticle | null => {
  if (!raw || typeof raw !== "object") return null;

  const value = raw as Record<string, unknown>;
  return {
    symbol: typeof value.symbol === "string" ? value.symbol : undefined,
    title: typeof value.title === "string" ? value.title : undefined,
    text: typeof value.text === "string" ? value.text : undefined,
    site: typeof value.site === "string" ? value.site : undefined,
    url: typeof value.url === "string" ? value.url : undefined,
    publishedDate:
      typeof value.publishedDate === "string" ? value.publishedDate : undefined,
    image: typeof value.image === "string" ? value.image : undefined,
  };
};

export async function fetchFmpStockNews(
  symbol: string,
  apiKey: string,
  options: { cache?: RequestCache; limit?: number; signal?: AbortSignal } = {},
): Promise<FmpStockNewsArticle[]> {
  const normalizedSymbol = symbol.trim().toUpperCase();
  const normalizedKey = apiKey.trim();

  if (!normalizedSymbol || !normalizedKey) {
    return [];
  }

  const limit = Math.min(100, Math.max(1, options.limit ?? 30));
  const params = new URLSearchParams({
    apikey: normalizedKey,
    symbols: normalizedSymbol,
  });

  const cache = options.cache ?? "default";
  const response = await fetch(`${FMP_STOCK_NEWS_URL}?${params}`, {
    signal: options.signal,
    ...(cache === "no-store"
      ? { cache: "no-store" as const }
      : { next: { revalidate: 300 } }),
  });

  if (!response.ok) {
    return [];
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) return [];

  return data
    .map(normalizeArticle)
    .filter((article): article is FmpStockNewsArticle => article !== null)
    .slice(0, limit);
}
