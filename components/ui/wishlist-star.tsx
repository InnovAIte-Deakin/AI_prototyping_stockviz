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
        "flex items-center justify-center rounded-lg p-1.5 transition-all hover:bg-[#f2f4f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#adb3b2]/20 disabled:opacity-50",
        className
      )}
      aria-label={wishlisted ? `Remove ${symbol} from wishlist` : `Add ${symbol} to wishlist`}
      title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
    >
      <Star
        className={cn(
          "size-4 transition-all duration-300",
          wishlisted
            ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.3)]"
            : "text-[#adb3b2] hover:text-[#5f5e5e]",
          iconClassName
        )}
      />
    </button>
  )
}
