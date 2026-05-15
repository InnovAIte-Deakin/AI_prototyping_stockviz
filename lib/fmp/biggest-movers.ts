const FMP_BASE_URL = "https://financialmodelingprep.com/stable";

export type FmpBigMoverRaw = {
  symbol?: string;
  name?: string;
  price?: number | string;
  change?: number | string;
  changesPercentage?: number | string;
  exchange?: string;
};

export type MoverRow = {
  kind: "gainer" | "loser";
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  exchange: string | null;
};

export type BiggestMoversResult = {
  gainers: MoverRow[];
  losers: MoverRow[];
  error: string | null;
};

const toNumberOrNull = (value: number | string | undefined): number | null => {
  if (value === undefined || value === null) return null;
  const n =
    typeof value === "number"
      ? value
      : Number.parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

const normalizeMover = (
  raw: FmpBigMoverRaw,
  kind: "gainer" | "loser",
): MoverRow | null => {
  const symbol = raw.symbol?.trim();
  if (!symbol) return null;

  return {
    kind,
    symbol,
    name: (raw.name ?? symbol).trim(),
    price: toNumberOrNull(raw.price),
    change: toNumberOrNull(raw.change),
    changePct: toNumberOrNull(raw.changesPercentage),
    exchange: raw.exchange?.trim() ?? null,
  };
};

const parseMoverList = (data: unknown, kind: "gainer" | "loser"): MoverRow[] => {
  if (!Array.isArray(data)) return [];
  return data
    .map((row) => normalizeMover(row as FmpBigMoverRaw, kind))
    .filter((row): row is MoverRow => row !== null);
};

const readFmpError = (data: unknown): string | null => {
  if (!data || typeof data !== "object") return null;
  const message = (data as { "Error Message"?: string })["Error Message"];
  return message ? String(message) : null;
};

export async function fetchBiggestMovers(): Promise<BiggestMoversResult> {
  const apiKey = process.env.FMP_API_KEY?.trim();
  if (!apiKey) {
    return {
      gainers: [],
      losers: [],
      error: "FMP_API_KEY is not configured",
    };
  }

  const gainersUrl = `${FMP_BASE_URL}/biggest-gainers?apikey=${encodeURIComponent(apiKey)}`;
  const losersUrl = `${FMP_BASE_URL}/biggest-losers?apikey=${encodeURIComponent(apiKey)}`;

  try {
    const [gainersResponse, losersResponse] = await Promise.all([
      fetch(gainersUrl, { next: { revalidate: 120 } }),
      fetch(losersUrl, { next: { revalidate: 120 } }),
    ]);

    if (!gainersResponse.ok || !losersResponse.ok) {
      return {
        gainers: [],
        losers: [],
        error: "Could not load movers from Financial Modeling Prep",
      };
    }

    const gainersJson: unknown = await gainersResponse.json();
    const losersJson: unknown = await losersResponse.json();
    const apiError = readFmpError(gainersJson) ?? readFmpError(losersJson);

    if (apiError) {
      return {
        gainers: [],
        losers: [],
        error: apiError,
      };
    }

    return {
      gainers: parseMoverList(gainersJson, "gainer"),
      losers: parseMoverList(losersJson, "loser"),
      error: null,
    };
  } catch {
    return {
      gainers: [],
      losers: [],
      error: "Network error while loading movers",
    };
  }
}
