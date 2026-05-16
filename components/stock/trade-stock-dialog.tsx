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
      <DialogContent className="sm:max-w-[400px] border-border/20 bg-card shadow-2xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 bg-background/50 border-b border-border/10">
          <DialogTitle className="text-xl font-bold text-foreground">
            {mode === "buy" ? "Buy" : "Sell"} {symbol}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium">
            Execute a paper trade at the current market price.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Current price</p>
              <p className="text-lg font-bold text-foreground">
                {currentPrice !== null ? formatUsd(currentPrice) : "—"}
              </p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-xs font-medium text-muted-foreground">Available cash</p>
              <p className="text-lg font-bold text-foreground flex items-center justify-end gap-1.5">
                <Wallet className="size-3.5 text-finance-success" />
                {formatUsd(availableCash)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="shares" className="text-sm font-medium text-muted-foreground">Quantity</Label>
              {mode === "sell" && (
                <span className="text-[10px] font-medium text-muted-foreground">
                  Owned: <span className="text-muted-foreground font-bold">{sharesOwned}</span>
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
              className="h-12 text-lg font-bold text-foreground bg-card border-border/30 focus-visible:border-primary focus-visible:ring-0 rounded-xl"
              autoFocus
            />
          </div>

          <div className="rounded-xl bg-muted/50 p-4 border border-border/10 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Estimated {mode === "buy" ? "cost" : "proceeds"}</p>
              <p className={cn(
                "text-lg font-bold tabular-nums",
                mode === "buy" ? "text-foreground" : "text-finance-success"
              )}>
                {formatUsd(estimatedValue)}
              </p>
            </div>
            
            <div className="flex items-center justify-between border-t border-border/10 pt-3">
              <p className="text-xs font-medium text-muted-foreground">Cash after {mode === "buy" ? "purchase" : "sale"}</p>
              <p className={cn(
                "text-sm font-bold tabular-nums text-muted-foreground",
                (mode === "buy" ? availableCash - estimatedValue : availableCash + estimatedValue) < 0 && "text-destructive"
              )}>
                {formatUsd(mode === "buy" ? availableCash - estimatedValue : availableCash + estimatedValue)}
              </p>
            </div>
          </div>

          {mode === "buy" && estimatedValue > availableCash && (
            <div className="flex items-start gap-2 text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
              <Info className="size-4 shrink-0 mt-0.5" />
              <p className="text-xs font-bold">Insufficient funds for this trade.</p>
            </div>
          )}

          {mode === "sell" && shareCount > sharesOwned && (
            <div className="flex items-start gap-2 text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
              <Info className="size-4 shrink-0 mt-0.5" />
              <p className="text-xs font-bold">You cannot sell more shares than you own.</p>
            </div>
          )}
        </div>

        <div className="p-6 pt-4 flex items-center gap-3 border-t border-border/10">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1 h-9 text-xs border-border/30 text-muted-foreground font-bold rounded-xl hover:bg-background transition-all"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleTrade}
            disabled={isPending || !isSharesValid || (mode === "buy" && estimatedValue > availableCash) || (mode === "sell" && shareCount > sharesOwned)}
            className={cn(
              "flex-1 h-9 text-xs font-bold rounded-xl transition-all shadow-sm",
              mode === "buy" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {isPending ? "Executing..." : `${mode === "buy" ? "Buy" : "Sell"} ${symbol}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
