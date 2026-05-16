"use client"

import * as React from "react"
import { getWishlist, toggleWishlist as toggleWishlistAction } from "@/app/actions/wishlist"
import { toast } from "sonner"

type WishlistItem = {
  id: string
  created_at: string
  stockId: string
  symbol: string
  name: string | null
}

type WishlistContextType = {
  items: WishlistItem[]
  isLoading: boolean
  isWishlisted: (symbol: string) => boolean
  toggleWishlist: (symbol: string, name?: string) => Promise<void>
}

const WishlistContext = React.createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      const { data, error } = await getWishlist()
      if (!error && data) {
        setItems(data)
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const isWishlisted = React.useCallback(
    (symbol: string) => {
      const upperSymbol = symbol.trim().toUpperCase()
      return items.some((item) => item.symbol.toUpperCase() === upperSymbol)
    },
    [items]
  )

  const toggleWishlist = React.useCallback(
    async (symbol: string, name?: string) => {
      const upperSymbol = symbol.trim().toUpperCase()
      const alreadyWishlisted = isWishlisted(upperSymbol)

      // Optimistic update
      if (alreadyWishlisted) {
        setItems((prev) => prev.filter((item) => item.symbol.toUpperCase() !== upperSymbol))
      } else {
        setItems((prev) => [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            created_at: new Date().toISOString(),
            stockId: `temp-${Date.now()}`,
            symbol: upperSymbol,
            name: name || null,
          },
        ])
      }

      const { error, isWishlisted: newStatus } = await toggleWishlistAction(symbol, name)

      if (error) {
        if (error === "Not authenticated") {
          toast.error("Please sign in to save stocks to your wishlist.")
        } else {
          toast.error("Failed to update wishlist.")
        }
        
        // Revert optimistic update on error by reloading
        const { data } = await getWishlist()
        if (data) setItems(data)
      } else {
        // If it was successfully added, we need real IDs, so reload.
        if (newStatus && !alreadyWishlisted) {
            const { data } = await getWishlist()
            if (data) setItems(data)
        }
      }
    },
    [isWishlisted]
  )

  return (
    <WishlistContext.Provider value={{ items, isLoading, isWishlisted, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = React.useContext(WishlistContext)
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}
