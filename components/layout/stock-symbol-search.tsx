'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useSymbolSearch } from '@/hooks/use-symbol-search'
import type { FinnhubSymbolLookupInfo } from '@/lib/types'
import { cn } from '@/lib/utils'
import { WishlistStar } from '@/components/ui/wishlist-star'

const MAX_RESULTS = 10

const PLACEHOLDER = 'Search stocks, tickers, companies, and more…'

type StockSymbolSearchProps = {
  className?: string
  /** Optional Finnhub `exchange` filter (e.g. `US`). See GET `/search`. */
  exchange?: string
}

export const StockSymbolSearch = ({
  className,
  exchange,
}: StockSymbolSearchProps) => {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')

  const { results, error, isLoading } = useSymbolSearch({
    query: open ? query : '',
    exchange,
    minQueryLength: 2,
  })

  const topMatches = React.useMemo(
    () => results.slice(0, MAX_RESULTS),
    [results]
  )

  const trimmed = query.trim()
  const showHint = trimmed.length < 2
  const showLoading = !showHint && isLoading
  const showError = !showHint && !isLoading && Boolean(error)
  const showNoHits =
    !showHint && !isLoading && !error && topMatches.length === 0

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setQuery('')
    }
  }

  const handleSelectSymbol = (item: FinnhubSymbolLookupInfo) => {
    const sym = item.displaySymbol ?? item.symbol
    if (!sym) {
      return
    }
    setOpen(false)
    setQuery('')
    router.push(`/stock/${encodeURIComponent(sym)}`)
  }

  return (
    <div className={cn('relative w-full max-w-xl', className)}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'relative flex h-9 w-full items-center gap-2 rounded-lg border border-border/20 bg-muted/50 pl-9 pr-3 text-left text-sm shadow-none outline-none',
              'transition-all hover:bg-muted focus-visible:border-primary focus-visible:ring-0'
            )}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-label="Search stocks"
          >
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <span className="truncate text-muted-foreground font-medium">{PLACEHOLDER}</span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="center"
          sideOffset={8}
          className="w-[var(--radix-popover-trigger-width)] max-w-xl p-0 border-border/20 bg-card shadow-xl shadow-foreground/10"
        >
          <PopoverTitle className="sr-only">Stock symbol search</PopoverTitle>
          <Command
            shouldFilter={false}
            label="Stock symbol search"
            className="rounded-lg bg-card! text-foreground!"
          >
            <CommandInput
              placeholder={PLACEHOLDER}
              value={query}
              onValueChange={setQuery}
              autoFocus
              className="text-foreground placeholder:text-muted-foreground"
            />
            <CommandList>
              {showHint ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground font-medium">
                  Type at least 2 characters to search symbols, names, ISIN, or
                  CUSIP.
                </div>
              ) : null}

              {showLoading ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground font-medium">
                  Searching…
                </div>
              ) : null}

              {showError && error ? (
                <div className="px-2 py-6 text-center text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              {showNoHits ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground font-medium">
                  No matching symbols.
                </div>
              ) : null}

              {topMatches.length > 0 ? (
                <CommandGroup heading="Top matches">
                  {topMatches.map((item, index) => {
                    const label = item.displaySymbol ?? item.symbol ?? '—'
                    const description = item.description ?? ''
                    const value = `${label}-${index}`
                    return (
                      <CommandItem
                        key={value}
                        value={value}
                        onSelect={() => {
                          handleSelectSymbol(item)
                        }}
                        className="group transition-colors data-[selected=true]:bg-primary"
                      >
                        <span className="shrink-0 font-bold tabular-nums text-foreground group-data-[selected=true]:text-primary-foreground">
                          {label}
                        </span>
                        {description ? (
                          <span className="min-w-0 flex-1 truncate text-muted-foreground font-medium group-data-[selected=true]:text-primary-foreground/90">
                            {description}
                          </span>
                        ) : null}
                        <WishlistStar 
                          symbol={label} 
                          name={description} 
                          className="ml-auto opacity-0 transition-opacity group-hover:opacity-100 data-[selected=true]:opacity-100 sm:opacity-100" 
                        />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
