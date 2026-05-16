"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { upsertStocks } from "@/lib/stocks/upsert-stock"

export async function getWishlist() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: [], error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("wishlist")
    .select(`
      id,
      created_at,
      stock:stocks (
        id,
        symbol,
        name
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[getWishlist] Error:", error.message)
    return { data: [], error: "Failed to fetch wishlist" }
  }

  // Map to a cleaner format
  const mappedData = data.map((item: { id: string; created_at: string; stock: { id: string; symbol: string; name: string | null } }) => ({
    id: item.id,
    created_at: item.created_at,
    stockId: item.stock.id,
    symbol: item.stock.symbol,
    name: item.stock.name,
  }))

  return { data: mappedData, error: null }
}

export async function toggleWishlist(symbol: string, name?: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", isWishlisted: false }
  }

  const upperSymbol = symbol.trim().toUpperCase()

  // Ensure stock exists in canonical stocks table
  await upsertStocks([{ symbol: upperSymbol, name }])

  // Get the stock ID
  const { data: stockData, error: stockError } = await supabase
    .from("stocks")
    .select("id")
    .eq("symbol", upperSymbol)
    .single()

  if (stockError || !stockData) {
    console.error("[toggleWishlist] Failed to find/upsert stock:", upperSymbol)
    return { error: "Failed to process stock", isWishlisted: false }
  }

  // Check if it's already in the wishlist
  const { data: existing } = await supabase
    .from("wishlist")
    .select("id")
    .eq("user_id", user.id)
    .eq("stock_id", stockData.id)
    .single()

  let isWishlisted = false;

  if (existing) {
    // Remove it
    const { error: deleteError } = await supabase
      .from("wishlist")
      .delete()
      .eq("id", existing.id)

    if (deleteError) {
      console.error("[toggleWishlist] Delete error:", deleteError.message)
      return { error: "Failed to remove from wishlist", isWishlisted: true }
    }
  } else {
    // Add it
    const { error: insertError } = await supabase
      .from("wishlist")
      .insert({
        user_id: user.id,
        stock_id: stockData.id,
      })

    if (insertError) {
      console.error("[toggleWishlist] Insert error:", insertError.message)
      return { error: "Failed to add to wishlist", isWishlisted: false }
    }
    isWishlisted = true;
  }

  revalidatePath("/")
  return { error: null, isWishlisted }
}
