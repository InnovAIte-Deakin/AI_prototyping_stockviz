import type { Tables } from "@/lib/database.types";
import { requireUserFeatureContext } from "@/lib/user/session";

type StockRow = Pick<
  Tables<"stocks">,
  "exchange_mic" | "id" | "last_price" | "name" | "symbol"
>;
type WishlistRow = Tables<"wishlist">;

type WishlistInput = {
  symbol: string;
  name?: string | null;
  exchangeMic?: string | null;
  notes?: string | null;
};

export type WishlistItem = WishlistRow & {
  stock: StockRow;
};

export type WishlistItemSummary = Pick<WishlistRow, "id" | "notes"> & {
  symbol: string;
};

type RawWishlistRow = WishlistRow & {
  stock: StockRow | null;
};

const normalizeSymbol = (symbol: string): string => symbol.trim().toUpperCase();

const normalizeExchangeMic = (value?: string | null): string | null => {
  const trimmed = value?.trim().toUpperCase();
  return trimmed || null;
};

const mapWishlistRow = (row: RawWishlistRow): WishlistItem => {
  if (!row.stock) {
    throw new Error("Wishlist item is missing its stock row.");
  }

  return {
    id: row.id,
    user_id: row.user_id,
    stock_id: row.stock_id,
    notes: row.notes,
    created_at: row.created_at,
    stock: {
      id: row.stock.id,
      symbol: normalizeSymbol(row.stock.symbol),
      name: row.stock.name,
      exchange_mic: row.stock.exchange_mic,
      last_price: row.stock.last_price,
    },
  };
};

export const toWishlistItemSummary = (
  item: WishlistItem,
): WishlistItemSummary => ({
  id: item.id,
  notes: item.notes,
  symbol: item.stock.symbol,
});

const selectWishlistColumns =
  "id,user_id,stock_id,notes,created_at,stock:stocks!inner(id,symbol,name,exchange_mic,last_price)";

async function findStock(
  supabase: Awaited<ReturnType<typeof requireUserFeatureContext>>["supabase"],
  symbol: string,
  exchangeMic: string | null,
): Promise<StockRow | null> {
  let query = supabase
    .from("stocks")
    .select("id,symbol,name,exchange_mic,last_price")
    .eq("symbol", symbol);

  query = exchangeMic
    ? query.eq("exchange_mic", exchangeMic)
    : query.is("exchange_mic", null);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message || "Could not look up stock.");
  }

  return data ?? null;
}

async function ensureStockForWishlist(input: WishlistInput): Promise<StockRow> {
  const { supabase } = await requireUserFeatureContext();
  const symbol = normalizeSymbol(input.symbol);
  const exchangeMic = normalizeExchangeMic(input.exchangeMic);
  const existing = await findStock(supabase, symbol, exchangeMic);

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("stocks")
    .insert({
      symbol,
      name: input.name?.trim() || null,
      exchange_mic: exchangeMic,
    })
    .select("id,symbol,name,exchange_mic,last_price")
    .single();

  if (!error && data) {
    return data;
  }

  if (error?.code === "23505") {
    const racedStock = await findStock(supabase, symbol, exchangeMic);
    if (racedStock) {
      return racedStock;
    }
  }

  throw new Error(error?.message || "Could not create stock catalog row.");
}

const mapWishlistMutationError = (error: {
  code?: string;
  message?: string;
}) => {
  if (error.code === "23505") {
    return new Error("This symbol is already saved to your wishlist.");
  }

  return new Error(error.message || "Wishlist mutation failed.");
};

export async function listWishlistForCurrentUser(): Promise<WishlistItem[]> {
  const { supabase, user } = await requireUserFeatureContext();

  const { data, error } = await supabase
    .from("wishlist")
    .select(selectWishlistColumns)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Could not load wishlist.");
  }

  return ((data ?? []) as RawWishlistRow[]).map(mapWishlistRow);
}

export async function getWishlistItemForCurrentUserBySymbol(
  symbol: string,
): Promise<WishlistItem | null> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const wishlist = await listWishlistForCurrentUser();

  return (
    wishlist.find((item) => item.stock.symbol === normalizedSymbol) ?? null
  );
}

export async function getWishlistItemsForCurrentUserBySymbols(
  symbols: string[],
): Promise<Record<string, WishlistItemSummary>> {
  const normalizedSymbols = Array.from(new Set(symbols.map(normalizeSymbol)));

  if (normalizedSymbols.length === 0) {
    return {};
  }

  const wishlist = await listWishlistForCurrentUser();

  return Object.fromEntries(
    wishlist
      .filter((item) => normalizedSymbols.includes(item.stock.symbol))
      .map((item) => [item.stock.symbol, toWishlistItemSummary(item)]),
  );
}

export async function createWishlistItemForCurrentUser(
  input: WishlistInput,
): Promise<WishlistItem> {
  const { supabase, user } = await requireUserFeatureContext();
  const stock = await ensureStockForWishlist(input);

  const { data, error } = await supabase
    .from("wishlist")
    .insert({
      user_id: user.id,
      stock_id: stock.id,
      notes: input.notes?.trim() || null,
    })
    .select(selectWishlistColumns)
    .single();

  if (error) {
    throw mapWishlistMutationError(error);
  }

  return mapWishlistRow(data as RawWishlistRow);
}

export async function updateWishlistItemForCurrentUser(
  wishlistId: string,
  notes: string | null,
): Promise<WishlistItem> {
  const { supabase, user } = await requireUserFeatureContext();

  const { data, error } = await supabase
    .from("wishlist")
    .update({ notes: notes?.trim() || null })
    .eq("id", wishlistId)
    .eq("user_id", user.id)
    .select(selectWishlistColumns)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Could not update wishlist notes.");
  }

  if (!data) {
    throw new Error("Wishlist item not found or no longer accessible.");
  }

  return mapWishlistRow(data as RawWishlistRow);
}

export async function deleteWishlistItemForCurrentUser(
  wishlistId: string,
): Promise<void> {
  const { supabase, user } = await requireUserFeatureContext();

  const { data, error } = await supabase
    .from("wishlist")
    .delete()
    .eq("id", wishlistId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Could not remove wishlist item.");
  }

  if (!data) {
    throw new Error("Wishlist item not found or already removed.");
  }
}
