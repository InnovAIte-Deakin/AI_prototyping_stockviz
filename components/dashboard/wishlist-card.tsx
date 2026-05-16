"use client"

import * as React from "react"
import Link from "next/link"
import { useWishlist } from "@/components/providers/wishlist-provider"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { WishlistStar } from "@/components/ui/wishlist-star"
import { cn } from "@/lib/utils"

export function WishlistCard({ className }: { className?: string }) {
  const { items, isLoading } = useWishlist()

  return (
    <Card className={cn("flex flex-col bg-card border-border/20 shadow-md shadow-foreground/5 overflow-hidden", className)}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-bold text-primary">Your Wishlist</CardTitle>
        </div>
      </CardHeader>
      <CardContent className={cn("p-4 pt-0", items.length > 0 && "flex-1 min-h-0")}>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-border/10 bg-muted/10 p-3.5">
                <div className="flex gap-3 items-center flex-1">
                  <div className="h-5 w-12 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                </div>
                <div className="h-5 w-5 rounded-full bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-2 text-center py-8">
            <p className="text-xs font-medium text-muted-foreground">No stocks in your wishlist yet.</p>
            <p className="text-xs font-medium text-muted-foreground max-w-[180px] leading-relaxed">
              Search for a stock and tap the star to save it.
            </p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto pr-1 max-h-[280px] scrollbar-hide">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-border/10 bg-muted/30 p-3.5 transition-all hover:bg-muted/50 hover:shadow-sm"
              >
                <Link
                  href={`/stock/${item.symbol}`}
                  className="flex flex-1 items-center gap-3 truncate"
                >
                  <span className="font-mono text-base font-bold tracking-tight text-foreground">{item.symbol}</span>
                  {item.name && (
                    <span className="truncate text-xs font-medium text-muted-foreground">
                      {item.name}
                    </span>
                  )}
                </Link>
                <div className="shrink-0">
                  <WishlistStar symbol={item.symbol} name={item.name || undefined} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
