"use client";

import { useActionState } from "react";
import { Heart } from "lucide-react";

import {
  createWishlistAction,
  deleteWishlistAction,
  INITIAL_USER_ACTION_STATE,
} from "@/app/user/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WishlistItemSummary } from "@/lib/user/wishlist-service";

type WishlistButtonProps = {
  symbol: string;
  className?: string;
  compact?: boolean;
  exchangeMic?: string | null;
  initialWishlistItem?: WishlistItemSummary | null;
  name?: string | null;
};

export function WishlistButton({
  className,
  compact = false,
  exchangeMic,
  initialWishlistItem,
  name,
  symbol,
}: WishlistButtonProps) {
  const [createState, createAction, createPending] = useActionState(
    createWishlistAction,
    INITIAL_USER_ACTION_STATE,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteWishlistAction,
    INITIAL_USER_ACTION_STATE,
  );
  const latestState =
    (createState.submittedAt ?? 0) > (deleteState.submittedAt ?? 0)
      ? createState
      : deleteState;
  const savedFromAction =
    latestState.status === "success" ? latestState.saved : undefined;
  const isSaved = savedFromAction ?? Boolean(initialWishlistItem);
  const wishlistId =
    latestState.status === "success" && latestState.wishlistId !== undefined
      ? latestState.wishlistId
      : initialWishlistItem?.id;
  const pending = createPending || deletePending;
  const action = isSaved ? deleteAction : createAction;
  const label = isSaved
    ? compact
      ? "Saved"
      : "Saved to wishlist"
    : compact
      ? "Save"
      : "Save to wishlist";

  return (
    <form action={action} className={cn("space-y-2", className)}>
      <input type="hidden" name="symbol" value={symbol} />
      <input type="hidden" name="stockName" value={name ?? ""} />
      <input type="hidden" name="exchangeMic" value={exchangeMic ?? ""} />
      <input
        type="hidden"
        name="notes"
        value={initialWishlistItem?.notes ?? ""}
      />
      {wishlistId ? (
        <input type="hidden" name="wishlistId" value={wishlistId} />
      ) : null}

      <Button
        type="submit"
        disabled={pending || (isSaved && !wishlistId)}
        variant={isSaved ? "outline" : "default"}
        className={cn(
          "h-10 rounded-xl",
          isSaved
            ? "border-[#d6d0cb] bg-white text-[#5f5e5e] hover:bg-[#f2efec]"
            : "bg-[#5f5e5e] text-white hover:bg-[#4f4e4e]",
        )}
      >
        <Heart className={cn("mr-2 h-4 w-4", isSaved ? "fill-current" : "")} />
        {pending ? "Saving..." : label}
      </Button>

      {latestState.status === "error" && latestState.message ? (
        <p className="max-w-xs text-xs leading-5 text-destructive">
          {latestState.message}
        </p>
      ) : null}
    </form>
  );
}
