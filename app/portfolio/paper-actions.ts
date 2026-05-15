"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  fetchFinnhubQuote,
  getExecutableLastPriceUsd,
  validateQuoteSymbol,
} from "@/lib/finnhub/quote";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type PaperTradeActionState = {
  fieldErrors?: {
    shares?: string;
    symbol?: string;
  };
  message: string;
  priceUsd?: number;
  status: "error" | "success";
  symbol?: string;
};

const paperTradeSchema = z.object({
  shares: z.coerce
    .number()
    .finite("Shares must be a valid number.")
    .positive("Shares must be greater than 0.")
    .max(1_000_000_000_000, "Shares are too large."),
  symbol: z
    .string()
    .trim()
    .min(1, "Enter a symbol.")
    .max(32, "Symbol must be 32 characters or fewer.")
    .refine((value) => validateQuoteSymbol(value) !== null, {
      message: "Use a valid quote symbol.",
    }),
});

const mapRpcErrorMessage = (message: string): string => {
  const normalized = message.toLowerCase();

  if (normalized.includes("insufficient_cash")) {
    return "Paper cash is not sufficient for that buy.";
  }

  if (normalized.includes("insufficient_shares")) {
    return "Paper shares are not sufficient for that sell.";
  }

  if (normalized.includes("no_position")) {
    return "There is no paper position to sell for that symbol.";
  }

  if (normalized.includes("profile_not_found")) {
    return "Paper trading is not enabled for this profile.";
  }

  if (normalized.includes("invalid_symbol")) {
    return "Use a valid quote symbol.";
  }

  if (normalized.includes("invalid_shares")) {
    return "Shares must be greater than 0.";
  }

  if (normalized.includes("invalid_price")) {
    return "No executable live quote is available for this trade.";
  }

  if (normalized.includes("not authorized")) {
    return "Paper trading is not configured for service-role execution.";
  }

  if (normalized.includes("finnhub_api_key")) {
    return "Live quote pricing is not configured.";
  }

  if (normalized.includes("supabase_service_role_key")) {
    return "Paper trading service credentials are not configured.";
  }

  return message || "Paper trade failed.";
};

const parseTradeInput = (symbol: string, shares: number) => {
  const parsed = paperTradeSchema.safeParse({ shares, symbol });

  if (!parsed.success) {
    const flattened = parsed.error.flatten();

    return {
      fieldErrors: {
        shares: flattened.fieldErrors.shares?.[0],
        symbol: flattened.fieldErrors.symbol?.[0],
      },
    };
  }

  return {
    data: {
      shares: parsed.data.shares,
      symbol: parsed.data.symbol.toUpperCase(),
    },
  };
};

const revalidatePaperTradeViews = (symbol: string) => {
  revalidatePath("/portfolio");
  revalidatePath("/dashboard");
  revalidatePath(`/stock/${encodeURIComponent(symbol)}`);
};

const getAuthenticatedUserId = async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  return user.id;
};

const fetchExecutableTradePrice = async (symbol: string) => {
  const quote = await fetchFinnhubQuote(symbol, { cache: "no-store" });
  const priceUsd = getExecutableLastPriceUsd(quote);

  if (priceUsd === null) {
    throw new Error("No executable live quote is available for this trade.");
  }

  return priceUsd;
};

const executePaperTrade = async (
  side: "buy" | "sell",
  rawSymbol: string,
  rawShares: number,
): Promise<PaperTradeActionState> => {
  const parsed = parseTradeInput(rawSymbol, rawShares);

  if (!parsed.data) {
    return {
      fieldErrors: parsed.fieldErrors,
      message: "Please correct the highlighted fields and try again.",
      status: "error",
    };
  }

  try {
    const userId = await getAuthenticatedUserId();
    const priceUsd = await fetchExecutableTradePrice(parsed.data.symbol);
    const serviceRole = createServiceRoleClient();
    const { error } = await serviceRole.rpc(
      side === "buy" ? "paper_buy" : "paper_sell",
      {
        p_shares: parsed.data.shares,
        p_symbol: parsed.data.symbol,
        p_unit_price_usd: priceUsd,
        p_user_id: userId,
      },
    );

    if (error) {
      return {
        message: mapRpcErrorMessage(error.message),
        status: "error",
        symbol: parsed.data.symbol,
      };
    }

    revalidatePaperTradeViews(parsed.data.symbol);

    return {
      message:
        side === "buy"
          ? `Bought ${parsed.data.shares} paper shares of ${parsed.data.symbol}.`
          : `Sold ${parsed.data.shares} paper shares of ${parsed.data.symbol}.`,
      priceUsd,
      status: "success",
      symbol: parsed.data.symbol,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? mapRpcErrorMessage(error.message)
        : "Paper trade failed.";

    return {
      message,
      status: "error",
      symbol: parsed.data.symbol,
    };
  }
};

export async function buyPaperShares(
  symbol: string,
  shares: number,
): Promise<PaperTradeActionState> {
  return executePaperTrade("buy", symbol, shares);
}

export async function sellPaperShares(
  symbol: string,
  shares: number,
): Promise<PaperTradeActionState> {
  return executePaperTrade("sell", symbol, shares);
}
