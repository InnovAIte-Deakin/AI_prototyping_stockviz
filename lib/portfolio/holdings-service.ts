import { createClient } from "@/lib/supabase/server";
import { upsertStocks } from "@/lib/stocks/upsert-stock";
import type { Tables } from "@/lib/database.types";

export class PortfolioAuthError extends Error {
  constructor() {
    super("Authentication required.");
    this.name = "PortfolioAuthError";
  }
}

type PortfolioHolding = Tables<"portfolio_holdings">;

type PortfolioHoldingInput = {
  symbol: string;
  shares: number;
  avgPrice: number;
  acquiredAt: string | null;
  notes: string | null;
};

type PortfolioSummary = {
  holdingCount: number;
  totalCostBasis: number;
  totalShares: number;
  latestAcquiredAt: string | null;
  largestPosition:
    | {
        symbol: string;
        costBasis: number;
      }
    | null;
};

type PortfolioSnapshot = {
  holdings: PortfolioHolding[];
  summary: PortfolioSummary;
};

const normalizeSymbol = (symbol: string): string => symbol.trim().toUpperCase();

const summarizeHoldings = (holdings: PortfolioHolding[]): PortfolioSummary => {
  let totalCostBasis = 0;
  let totalShares = 0;
  let latestAcquiredAt: string | null = null;
  let largestPosition: PortfolioSummary["largestPosition"] = null;

  for (const holding of holdings) {
    const costBasis = holding.shares * holding.avg_price;
    totalCostBasis += costBasis;
    totalShares += holding.shares;

    if (
      holding.acquired_at &&
      (!latestAcquiredAt || holding.acquired_at > latestAcquiredAt)
    ) {
      latestAcquiredAt = holding.acquired_at;
    }

    if (!largestPosition || costBasis > largestPosition.costBasis) {
      largestPosition = {
        symbol: holding.symbol,
        costBasis,
      };
    }
  }

  return {
    holdingCount: holdings.length,
    totalCostBasis,
    totalShares,
    latestAcquiredAt,
    largestPosition,
  };
};

const mapMutationError = (error: { code?: string; message?: string }) => {
  if (error.code === "23505") {
    return new Error(
      "A holding for this symbol already exists. Edit the existing row instead.",
    );
  }

  return new Error(error.message || "Portfolio mutation failed.");
};

async function requirePortfolioContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new PortfolioAuthError();
  }

  return { supabase, user };
}

export async function getPortfolioSnapshotForCurrentUser(): Promise<PortfolioSnapshot> {
  const holdings = await listHoldingsForCurrentUser();

  return {
    holdings,
    summary: summarizeHoldings(holdings),
  };
}

export async function listHoldingsForCurrentUser(): Promise<PortfolioHolding[]> {
  const { supabase, user } = await requirePortfolioContext();

  const { data, error } = await supabase
    .from("portfolio_holdings")
    .select("*")
    .eq("user_id", user.id)
    .order("symbol", { ascending: true });

  if (error) {
    throw new Error(error.message || "Could not load portfolio holdings.");
  }

  return data ?? [];
}

export async function createHoldingForCurrentUser(
  input: PortfolioHoldingInput,
): Promise<PortfolioHolding> {
  const { supabase, user } = await requirePortfolioContext();

  const payload = {
    user_id: user.id,
    symbol: normalizeSymbol(input.symbol),
    shares: input.shares,
    avg_price: input.avgPrice,
    acquired_at: input.acquiredAt,
    notes: input.notes,
  };

  const { data, error } = await supabase
    .from("portfolio_holdings")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw mapMutationError(error);
  }

  await upsertStocks([{ symbol: payload.symbol }]);

  return data;
}

export async function updateHoldingForCurrentUser(
  holdingId: string,
  input: PortfolioHoldingInput,
): Promise<PortfolioHolding> {
  const { supabase, user } = await requirePortfolioContext();

  const payload = {
    symbol: normalizeSymbol(input.symbol),
    shares: input.shares,
    avg_price: input.avgPrice,
    acquired_at: input.acquiredAt,
    notes: input.notes,
  };

  const { data, error } = await supabase
    .from("portfolio_holdings")
    .update(payload)
    .eq("id", holdingId)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw mapMutationError(error);
  }

  if (!data) {
    throw new Error("Holding not found or no longer accessible.");
  }

  await upsertStocks([{ symbol: payload.symbol }]);

  return data;
}

export async function deleteHoldingForCurrentUser(
  holdingId: string,
): Promise<void> {
  const { supabase, user } = await requirePortfolioContext();

  const { data, error } = await supabase
    .from("portfolio_holdings")
    .delete()
    .eq("id", holdingId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Could not remove the holding.");
  }

  if (!data) {
    throw new Error("Holding not found or already removed.");
  }
}
