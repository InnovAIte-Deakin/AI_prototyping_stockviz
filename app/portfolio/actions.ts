"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  fetchFinnhubQuote,
  getExecutableLastPriceUsd,
  validateQuoteSymbol,
} from "@/lib/finnhub/quote";
import {
  createHoldingForCurrentUser,
  deleteHoldingForCurrentUser,
  PortfolioAuthError,
  updateHoldingForCurrentUser,
} from "@/lib/portfolio/holdings-service";
import { recordCurrentPortfolioSnapshot } from "@/lib/portfolio/history";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  PortfolioActionState,
} from "@/app/portfolio/action-types";

type ParsedHoldingPayload = {
  symbol: string;
  shares: number;
  avgPrice: number;
  acquiredAt: string | null;
  notes: string | null;
};

const readTrimmedString = (formData: FormData, key: string): string => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const parseHoldingFormData = (
  formData: FormData,
): {
  data?: ParsedHoldingPayload;
  fieldErrors?: PortfolioActionState["fieldErrors"];
} => {
  const fieldErrors: NonNullable<PortfolioActionState["fieldErrors"]> = {};

  const symbolInput = readTrimmedString(formData, "symbol").toUpperCase();
  if (!symbolInput) {
    fieldErrors.symbol = "Enter a symbol.";
  } else if (!/^[A-Z0-9.\-]{1,15}$/.test(symbolInput)) {
    fieldErrors.symbol =
      "Use letters, numbers, dots, or hyphens only (max 15 characters).";
  }

  const sharesInput = readTrimmedString(formData, "shares");
  const shares = Number.parseFloat(sharesInput);
  if (!sharesInput) {
    fieldErrors.shares = "Enter the number of shares.";
  } else if (!Number.isFinite(shares) || shares <= 0) {
    fieldErrors.shares = "Shares must be a number greater than 0.";
  }

  const avgPriceInput = readTrimmedString(formData, "avgPrice");
  const avgPrice = Number.parseFloat(avgPriceInput);
  if (!avgPriceInput) {
    fieldErrors.avgPrice = "Enter the average cost per share.";
  } else if (!Number.isFinite(avgPrice) || avgPrice < 0) {
    fieldErrors.avgPrice = "Average cost must be 0 or greater.";
  }

  const acquiredAtInput = readTrimmedString(formData, "acquiredAt");
  if (
    acquiredAtInput &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(acquiredAtInput) ||
      Number.isNaN(Date.parse(`${acquiredAtInput}T00:00:00Z`)))
  ) {
    fieldErrors.acquiredAt = "Use a valid acquisition date.";
  }

  const notesInput = readTrimmedString(formData, "notes");
  if (notesInput.length > 1000) {
    fieldErrors.notes = "Notes must be 1000 characters or fewer.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      fieldErrors,
    };
  }

  return {
    data: {
      symbol: symbolInput,
      shares,
      avgPrice,
      acquiredAt: acquiredAtInput || null,
      notes: notesInput || null,
    },
  };
};

const mapPortfolioActionError = (
  error: unknown,
  fallbackMessage: string,
): PortfolioActionState => {
  if (error instanceof PortfolioAuthError) {
    return {
      status: "error",
      message: "Your session has expired. Please sign in again.",
    };
  }

  if (error instanceof Error) {
    return {
      status: "error",
      message: error.message || fallbackMessage,
    };
  }

  return {
    status: "error",
    message: fallbackMessage,
  };
};

export async function createHoldingAction(
  _prevState: PortfolioActionState,
  formData: FormData,
): Promise<PortfolioActionState> {
  const parsed = parseHoldingFormData(formData);

  if (!parsed.data) {
    return {
      status: "error",
      message: "Please correct the highlighted fields and try again.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  try {
    await createHoldingForCurrentUser(parsed.data);
    revalidatePath("/portfolio");

    return {
      status: "success",
      message: `Added ${parsed.data.symbol} to your portfolio.`,
    };
  } catch (error) {
    return mapPortfolioActionError(
      error,
      "Could not add the holding right now.",
    );
  }
}

export async function updateHoldingAction(
  _prevState: PortfolioActionState,
  formData: FormData,
): Promise<PortfolioActionState> {
  const holdingId = readTrimmedString(formData, "holdingId");
  if (!holdingId) {
    return {
      status: "error",
      message: "Missing holding identifier.",
      fieldErrors: {
        holdingId: "Missing holding identifier.",
      },
    };
  }

  const parsed = parseHoldingFormData(formData);
  if (!parsed.data) {
    return {
      status: "error",
      message: "Please correct the highlighted fields and try again.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  try {
    await updateHoldingForCurrentUser(holdingId, parsed.data);
    revalidatePath("/portfolio");

    return {
      status: "success",
      message: `Updated ${parsed.data.symbol}.`,
    };
  } catch (error) {
    return mapPortfolioActionError(
      error,
      "Could not update the holding right now.",
    );
  }
}

export async function deleteHoldingAction(
  _prevState: PortfolioActionState,
  formData: FormData,
): Promise<PortfolioActionState> {
  const holdingId = readTrimmedString(formData, "holdingId");
  const symbol = readTrimmedString(formData, "symbol");

  if (!holdingId) {
    return {
      status: "error",
      message: "Missing holding identifier.",
      fieldErrors: {
        holdingId: "Missing holding identifier.",
      },
    };
  }

  try {
    await deleteHoldingForCurrentUser(holdingId);
    revalidatePath("/portfolio");

    return {
      status: "success",
      message: symbol ? `Removed ${symbol}.` : "Holding removed.",
    };
  } catch (error) {
    return mapPortfolioActionError(
      error,
      "Could not remove the holding right now.",
    );
  }
}

const tradeInputSchema = z.object({
  symbol: z.string().trim().min(1).max(32),
  shares: z.number().int().positive().finite().max(1e12),
});

const mapRpcMessage = (raw: string): string => {
  const lower = raw.toLowerCase();
  if (lower.includes("insufficient_cash")) {
    return "Insufficient paper cash for this purchase.";
  }
  if (lower.includes("insufficient_shares")) {
    return "You do not have enough shares to sell.";
  }
  if (lower.includes("no_position")) {
    return "You have no position in this symbol.";
  }
  if (lower.includes("profile_not_found")) {
    return "Account not ready for trading.";
  }
  if (lower.includes("invalid_symbol")) {
    return "Invalid symbol.";
  }
  if (lower.includes("invalid_shares")) {
    return "Invalid share quantity. Please use whole numbers.";
  }
  if (lower.includes("invalid_price")) {
    return "Invalid or missing market price.";
  }
  if (lower.includes("429") || lower.includes("limit")) {
    return "The daily trade limit has been reached. Please try again later.";
  }
  if (
    lower.includes("not authorized") ||
    lower.includes("42501") ||
    lower.includes("schema cache")
  ) {
    return "Trade could not be saved. Please check the portfolio database setup.";
  }
  return "Trade could not be completed. Please try again.";
};

const revalidatePortfolioSurfaces = (symbolUpper: string) => {
  revalidatePath("/portfolio");
  revalidatePath("/dashboard");
  revalidatePath(`/stock/${encodeURIComponent(symbolUpper)}`);
};

type PaperTradeResult = { ok: true } | { ok: false; error: string };

const executePaperTrade = async (
  side: "buy" | "sell",
  symbol: string,
  shares: number,
): Promise<PaperTradeResult> => {
  const parsed = tradeInputSchema.safeParse({ symbol, shares });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Enter a valid symbol and a positive number of shares.",
    };
  }

  const normalized = validateQuoteSymbol(parsed.data.symbol);
  if (!normalized) {
    return { ok: false, error: "Invalid symbol." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to trade." };
  }

  let unitPrice: number;
  try {
    const quote = await fetchFinnhubQuote(normalized, { cache: "no-store" });
    const last = getExecutableLastPriceUsd(quote);
    if (last === null) {
      return {
        ok: false,
        error: "No live price is available for this symbol right now.",
      };
    }
    unitPrice = last;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load quote.";
    return { ok: false, error: message };
  }

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch {
    return {
      ok: false,
      error: "Trading is not configured (missing service role key).",
    };
  }

  const { error } = await admin.rpc(side === "buy" ? "paper_buy" : "paper_sell", {
    p_user_id: user.id,
    p_symbol: normalized,
    p_shares: parsed.data.shares,
    p_unit_price_usd: unitPrice,
  });

  if (error) {
    return { ok: false, error: mapRpcMessage(error.message) };
  }

  revalidatePortfolioSurfaces(normalized.toUpperCase());
  recordCurrentPortfolioSnapshot(user.id).catch(console.error);

  return { ok: true };
};

export async function buyPaperShares(
  symbol: string,
  shares: number,
): Promise<PaperTradeResult> {
  return executePaperTrade("buy", symbol, shares);
}

export async function sellPaperShares(
  symbol: string,
  shares: number,
): Promise<PaperTradeResult> {
  return executePaperTrade("sell", symbol, shares);
}

export async function resetPortfolio(): Promise<PaperTradeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch {
    return {
      ok: false,
      error: "System is not configured (missing service role key).",
    };
  }

  try {
    await admin.from("portfolio_holdings").delete().eq("user_id", user.id);
    await admin.from("portfolio_transactions").delete().eq("user_id", user.id);
    await admin.from("portfolio_history").delete().eq("user_id", user.id);
    await admin
      .from("profiles")
      .update({ paper_cash_usd: 1_000_000 })
      .eq("id", user.id);
  } catch {
    return { ok: false, error: "Failed to reset portfolio." };
  }

  revalidatePath("/portfolio");
  revalidatePath("/dashboard");
  recordCurrentPortfolioSnapshot(user.id).catch(console.error);

  return { ok: true };
}
