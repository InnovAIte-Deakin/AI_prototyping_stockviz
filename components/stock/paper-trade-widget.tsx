"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { buyPaperShares, sellPaperShares } from "@/app/portfolio/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFinnhubQuote } from "@/hooks/use-finnhub-stock-data"
import { cn } from "@/lib/utils"

const formatUsd = (n: number): string =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

type PaperTradeWidgetProps = {
  symbol: string
  initialPaperCashUsd: number
}

export const PaperTradeWidget = ({ symbol, initialPaperCashUsd }: PaperTradeWidgetProps) => {
  const router = useRouter()
  const { data: quote, error: quoteError, isLoading } = useFinnhubQuote(symbol)
  const lastPrice = quote?.c
  const lastPriceOk =
    lastPrice !== undefined && Number.isFinite(lastPrice) && lastPrice > 0 ? lastPrice : null

  const [shareInput, setShareInput] = React.useState("")
  const [pending, setPending] = React.useState<"buy" | "sell" | null>(null)

  const shares = Number.parseFloat(shareInput)
  const sharesValid = Number.isFinite(shares) && shares > 0

  const estimatedNotional =
    lastPriceOk !== null && sharesValid ? shares * lastPriceOk : null

  const handleBuy = async () => {
    if (!sharesValid) {
      toast.error("Enter a positive number of shares.")
      return
    }
    setPending("buy")
    const res = await buyPaperShares(symbol, shares)
    setPending(null)
    if (res.ok) {
      toast.success("Buy filled at the latest quote.")
      setShareInput("")
      router.refresh()
      return
    }
    toast.error(res.error)
  }

  const handleSell = async () => {
    if (!sharesValid) {
      toast.error("Enter a positive number of shares.")
      return
    }
    setPending("sell")
    const res = await sellPaperShares(symbol, shares)
    setPending(null)
    if (res.ok) {
      toast.success("Sell filled at the latest quote.")
      setShareInput("")
      router.refresh()
      return
    }
    toast.error(res.error)
  }

  return (
    <Card className="border-[#adb3b2]/20 bg-white text-[#2d3433] shadow-md shadow-[#2d3433]/5">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-[#5f5e5e]">Paper trade</CardTitle>
        <CardDescription className="text-[#5a6060]">
          Uses Finnhub last price when you trade. Cash and P/L are on your{" "}
          <Link
            href="/portfolio"
            className="font-bold text-[#5f5e5e] underline-offset-4 hover:text-[#2d3433] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f5e5e]"
          >
            portfolio
          </Link>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <p className="text-[#5a6060] text-xs font-bold uppercase tracking-wide">
              Paper cash
            </p>
            <p className="text-lg font-bold tabular-nums text-[#2d3433]">{formatUsd(initialPaperCashUsd)}</p>
          </div>
          <div>
            <p className="text-[#5a6060] text-xs font-bold uppercase tracking-wide">
              Last (Finnhub)
            </p>
            <p className="text-lg font-bold tabular-nums text-[#2d3433]">
              {isLoading ? "…" : lastPriceOk !== null ? formatUsd(lastPriceOk) : "—"}
            </p>
          </div>
          {estimatedNotional !== null ? (
            <div>
              <p className="text-[#5a6060] text-xs font-bold uppercase tracking-wide">
                Est. notional
              </p>
              <p className="text-lg font-bold tabular-nums text-[#2d3433]">{formatUsd(estimatedNotional)}</p>
            </div>
          ) : null}
        </div>

        {quoteError ? (
          <Alert variant="destructive">
            <AlertTitle>Quote unavailable</AlertTitle>
            <AlertDescription>{quoteError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="paper-trade-shares" className="text-[#5a6060] font-bold">Shares</Label>
          <Input
            id="paper-trade-shares"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            placeholder="e.g. 10"
            value={shareInput}
            onChange={(e) => setShareInput(e.target.value)}
            aria-invalid={shareInput.length > 0 && !sharesValid}
            autoComplete="off"
            className="h-11 border-[#adb3b2]/30 focus-visible:border-[#5f5e5e] focus-visible:ring-0 rounded-lg text-base"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={handleBuy}
            disabled={pending !== null || !sharesValid || lastPriceOk === null}
            aria-busy={pending === "buy"}
            className={cn("h-11 px-8 font-bold bg-[#5f5e5e] text-white hover:opacity-90 rounded-lg transition-all", pending === "buy" && "opacity-80")}
          >
            {pending === "buy" ? "Buying…" : "Buy"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleSell}
            disabled={pending !== null || !sharesValid || lastPriceOk === null}
            aria-busy={pending === "sell"}
            className={cn("h-11 px-8 font-bold bg-[#f2f4f3] text-[#2d3433] hover:bg-[#e4e2e1] rounded-lg transition-all border border-[#adb3b2]/20", pending === "sell" && "opacity-80")}
          >
            {pending === "sell" ? "Selling…" : "Sell"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
