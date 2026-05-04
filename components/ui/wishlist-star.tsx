"use client"

import * as React from "react"
import { Star } from "lucide-react"
import { useWishlist } from "@/components/providers/wishlist-provider"
import { cn } from "@/lib/utils"

type WishlistStarProps = {
  symbol: string
  name?: string
  className?: string
  iconClassName?: string
}

export function WishlistStar({ symbol, name, className, iconClassName }: WishlistStarProps) {
  const { isWishlisted, toggleWishlist, isLoading } = useWishlist()
  const wishlisted = isWishlisted(symbol)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(symbol, name)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "flex items-center justify-center rounded-md p-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        className
      )}
      aria-label={wishlisted ? `Remove ${symbol} from wishlist` : `Add ${symbol} to wishlist`}
      title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
    >
      <Star
        className={cn(
          "size-4 transition-all duration-200",
          wishlisted
            ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
            : "text-muted-foreground hover:text-foreground",
          iconClassName
        )}
      />
    </button>
  )
}
