"use client";

import * as React from "react";
import { Star } from "lucide-react";

import { useOptionalWishlist } from "@/components/providers/wishlist-provider";
import { cn } from "@/lib/utils";
import type { WishlistItemSummary } from "@/lib/user/wishlist-service";

type WishlistStarProps = {
  symbol: string;
  name?: string | null;
  className?: string;
  iconClassName?: string;
  initialWishlistItem?: WishlistItemSummary | null;
};

export function WishlistStar({
  symbol,
  name,
  className,
  iconClassName,
  initialWishlistItem,
}: WishlistStarProps) {
  const wishlist = useOptionalWishlist();
  const isLoading = wishlist?.isLoading ?? true;
  const saved = wishlist?.isWishlisted(symbol) ?? false;

  React.useEffect(() => {
    wishlist?.seedWishlistItem(initialWishlistItem);
  }, [initialWishlistItem, wishlist]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void wishlist?.toggleWishlist(symbol, name);
  };

  return (
    <button
      aria-label={
        saved ? `Remove ${symbol} from wishlist` : `Add ${symbol} to wishlist`
      }
      className={cn(
        "hover:bg-muted focus-visible:ring-ring inline-flex size-8 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50",
        className,
      )}
      disabled={isLoading}
      onClick={handleClick}
      title={saved ? "Remove from wishlist" : "Add to wishlist"}
      type="button"
    >
      <Star
        aria-hidden
        className={cn(
          "size-4 transition-colors",
          saved
            ? "fill-yellow-400 text-yellow-500"
            : "text-muted-foreground hover:text-foreground",
          iconClassName,
        )}
      />
    </button>
  );
}
