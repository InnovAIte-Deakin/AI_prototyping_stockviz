"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createPriceTrigger(data: {
  symbol: string
  trigger_price: number
  condition: 'above' | 'below'
  type: 'notify' | 'buy' | 'sell'
  shares?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("price_triggers")
    .insert({
      user_id: user.id,
      symbol: data.symbol.toUpperCase(),
      trigger_price: data.trigger_price,
      condition: data.condition,
      type: data.type,
      shares: data.shares || null,
      status: 'active'
    })

  if (error) throw error

  revalidatePath(`/stock/${data.symbol}`)
  return { success: true }
}

export async function cancelPriceTrigger(id: string, symbol: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("price_triggers")
    .update({ status: 'cancelled' })
    .eq("id", id)

  if (error) throw error

  revalidatePath(`/stock/${symbol}`)
  return { success: true }
}

export async function getActiveTriggers(symbol: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from("price_triggers")
    .select("*")
    .eq("user_id", user.id)
    .eq("symbol", symbol.toUpperCase())
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}
