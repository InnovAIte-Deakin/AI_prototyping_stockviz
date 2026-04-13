import { notFound } from "next/navigation"

import { StockSymbolView } from "@/components/stock/stock-symbol-view"

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

  return <StockSymbolView symbol={symbol} />
}
