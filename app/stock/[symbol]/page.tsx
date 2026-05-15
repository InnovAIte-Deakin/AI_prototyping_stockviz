import { notFound } from "next/navigation";

import { StockSymbolView } from "@/components/stock/stock-symbol-view";
import { createClient } from "@/lib/supabase/server";
import { UserFeatureAuthError } from "@/lib/user/session";
import {
  getWishlistItemForCurrentUserBySymbol,
  toWishlistItemSummary,
} from "@/lib/user/wishlist-service";

const decodeSymbol = (raw: string): string => {
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
};

const getPaperCashForCurrentUser = async (): Promise<number | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("paper_cash_usd")
      .eq("id", user.id)
      .maybeSingle();

    if (error || typeof data?.paper_cash_usd !== "number") {
      return null;
    }

    return data.paper_cash_usd;
  } catch {
    return null;
  }
};

export default async function StockSymbolPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol: raw } = await params;
  const symbol = decodeSymbol(raw);
  if (!symbol) {
    notFound();
  }

  let wishlistItem = null;
  try {
    const item = await getWishlistItemForCurrentUserBySymbol(symbol);
    wishlistItem = item ? toWishlistItemSummary(item) : null;
  } catch (error) {
    if (!(error instanceof UserFeatureAuthError)) {
      throw error;
    }
  }

  const initialPaperCashUsd = await getPaperCashForCurrentUser();

  return (
    <StockSymbolView
      initialPaperCashUsd={initialPaperCashUsd}
      initialWishlistItem={wishlistItem}
      symbol={symbol}
    />
  );
}
