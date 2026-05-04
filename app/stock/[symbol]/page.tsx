import { notFound } from "next/navigation"

import { StockSymbolView } from "@/components/stock/stock-symbol-view"
import { createClient } from "@/lib/supabase/server"

const decodeSymbol = (raw: string): string => {
  try {
    return decodeURIComponent(raw).trim()
  } catch {
    return raw.trim()
  }
}

export default async function StockSymbolPage({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const { symbol: raw } = await params
  const symbol = decodeSymbol(raw)
  if (!symbol) {
    notFound()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let paperCashUsd: number | undefined
  if (user) {
    const { data, error } = await supabase
      .from("profiles")
      .select("paper_cash_usd")
      .eq("id", user.id)
      .maybeSingle()
    if (!error && data) {
      paperCashUsd = data.paper_cash_usd
    }
  }

  return <StockSymbolView symbol={symbol} paperCashUsd={paperCashUsd} />
}
