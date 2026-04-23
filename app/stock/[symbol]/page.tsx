import { notFound } from "next/navigation";

import { StockSymbolView } from "@/components/stock/stock-symbol-view";
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

  return <StockSymbolView initialWishlistItem={wishlistItem} symbol={symbol} />;
}
