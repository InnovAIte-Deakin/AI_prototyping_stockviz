"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, History } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Tables } from "@/lib/database.types"
import { cn } from "@/lib/utils"

const formatUsd = (n: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

const formatShares = (n: number): string =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 }).format(n)

const formatWhen = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })

type EnhancedHolding = Tables<"portfolio_holdings"> & {
  currentPrice: number
  value: number
  costBasis: number
  pl: number
  plPct: number
}

type HoldingDrawerProps = {
  holding: EnhancedHolding | null | Tables<"portfolio_holdings">
  onClose: () => void
  transactions: Tables<"portfolio_transactions">[]
}

export function HoldingDrawer({ holding, onClose, transactions }: HoldingDrawerProps) {
  if (!holding) return null

  // Ensure type safety since we passed in enhanced holdings
  const h = holding as EnhancedHolding

  return (
    <Sheet open={!!holding} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-background border-l border-border/20 p-6 flex flex-col gap-6">
        <SheetHeader className="text-left space-y-1">
          <SheetTitle className="font-heading text-2xl font-bold flex items-center justify-between">
            {h.symbol}
            <Button asChild size="sm" className="font-bold shadow-none h-8">
              <Link href={`/stock/${h.symbol}`}>
                Trade <ArrowRight className="ml-1.5 size-3" />
              </Link>
            </Button>
          </SheetTitle>
          <SheetDescription className="text-muted-foreground font-medium">
            Position details and history
          </SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 p-4 rounded-xl border border-border/10">
            <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Shares</p>
            <p className="text-lg font-bold text-foreground">{formatShares(h.shares)}</p>
          </div>
          <div className="bg-muted/30 p-4 rounded-xl border border-border/10">
            <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Avg Price</p>
            <p className="text-lg font-bold text-foreground">{formatUsd(h.avg_price)}</p>
          </div>
          <div className="bg-muted/30 p-4 rounded-xl border border-border/10">
            <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Market Value</p>
            <p className="text-lg font-bold text-foreground">{h.value !== undefined ? formatUsd(h.value) : "—"}</p>
          </div>
          <div className="bg-muted/30 p-4 rounded-xl border border-border/10">
            <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Total Return</p>
            <p className={cn("text-lg font-bold", h.pl >= 0 ? "text-finance-success" : "text-finance-danger")}>
              {h.pl >= 0 ? "+" : ""}{h.pl !== undefined ? formatUsd(h.pl) : "—"}
            </p>
          </div>
        </div>

        <div className="space-y-4 flex-1">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <History className="size-4" /> Recent Transactions
          </h3>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent transactions found.</p>
          ) : (
            <div className="rounded-xl border border-border/10 bg-card overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-8 py-2 text-xs font-bold">Date</TableHead>
                    <TableHead className="h-8 py-2 text-xs font-bold">Type</TableHead>
                    <TableHead className="h-8 py-2 text-xs font-bold text-right">Qty / Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 50).map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/30">
                      <TableCell className="py-2 text-xs font-medium text-muted-foreground">
                        {formatWhen(t.executed_at).split(",")[0]}
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge 
                          variant={t.side === "buy" ? "success" : "destructive"}
                          className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0"
                        >
                          {t.side}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-right text-xs">
                        <span className="font-bold text-foreground">{formatShares(t.shares)}</span>
                        <span className="text-muted-foreground mx-1">@</span>
                        <span className="font-bold text-foreground">{formatUsd(t.unit_price_usd)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
