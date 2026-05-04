"use client"

import * as React from "react"
import Link from "next/link"
import { useWishlist } from "@/components/providers/wishlist-provider"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { WishlistStar } from "@/components/ui/wishlist-star"

export function WishlistCard() {
  const { items, isLoading } = useWishlist()

  return (
    <Card className="flex h-full flex-col bg-zinc-950/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-lg text-zinc-100">Your Wishlist</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center space-y-3 text-center text-sm text-zinc-500 py-6">
            <p>Your wishlist is empty.</p>
            <p>Search for a stock and click the star to add it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 transition-colors hover:bg-zinc-800/80"
              >
                <Link
                  href={`/stock/${item.symbol}`}
                  className="flex flex-1 flex-col truncate hover:underline mr-4"
                >
                  <span className="font-semibold text-zinc-100">{item.symbol}</span>
                  {item.name && (
                    <span className="truncate text-xs text-zinc-400">
                      {item.name}
                    </span>
                  )}
                </Link>
                <WishlistStar symbol={item.symbol} name={item.name || undefined} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
