"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Wallet, Info } from "lucide-react"

import { buyPaperShares, sellPaperShares } from "@/app/portfolio/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const formatUsd = (n: number): string =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

type TradeStockDialogProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  mode: "buy" | "sell"
  symbol: string
  currentPrice: number | null
  availableCash: number
  sharesOwned?: number
}

export function TradeStockDialog({
  isOpen,
  onOpenChange,
  mode,
  symbol,
  currentPrice,
  availableCash,
  sharesOwned = 0,
}: TradeStockDialogProps) {
  const router = useRouter()
  const [shares, setShares] = React.useState("")
  const [isPending, setIsPending] = React.useState(false)

  const shareCount = Number.parseInt(shares, 10)
  const isSharesValid = Number.isInteger(shareCount) && shareCount > 0
  const estimatedValue = currentPrice !== null && isSharesValid ? shareCount * currentPrice : 0

  const handleTrade = async () => {
    if (!isSharesValid) {
      toast.error("Please enter a valid whole number of shares.")
      return
    }

    if (mode === "sell" && shareCount > sharesOwned) {
      toast.error(`You only own ${sharesOwned} shares of ${symbol}.`)
      return
    }

    setIsPending(true)
    const res = mode === "buy" 
      ? await buyPaperShares(symbol, shareCount)
      : await sellPaperShares(symbol, shareCount)
    
    setIsPending(false)

    if (res.ok) {
      toast.success(`${symbol} was ${mode === "buy" ? "added to" : "sold from"} your paper portfolio.`)
      onOpenChange(false)
      setShares("")
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] border-[#adb3b2]/20 bg-white shadow-2xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 bg-[#f9f9f8]/50 border-b border-[#adb3b2]/10">
          <DialogTitle className="text-xl font-bold text-[#2d3433]">
            {mode === "buy" ? "Buy" : "Sell"} {symbol}
          </DialogTitle>
          <DialogDescription className="text-[#5a6060] font-medium">
            Execute a paper trade at the current market price.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-[#5a6060]">Current price</p>
              <p className="text-lg font-bold text-[#2d3433]">
                {currentPrice !== null ? formatUsd(currentPrice) : "—"}
              </p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-xs font-medium text-[#5a6060]">Available cash</p>
              <p className="text-lg font-bold text-[#2d3433] flex items-center justify-end gap-1.5">
                <Wallet className="size-3.5 text-emerald-600" />
                {formatUsd(availableCash)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="shares" className="text-sm font-medium text-[#5a6060]">Quantity</Label>
              {mode === "sell" && (
                <span className="text-[10px] font-medium text-[#adb3b2]">
                  Owned: <span className="text-[#5a6060] font-bold">{sharesOwned}</span>
                </span>
              )}
            </div>
            <Input
              id="shares"
              type="number"
              step="1"
              min="1"
              placeholder="0"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="h-12 text-lg font-bold text-[#2d3433] bg-white border-[#adb3b2]/30 focus-visible:border-[#5f5e5e] focus-visible:ring-0 rounded-xl"
              autoFocus
            />
          </div>

          <div className="rounded-xl bg-[#f2f4f3]/50 p-4 border border-[#adb3b2]/10 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#5a6060]">Estimated {mode === "buy" ? "cost" : "proceeds"}</p>
              <p className={cn(
                "text-lg font-bold tabular-nums",
                mode === "buy" ? "text-[#2d3433]" : "text-emerald-600"
              )}>
                {formatUsd(estimatedValue)}
              </p>
            </div>
            
            <div className="flex items-center justify-between border-t border-[#adb3b2]/10 pt-3">
              <p className="text-xs font-medium text-[#adb3b2]">Cash after {mode === "buy" ? "purchase" : "sale"}</p>
              <p className={cn(
                "text-sm font-bold tabular-nums text-[#5a6060]",
                (mode === "buy" ? availableCash - estimatedValue : availableCash + estimatedValue) < 0 && "text-rose-600"
              )}>
                {formatUsd(mode === "buy" ? availableCash - estimatedValue : availableCash + estimatedValue)}
              </p>
            </div>
          </div>

          {mode === "buy" && estimatedValue > availableCash && (
            <div className="flex items-start gap-2 text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">
              <Info className="size-4 shrink-0 mt-0.5" />
              <p className="text-xs font-bold">Insufficient funds for this trade.</p>
            </div>
          )}

          {mode === "sell" && shareCount > sharesOwned && (
            <div className="flex items-start gap-2 text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">
              <Info className="size-4 shrink-0 mt-0.5" />
              <p className="text-xs font-bold">You cannot sell more shares than you own.</p>
            </div>
          )}
        </div>

        <div className="p-6 pt-4 flex items-center gap-3 border-t border-[#adb3b2]/10">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1 h-9 text-xs border-[#adb3b2]/30 text-[#5a6060] font-bold rounded-xl hover:bg-[#f9f9f8] transition-all"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleTrade}
            disabled={isPending || !isSharesValid || (mode === "buy" && estimatedValue > availableCash) || (mode === "sell" && shareCount > sharesOwned)}
            className={cn(
              "flex-1 h-9 text-xs text-white font-bold rounded-xl transition-all shadow-sm",
              mode === "buy" ? "bg-[#5f5e5e] hover:bg-[#4a4a4a]" : "bg-[#752121] hover:bg-[#5a1a1a]"
            )}
          >
            {isPending ? "Executing..." : `${mode === "buy" ? "Buy" : "Sell"} ${symbol}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
