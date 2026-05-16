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
    <Card className={cn("flex flex-col bg-white border-[#adb3b2]/20 shadow-md shadow-[#2d3433]/5 overflow-hidden", className)}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-bold text-[#5f5e5e]">Your Wishlist</CardTitle>
        </div>
      </CardHeader>
      <CardContent className={cn("p-4 pt-0", items.length > 0 && "flex-1 min-h-0")}>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-[#adb3b2]/10 bg-[#f2f4f3]/10 p-2">
                <div className="flex gap-2 items-center flex-1">
                  <div className="h-4 w-8 rounded bg-[#f2f4f3] animate-pulse" />
                  <div className="h-3 w-20 rounded bg-[#f2f4f3] animate-pulse" />
                </div>
                <div className="h-4 w-4 rounded-full bg-[#f2f4f3] animate-pulse" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-2 text-center py-8">
            <p className="text-xs font-medium text-[#5a6060]">No stocks in your wishlist yet.</p>
            <p className="text-xs font-medium text-[#adb3b2] max-w-[180px] leading-relaxed">
              Search for a stock and tap the star to save it.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 overflow-y-auto pr-1 max-h-[320px]">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-[#adb3b2]/10 bg-[#f2f4f3]/30 p-2 transition-colors hover:bg-[#f2f4f3]"
              >
                <Link
                  href={`/stock/${item.symbol}`}
                  className="flex flex-1 items-center gap-2 truncate"
                >
                  <span className="font-bold text-xs text-[#2d3433]">{item.symbol}</span>
                  {item.name && (
                    <span className="truncate text-[10px] font-medium text-[#5a6060]">
                      {item.name}
                    </span>
                  )}
                </Link>
                <div className="scale-75 origin-right">
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
