import { createClient } from "@/lib/supabase/server"
import { buyPaperShares, sellPaperShares } from "@/app/portfolio/actions"

export async function checkAndExecuteTriggers() {
  const supabase = await createClient()

  // 1. Fetch all active triggers
  // In a real production app, we would only fetch triggers for users currently online
  // or symbols that had a price update. For this MVP, we check everything.
  const { data: triggers, error } = await supabase
    .from("price_triggers")
    .select("*")
    .eq("status", "active")

  if (error || !triggers || triggers.length === 0) return

  // 2. Group triggers by symbol to minimize price lookups
  const symbols = [...new Set(triggers.map(t => t.symbol))]

  // 3. Fetch current prices
  // Note: We'll use a mocked lookup or the existing cache here.
  // For the sake of this implementation, we assume we can get prices.
  // We'll use the 'stocks' table 'last_price' which is updated by other parts of the app.
  const { data: stocks } = await supabase
    .from("stocks")
    .select("symbol, last_price")
    .in("symbol", symbols)

  const priceMap = new Map(stocks?.map(s => [s.symbol, s.last_price]) || [])

  // 4. Process each trigger
  for (const trigger of triggers) {
    const currentPrice = priceMap.get(trigger.symbol)
    if (!currentPrice) continue

    let shouldFire = false
    if (trigger.condition === 'above' && currentPrice >= trigger.trigger_price) {
      shouldFire = true
    } else if (trigger.condition === 'below' && currentPrice <= trigger.trigger_price) {
      shouldFire = true
    }

    if (shouldFire) {
      console.log(`Firing trigger ${trigger.id} for ${trigger.symbol} at ${currentPrice}`)

      try {
        if (trigger.type === 'buy' && trigger.shares) {
          await buyPaperShares(trigger.symbol, trigger.shares)
        } else if (trigger.type === 'sell' && trigger.shares) {
          await sellPaperShares(trigger.symbol, trigger.shares)
        } else if (trigger.type === 'notify') {
          // In a real app, this would send a push notification or email.
          // For now, we mark it as fired which the UI can show.
          console.log(`NOTIFICATION: ${trigger.symbol} reached target price of ${trigger.trigger_price}`)
        }

        // 5. Mark as fired
        await supabase
          .from("price_triggers")
          .update({
            status: 'fired',
            fired_at: new Date().toISOString()
          })
          .eq("id", trigger.id)

      } catch (err) {
        console.error(`Failed to execute trigger ${trigger.id}:`, err)
      }
    }
  }
}
