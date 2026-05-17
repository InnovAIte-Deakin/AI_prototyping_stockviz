'use client'

import * as React from 'react'
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

type SymbolSearchAdderProps = {
  className?: string
  onAdd: (symbol: string, name?: string) => void
  disabled?: boolean
  placeholder?: string
}

export const SymbolSearchAdder = ({
  className,
  onAdd,
  disabled,
  placeholder = 'Search to add a stock...'
}: SymbolSearchAdderProps) => {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')

  const { results, error, isLoading } = useSymbolSearch({
    query: open ? query : '',
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
    if (disabled && next) return
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
    onAdd(sym, item.description)
  }

  return (
    <div className={cn('relative w-full', className)}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'relative flex h-10 w-full items-center gap-2 rounded-lg border border-border/20 bg-card pl-9 pr-3 text-left text-sm shadow-sm outline-none',
              'transition-all hover:bg-muted focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary',
              disabled && 'opacity-50 cursor-not-allowed hover:bg-card'
            )}
            aria-expanded={open}
            aria-haspopup="dialog"
          >
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <span className="truncate text-muted-foreground font-medium">{placeholder}</span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={8}
          className="w-[var(--radix-popover-trigger-width)] p-0 border-border/20 bg-card shadow-xl"
        >
          <PopoverTitle className="sr-only">Stock symbol search</PopoverTitle>
          <Command
            shouldFilter={false}
            label="Stock symbol search"
            className="rounded-lg bg-card! text-foreground!"
          >
            <CommandInput
              placeholder={placeholder}
              value={query}
              onValueChange={setQuery}
              autoFocus
              className="text-foreground placeholder:text-muted-foreground"
            />
            <CommandList>
              {showHint ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground font-medium">
                  Type at least 2 characters to search.
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
                        className="group transition-colors data-[selected=true]:bg-primary cursor-pointer"
                      >
                        <span className="shrink-0 font-bold tabular-nums text-foreground group-data-[selected=true]:text-primary-foreground">
                          {label}
                        </span>
                        {description ? (
                          <span className="min-w-0 flex-1 truncate text-muted-foreground font-medium group-data-[selected=true]:text-primary-foreground/90 ml-2">
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
