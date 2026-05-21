"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  listWishlistSummariesAction,
  toggleWishlistBySymbolAction,
} from "@/app/user/actions";
import type { WishlistItemSummary } from "@/lib/user/wishlist-service";

type WishlistContextValue = {
  isLoading: boolean;
  isWishlisted: (symbol: string) => boolean;
  seedWishlistItem: (item: WishlistItemSummary | null | undefined) => void;
  toggleWishlist: (symbol: string, name?: string | null) => Promise<void>;
  items: WishlistItemSummary[];
};

const WishlistContext = React.createContext<WishlistContextValue | null>(null);

const normalizeSymbol = (symbol: string): string => symbol.trim().toUpperCase();

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<WishlistItemSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await listWishlistSummariesAction();
      if (cancelled) return;

      if (result.ok) {
        setItems(result.items);
      }
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const isWishlisted = React.useCallback(
    (symbol: string) => {
      const normalized = normalizeSymbol(symbol);
      return items.some((item) => normalizeSymbol(item.symbol) === normalized);
    },
    [items],
  );

  const seedWishlistItem = React.useCallback(
    (item: WishlistItemSummary | null | undefined) => {
      if (!item) return;
      setItems((current) => {
        const normalized = normalizeSymbol(item.symbol);
        if (current.some((row) => normalizeSymbol(row.symbol) === normalized)) {
          return current;
        }
        return [...current, item];
      });
    },
    [],
  );

  const toggleWishlist = React.useCallback(
    async (symbol: string, name?: string | null) => {
      const normalized = normalizeSymbol(symbol);
      if (!normalized) return;

      const previous = items;
      const alreadySaved = previous.some(
        (item) => normalizeSymbol(item.symbol) === normalized,
      );

      setItems((current) =>
        alreadySaved
          ? current.filter((item) => normalizeSymbol(item.symbol) !== normalized)
          : [
              ...current,
              {
                created_at: new Date().toISOString(),
                id: `pending-${normalized}`,
                name: name ?? null,
                notes: null,
                stockId: `pending-${normalized}`,
                symbol: normalized,
              },
            ],
      );

      const result = await toggleWishlistBySymbolAction(
        normalized,
        name ?? undefined,
      );

      if (!result.ok) {
        setItems(previous);
        toast.error(result.error);
        return;
      }

      const savedItem = result.item;
      if (result.saved && savedItem) {
        setItems((current) => [
          ...current.filter(
            (item) => normalizeSymbol(item.symbol) !== normalized,
          ),
          savedItem,
        ]);
        toast.success(`Saved ${result.symbol} to your wishlist.`);
      } else {
        setItems((current) =>
          current.filter((item) => normalizeSymbol(item.symbol) !== normalized),
        );
        toast.success(`Removed ${result.symbol} from your wishlist.`);
      }
    },
    [items],
  );

  const value = React.useMemo(
    () => ({
      isLoading,
      isWishlisted,
      items,
      seedWishlistItem,
      toggleWishlist,
    }),
    [isLoading, isWishlisted, items, seedWishlistItem, toggleWishlist],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = React.useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }

  return context;
}

export function useOptionalWishlist() {
  return React.useContext(WishlistContext);
}
