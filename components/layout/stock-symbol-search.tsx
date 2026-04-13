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
              'relative flex h-9 w-full items-center gap-2 rounded-md border border-border/60 bg-muted/40 pl-9 pr-3 text-left text-sm shadow-none outline-none',
              'transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
            )}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-label="Search stocks"
          >
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <span className="truncate text-muted-foreground">{PLACEHOLDER}</span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="center"
          sideOffset={8}
          className="w-[var(--radix-popover-trigger-width)] max-w-xl p-0"
        >
          <PopoverTitle className="sr-only">Stock symbol search</PopoverTitle>
          <Command
            shouldFilter={false}
            label="Stock symbol search"
            className="rounded-lg"
          >
            <CommandInput
              placeholder={PLACEHOLDER}
              value={query}
              onValueChange={setQuery}
              autoFocus
            />
            <CommandList>
              {showHint ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  Type at least 2 characters to search symbols, names, ISIN, or
                  CUSIP.
                </div>
              ) : null}

              {showLoading ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  Searching…
                </div>
              ) : null}

              {showError && error ? (
                <div className="px-2 py-6 text-center text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              {showNoHits ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
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
                      >
                        <span className="shrink-0 font-medium tabular-nums">
                          {label}
                        </span>
                        {description ? (
                          <span className="min-w-0 flex-1 truncate text-muted-foreground">
                            {description}
                          </span>
                        ) : null}
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
