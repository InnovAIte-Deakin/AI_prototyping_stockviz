import { createClient } from "@/lib/supabase/server";

type StockInput = {
  symbol: string;
  name?: string;
  exchangeMic?: string;
};

/**
 * Bulk-upserts stocks into the canonical `public.stocks` table.
 *
 * For each stock, checks if it already exists (by uppercased, trimmed symbol).
 * - If missing → inserts a new row.
 * - If present but `name` was null → updates with the provided name.
 *
 * Fire-and-forget safe: never throws — logs errors to stderr instead.
 */
export async function upsertStocks(stocks: StockInput[]): Promise<void> {
  if (stocks.length === 0) {
    return;
  }

  try {
    const supabase = await createClient();

    // Deduplicate by uppercased symbol within the batch
    const seen = new Map<string, StockInput>();
    for (const s of stocks) {
      const key = s.symbol.trim().toUpperCase();
      if (key && !seen.has(key)) {
        seen.set(key, s);
      }
    }

    const unique = Array.from(seen.values());

    // Fetch existing stocks in one query
    const symbols = unique.map((s) => s.symbol.trim().toUpperCase());
    const { data: existing } = await supabase
      .from("stocks")
      .select("id, symbol, name")
      .filter("symbol", "in", `(${symbols.map((s) => `"${s}"`).join(",")})`);

    const existingMap = new Map(
      (existing ?? []).map((row) => [row.symbol.trim().toUpperCase(), row]),
    );

    // Separate into inserts and updates
    const toInsert: Array<{
      symbol: string;
      name: string | null;
      exchange_mic: string | null;
    }> = [];
    const toUpdate: Array<{ id: string; name: string }> = [];

    for (const stock of unique) {
      const key = stock.symbol.trim().toUpperCase();
      const row = existingMap.get(key);

      if (!row) {
        // New stock — insert
        toInsert.push({
          symbol: stock.symbol.trim().toUpperCase(),
          name: stock.name?.trim() || null,
          exchange_mic: stock.exchangeMic?.trim() || null,
        });
      } else if (!row.name && stock.name?.trim()) {
        // Existing stock missing a name — update it
        toUpdate.push({ id: row.id, name: stock.name.trim() });
      }
    }

    // Batch insert new stocks
    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("stocks")
        .insert(toInsert);

      if (insertError) {
        console.error("[upsertStocks] insert error:", insertError.message);
      }
    }

    // Update stocks that were missing names
    for (const item of toUpdate) {
      const { error: updateError } = await supabase
        .from("stocks")
        .update({ name: item.name })
        .eq("id", item.id);

      if (updateError) {
        console.error("[upsertStocks] update error:", updateError.message);
      }
    }
  } catch (err) {
    console.error(
      "[upsertStocks] unexpected error:",
      err instanceof Error ? err.message : err,
    );
  }
}
