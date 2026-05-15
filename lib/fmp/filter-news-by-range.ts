import type { FmpStockNewsArticle } from "@/lib/fmp/stock-news";

const startOfUtcDay = (isoDate: string): number => {
  const time = Date.parse(`${isoDate}T00:00:00.000Z`);
  return Number.isNaN(time) ? NaN : time;
};

const endOfUtcDay = (isoDate: string): number => {
  const time = Date.parse(`${isoDate}T23:59:59.999Z`);
  return Number.isNaN(time) ? NaN : time;
};

export const parseFmpPublishedTime = (
  raw: string | undefined,
): number | null => {
  if (!raw || typeof raw !== "string") return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}\s+\d/.test(trimmed)) {
    const time = Date.parse(`${trimmed.replace(" ", "T")}Z`);
    return Number.isNaN(time) ? null : time;
  }

  const time = Date.parse(trimmed);
  return Number.isNaN(time) ? null : time;
};

export const filterAndRankFmpNewsForRange = (
  articles: FmpStockNewsArticle[],
  params: {
    from: string;
    to: string;
    symbol: string;
    companyName?: string;
    maxItems: number;
  },
): FmpStockNewsArticle[] => {
  const fromMs = startOfUtcDay(params.from);
  const toMs = endOfUtcDay(params.to);
  if (Number.isNaN(fromMs) || Number.isNaN(toMs)) {
    return [];
  }

  const symbol = params.symbol.trim().toUpperCase();
  const company = params.companyName?.trim();
  const symbolLower = symbol.toLowerCase();
  const companyLower = company?.toLowerCase();

  const inRange = articles.filter((article) => {
    const publishedAt = parseFmpPublishedTime(article.publishedDate);
    return publishedAt !== null && publishedAt >= fromMs && publishedAt <= toMs;
  });

  const score = (article: FmpStockNewsArticle): number => {
    let value = 0;
    const title = (article.title ?? "").toLowerCase();
    const text = (article.text ?? "").toLowerCase();

    if (title.includes(symbolLower) || text.includes(symbolLower)) {
      value += 3;
    }
    if (
      companyLower &&
      (title.includes(companyLower) || text.includes(companyLower))
    ) {
      value += 2;
    }

    const publishedAt = parseFmpPublishedTime(article.publishedDate);
    if (publishedAt !== null) {
      value += Math.min(1, (publishedAt - fromMs) / (toMs - fromMs + 1));
    }

    return value;
  };

  return [...inRange]
    .sort((a, b) => score(b) - score(a))
    .slice(0, params.maxItems);
};
