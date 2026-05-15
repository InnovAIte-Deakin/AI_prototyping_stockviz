import type { Tables } from "@/lib/database.types";
import {
  fetchFinnhubQuote,
  getExecutableLastPriceUsd,
  validateQuoteSymbol,
} from "@/lib/finnhub/quote";
import { createClient } from "@/lib/supabase/server";

export type PaperPortfolioTransaction = Tables<"portfolio_transactions">;

export type PaperPortfolioPosition = Tables<"portfolio_holdings"> & {
  costBasisUsd: number;
  markPriceUsd: number | null;
  marketValueUsd: number | null;
  unrealizedPlPct: number | null;
  unrealizedPlUsd: number | null;
};

export type PaperPortfolioSnapshot = {
  cashUsd: number | null;
  enabled: boolean;
  error?: string;
  positions: PaperPortfolioPosition[];
  summary: {
    equityUsd: number;
    marketValueUsd: number;
    pricedPositionCount: number;
    totalCostBasisUsd: number;
    totalShares: number;
    unrealizedPlPct: number | null;
    unrealizedPlUsd: number;
  };
  transactions: PaperPortfolioTransaction[];
};

const emptySummary = (): PaperPortfolioSnapshot["summary"] => ({
  equityUsd: 0,
  marketValueUsd: 0,
  pricedPositionCount: 0,
  totalCostBasisUsd: 0,
  totalShares: 0,
  unrealizedPlPct: null,
  unrealizedPlUsd: 0,
});

const disabledSnapshot = (error?: string): PaperPortfolioSnapshot => ({
  cashUsd: null,
  enabled: false,
  error,
  positions: [],
  summary: emptySummary(),
  transactions: [],
});

const toFiniteNumber = (value: unknown): number | null => {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;

  return Number.isFinite(numberValue) ? numberValue : null;
};

const roundUsd = (value: number): number => Math.round(value * 100) / 100;

const roundPercent = (value: number): number => Math.round(value * 100) / 100;

const normalizeSymbol = (raw: string): string | null => {
  const valid = validateQuoteSymbol(raw);
  return valid ? valid.toUpperCase() : null;
};

export async function fetchMarkPricesBySymbol(
  symbols: string[],
): Promise<Record<string, number | null>> {
  const uniqueSymbols = Array.from(
    new Set(symbols.map(normalizeSymbol).filter((s): s is string => Boolean(s))),
  );

  const entries = await Promise.all(
    uniqueSymbols.map(async (symbol) => {
      try {
        const quote = await fetchFinnhubQuote(symbol, { cache: "no-store" });
        return [symbol, getExecutableLastPriceUsd(quote)] as const;
      } catch {
        return [symbol, null] as const;
      }
    }),
  );

  return Object.fromEntries(entries);
}

export async function loadPaperPortfolioSnapshot(
  userId: string,
): Promise<PaperPortfolioSnapshot> {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("paper_cash_usd")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    return disabledSnapshot(
      "Paper trading is not available until the database migration is applied.",
    );
  }

  const cashUsd = toFiniteNumber(profile?.paper_cash_usd);
  if (cashUsd === null) {
    return disabledSnapshot();
  }

  const [holdingsResult, transactionsResult] = await Promise.all([
    supabase
      .from("portfolio_holdings")
      .select("*")
      .eq("user_id", userId)
      .order("symbol", { ascending: true }),
    supabase
      .from("portfolio_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("executed_at", { ascending: false })
      .limit(12),
  ]);

  if (holdingsResult.error) {
    throw new Error(
      holdingsResult.error.message || "Could not load paper positions.",
    );
  }

  if (transactionsResult.error) {
    throw new Error(
      transactionsResult.error.message || "Could not load paper transactions.",
    );
  }

  const holdings = holdingsResult.data ?? [];
  const markPrices = await fetchMarkPricesBySymbol(
    holdings.map((holding) => holding.symbol),
  );

  let marketValueUsd = 0;
  let pricedPositionCount = 0;
  let totalCostBasisUsd = 0;
  let totalShares = 0;
  let unrealizedPlUsd = 0;

  const positions = holdings.map((holding) => {
    const symbol = normalizeSymbol(holding.symbol) ?? holding.symbol;
    const shares = toFiniteNumber(holding.shares) ?? 0;
    const avgPrice = toFiniteNumber(holding.avg_price) ?? 0;
    const costBasisUsd = roundUsd(shares * avgPrice);
    const markPriceUsd = markPrices[symbol] ?? null;
    const marketValueForPosition =
      markPriceUsd === null ? null : roundUsd(shares * markPriceUsd);
    const unrealizedForPosition =
      marketValueForPosition === null
        ? null
        : roundUsd(marketValueForPosition - costBasisUsd);
    const unrealizedPct =
      unrealizedForPosition === null || costBasisUsd <= 0
        ? null
        : roundPercent((unrealizedForPosition / costBasisUsd) * 100);

    totalShares += shares;
    totalCostBasisUsd += costBasisUsd;

    if (marketValueForPosition !== null) {
      marketValueUsd += marketValueForPosition;
      pricedPositionCount += 1;
    }

    if (unrealizedForPosition !== null) {
      unrealizedPlUsd += unrealizedForPosition;
    }

    return {
      ...holding,
      costBasisUsd,
      markPriceUsd,
      marketValueUsd: marketValueForPosition,
      unrealizedPlPct: unrealizedPct,
      unrealizedPlUsd: unrealizedForPosition,
    };
  });

  totalCostBasisUsd = roundUsd(totalCostBasisUsd);
  marketValueUsd = roundUsd(marketValueUsd);
  unrealizedPlUsd = roundUsd(unrealizedPlUsd);

  return {
    cashUsd: roundUsd(cashUsd),
    enabled: true,
    positions,
    summary: {
      equityUsd: roundUsd(cashUsd + marketValueUsd),
      marketValueUsd,
      pricedPositionCount,
      totalCostBasisUsd,
      totalShares,
      unrealizedPlPct:
        totalCostBasisUsd > 0
          ? roundPercent((unrealizedPlUsd / totalCostBasisUsd) * 100)
          : null,
      unrealizedPlUsd,
    },
    transactions: transactionsResult.data ?? [],
  };
}
