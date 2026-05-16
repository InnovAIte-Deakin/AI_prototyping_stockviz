"use client"

import * as React from "react"
import Link from "next/link"
import { ExternalLink, AlertCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { WishlistStar } from "@/components/ui/wishlist-star"
import type { MoverRow } from "@/lib/fmp/biggest-movers"
import type { ExplainMoveResponse } from "@/lib/stocks/explain-move-schema"
import { cn } from "@/lib/utils"

const formatPrice = (n: number | null): string => {
  if (n === null) return "—"
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const formatPct = (n: number | null): string => {
  if (n === null) return "—"
  if (n > 0) return `+${n.toFixed(2)}%`
  return `${n.toFixed(2)}%`
}

const formatDollarChange = (n: number | null): string => {
  if (n === null) return "—"
  const sign = n > 0 ? "+" : n < 0 ? "-" : ""
  return `${sign}$${Math.abs(n).toFixed(2)}`
}

const CARD_WIDTH_CLASS =
  "w-[min(260px,calc(100vw-2.5rem))] min-w-[min(260px,calc(100vw-2.5rem))] max-w-[min(260px,calc(100vw-2.5rem))] sm:w-64 sm:min-w-64 sm:max-w-64"

const rowKey = (row: MoverRow) => `${row.kind}:${row.symbol}`

const DEBOUNCE_MS = 420
const LEAVE_GRACE_MS = 260

const formatCategoryLabel = (c: string): string =>
  c
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")

/**
 * Defer fine-pointer / hover detection until after mount so SSR and the first
 * client paint match (avoids hydration mismatches from useSyncExternalStore).
 */
const useFineHover = (): boolean => {
  const [fine, setFine] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)")
    const update = () => setFine(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])
  return fine
}

type MoverCardFaceProps = {
  row: MoverRow
  duplicate?: boolean
}

const MoverCardFace = ({ row, duplicate = false }: MoverCardFaceProps) => {
  const isGainer = row.kind === "gainer"
  const accent = isGainer ? "text-emerald-600" : "text-rose-600"
  const badgeBg = isGainer
    ? "bg-emerald-100 text-emerald-700 ring-emerald-500/20"
    : "bg-rose-100 text-rose-700 ring-rose-500/20"

  return (
    <>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-mono text-lg font-bold tracking-tight text-[#2d3433]">
            {row.symbol}
          </p>
          <p className="line-clamp-2 text-xs leading-snug text-[#5a6060]">{row.name}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <WishlistStar symbol={row.symbol} name={row.name} />
          <span
            className={cn(
              "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium border border-[#adb3b2]/20",
              badgeBg
            )}
          >
            {isGainer ? "Gainer" : "Loser"}
          </span>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap items-end justify-between gap-2 border-t border-[#adb3b2]/20 pt-2">
        <div>
          <p className="text-[10px] font-medium text-[#5a6060]">Last</p>
          <p className="text-sm font-semibold tabular-nums text-[#2d3433]">${formatPrice(row.price)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium text-[#5a6060]">Chg / %</p>
          <p className={cn("text-sm font-bold tabular-nums", accent)}>
            {formatDollarChange(row.change)}{" "}
            <span className="text-xs font-medium">({formatPct(row.changePct)})</span>
          </p>
        </div>
      </div>
      {row.exchange ? (
        <p className="mt-2 truncate text-[10px] font-medium text-[#adb3b2]">{row.exchange}</p>
      ) : null}
      {!duplicate ? (
        <p className="mt-2 text-[10px] font-medium text-[#5a6060]">Hover or tap for AI context</p>
      ) : null}
    </>
  )
}

type ExplainBodyProps = {
  row: MoverRow
  explanation: ExplainMoveResponse | null
  loading: boolean
  error: string | null
  onRetry: () => void
  onPointerEnterContent: () => void
  onPointerLeaveContent: () => void
}

const MoverExplainBody = ({
  row,
  explanation,
  loading,
  error,
  onRetry,
  onPointerEnterContent,
  onPointerLeaveContent,
}: ExplainBodyProps) => {
  const isGainer = row.kind === "gainer"

  return (
    <PopoverContent
      align="start"
      side="top"
      sideOffset={10}
      collisionPadding={16}
      className={cn(
        "w-[min(24rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] gap-0 border-[#adb3b2]/20 bg-white p-4 text-[#2d3433] shadow-xl ring-1 ring-[#adb3b2]/20",
        "max-h-[min(70vh,32rem)] overflow-y-auto"
      )}
      onOpenAutoFocus={(e) => e.preventDefault()}
      onPointerEnter={onPointerEnterContent}
      onPointerLeave={onPointerLeaveContent}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-lg font-bold tracking-tight text-[#2d3433]">{row.symbol}</p>
          <p className="text-sm font-medium text-[#5a6060]">{row.name}</p>
        </div>
        <Badge
          variant="outline"
          className={
            isGainer
              ? "border-emerald-500/40 text-emerald-600 font-bold bg-emerald-50"
              : "border-rose-500/40 text-rose-600 font-bold bg-rose-50"
          }
        >
          {isGainer ? "Top gainer" : "Top loser"}
        </Badge>
      </div>
      <p className="mt-1 text-sm tabular-nums text-[#5a6060]">
        Today: <span className="font-bold text-[#2d3433]">{formatPct(row.changePct)}</span>
      </p>

      <Separator className="my-3 bg-[#adb3b2]/20" />

      {loading ? (
        <div className="space-y-2" aria-busy aria-live="polite">
          <Skeleton className="h-4 w-full bg-[#f2f4f3]" />
          <Skeleton className="h-4 w-full bg-[#f2f4f3]" />
          <Skeleton className="h-4 w-3/4 bg-[#f2f4f3]" />
        </div>
      ) : null}

      {error && !loading ? (
        <div className="space-y-3 rounded-lg border border-rose-200 bg-rose-50/50 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-rose-700">Unable to explain move</p>
              <p className="line-clamp-3 text-[11px] leading-relaxed text-rose-600/90">
                AI analysis is temporarily unavailable. This usually happens when the daily API limit is reached.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-rose-200 bg-white px-3 text-[11px] font-bold text-rose-700 hover:bg-rose-50 hover:text-rose-800 transition-colors"
            onClick={onRetry}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {explanation && !loading ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-[#f2f4f3] text-[#5a6060]">
              {formatCategoryLabel(explanation.category)}
            </Badge>
            <Badge variant="outline" className="border-[#adb3b2]/30 text-[#5a6060]">
              Confidence: {explanation.confidence}
            </Badge>
          </div>
          <p className="text-sm leading-relaxed text-[#2d3433]">{explanation.likelyReason}</p>
          {explanation.evidence.length > 0 ? (
            <div>
              <p className="mb-1.5 text-xs font-medium text-[#5a6060]">
                Evidence
              </p>
              <ul className="space-y-2">
                {explanation.evidence.map((ev, i) => (
                  <li key={`${ev.headline}-${i}`} className="text-xs text-[#5a6060]">
                    {ev.url ? (
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex gap-1.5 text-[#2d3433] underline-offset-2 hover:text-[#5f5e5e] hover:underline font-bold"
                      >
                        <span className="min-w-0 flex-1">{ev.headline}</span>
                        <ExternalLink
                          className="size-3.5 shrink-0 opacity-60 group-hover:opacity-100"
                          aria-hidden
                        />
                      </a>
                    ) : (
                      <span className="text-[#2d3433] font-bold">{ev.headline}</span>
                    )}
                    {ev.source ? (
                      <span className="mt-0.5 block text-[10px] text-[#adb3b2] font-medium">{ev.source}</span>
                    ) : null}
                    <span className="mt-0.5 block text-[#adb3b2] font-medium">{ev.relevance}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="text-xs text-[#adb3b2] font-medium">{explanation.caveat}</p>
        </div>
      ) : null}

      <Separator className="my-3 bg-[#adb3b2]/20" />

      <p className="text-[10px] leading-snug text-[#adb3b2]">
        AI-generated explanation. Not financial advice.
      </p>

      <Link
        href={`/stock/${encodeURIComponent(row.symbol)}`}
        className="mt-3 inline-flex text-xs font-bold text-[#5f5e5e] hover:text-[#2d3433] hover:underline"
      >
        Open {row.symbol} page →
      </Link>
    </PopoverContent>
  )
}

type InteractiveMoverCardProps = {
  row: MoverRow
  popoverOpen: boolean
  explanation: ExplainMoveResponse | null
  loading: boolean
  error: string | null
  fineHover: boolean
  onOpenChange: (open: boolean) => void
  onRequestExplain: (row: MoverRow) => void
  onCancelPendingExplain: () => void
  onPopoverPointerEnter: () => void
  onPopoverPointerLeave: () => void
  onRetry: (row: MoverRow) => void
}

const InteractiveMoverCard = ({
  row,
  popoverOpen,
  explanation,
  loading,
  error,
  fineHover,
  onOpenChange,
  onRequestExplain,
  onCancelPendingExplain,
  onPopoverPointerEnter,
  onPopoverPointerLeave,
  onRetry,
}: InteractiveMoverCardProps) => {
  const shellClass = cn(
    "flex h-full min-h-[132px] shrink-0 flex-col rounded-xl border border-[#adb3b2]/20 bg-white p-4",
    "shadow-sm shadow-[#2d3433]/5 transition-colors",
    "hover:border-[#adb3b2]/40 hover:bg-[#f2f4f3] focus-visible:border-[#adb3b2]/40 focus-visible:bg-[#f2f4f3]"
  )

  const handleRetry = () => {
    onRetry(row)
  }

  if (!fineHover) {
    return (
      <Popover open={popoverOpen} onOpenChange={onOpenChange} modal={false}>
        <PopoverAnchor asChild>
          <div
            role="button"
            tabIndex={0}
            className={cn(
              CARD_WIDTH_CLASS,
              shellClass,
              "cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f5e5e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f9f8]"
            )}
            aria-expanded={popoverOpen}
            aria-haspopup="dialog"
            aria-label={`${row.kind === "gainer" ? "Gainer" : "Loser"} ${row.symbol}, ${row.name}. Tap for AI move context.`}
            onClick={() => {
              const next = !popoverOpen
              onOpenChange(next)
              if (next) {
                onRequestExplain(row)
              } else {
                onCancelPendingExplain()
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                const next = !popoverOpen
                onOpenChange(next)
                if (next) onRequestExplain(row)
              }
            }}
          >
            <MoverCardFace row={row} />
          </div>
        </PopoverAnchor>
        <MoverExplainBody
          row={row}
          explanation={explanation}
          loading={loading}
          error={error}
          onRetry={handleRetry}
          onPointerEnterContent={onPopoverPointerEnter}
          onPointerLeaveContent={onPopoverPointerLeave}
        />
      </Popover>
    )
  }

  return (
    <Popover open={popoverOpen} onOpenChange={onOpenChange} modal={false}>
      <PopoverAnchor asChild>
        <Link
          href={`/stock/${encodeURIComponent(row.symbol)}`}
          className={cn(
            CARD_WIDTH_CLASS,
            shellClass,
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f5e5e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f9f8]"
          )}
          aria-label={`${row.kind === "gainer" ? "Gainer" : "Loser"} ${row.symbol}, ${row.name}`}
          onPointerEnter={() => {
            onOpenChange(true)
            onRequestExplain(row)
          }}
          onPointerLeave={() => {
            onCancelPendingExplain()
          }}
        >
          <MoverCardFace row={row} />
        </Link>
      </PopoverAnchor>
      <MoverExplainBody
        row={row}
        explanation={explanation}
        loading={loading}
        error={error}
        onRetry={handleRetry}
        onPointerEnterContent={onPopoverPointerEnter}
        onPointerLeaveContent={onPopoverPointerLeave}
      />
    </Popover>
  )
}

/** G0, L0, G1, L1, … then any tail from the longer list. */
const interleaveGainersLosers = (gainers: MoverRow[], losers: MoverRow[]): MoverRow[] => {
  const out: MoverRow[] = []
  const n = Math.max(gainers.length, losers.length)
  for (let i = 0; i < n; i++) {
    if (i < gainers.length) {
      out.push(gainers[i])
    }
    if (i < losers.length) {
      out.push(losers[i])
    }
  }
  return out
}

type MoversCarouselProps = {
  gainers: MoverRow[]
  losers: MoverRow[]
}

const MoverCardDuplicate = ({ row }: { row: MoverRow }) => {
  const shellClass = cn(
    "flex h-full min-h-[132px] shrink-0 flex-col rounded-xl border border-[#adb3b2]/20 bg-white p-4",
    "shadow-sm shadow-[#2d3433]/5 transition-colors",
    "select-none"
  )
  return (
    <div
      className={cn(CARD_WIDTH_CLASS, shellClass)}
      aria-hidden
      role="presentation"
    >
      <MoverCardFace row={row} duplicate />
    </div>
  )
}

export const MoversCarousel = ({ gainers, losers }: MoversCarouselProps) => {
  const items = React.useMemo(
    () => interleaveGainersLosers(gainers, losers),
    [gainers, losers]
  )

  const fineHover = useFineHover()
  const [reduceMotion, setReduceMotion] = React.useState(false)
  const firstStripRef = React.useRef<HTMLDivElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const [stripPx, setStripPx] = React.useState<number | null>(null)

  const [popoverKey, setPopoverKey] = React.useState<string | null>(null)
  const [explanationsByKey, setExplanationsByKey] = React.useState<
    Record<string, ExplainMoveResponse>
  >({})
  const [loadingByKey, setLoadingByKey] = React.useState<Record<string, boolean>>({})
  const [errorByKey, setErrorByKey] = React.useState<Record<string, string | null>>({})

  const explanationsRef = React.useRef(explanationsByKey)
  explanationsRef.current = explanationsByKey

  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveGraceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const fetchAbortRef = React.useRef<AbortController | null>(null)
  const inFlightRef = React.useRef<Set<string>>(new Set())
  const pointerInsidePopoverRef = React.useRef(false)

  const clearDebounce = React.useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
  }, [])

  const clearLeaveGrace = React.useCallback(() => {
    if (leaveGraceTimerRef.current) {
      clearTimeout(leaveGraceTimerRef.current)
      leaveGraceTimerRef.current = null
    }
  }, [])

  const scheduleClose = React.useCallback(() => {
    clearLeaveGrace()
    leaveGraceTimerRef.current = setTimeout(() => {
      leaveGraceTimerRef.current = null
      if (pointerInsidePopoverRef.current) return
      setPopoverKey(null)
      fetchAbortRef.current?.abort()
      fetchAbortRef.current = null
    }, LEAVE_GRACE_MS)
  }, [clearLeaveGrace])

  const runFetch = React.useCallback(async (row: MoverRow) => {
      const key = rowKey(row)
      if (inFlightRef.current.has(key)) return
      if (explanationsRef.current[key]) return

      inFlightRef.current.add(key)
      setLoadingByKey((m) => ({ ...m, [key]: true }))
      setErrorByKey((m) => ({ ...m, [key]: null }))

      const ac = new AbortController()
      fetchAbortRef.current = ac

      const body = {
        symbol: row.symbol,
        companyName: row.name,
        direction: row.kind === "gainer" ? ("gainer" as const) : ("loser" as const),
        price: row.price ?? 0,
        change: row.change ?? 0,
        changesPercentage: row.changePct ?? 0,
        exchange: row.exchange,
      }

      try {
        const res = await fetch("/api/stocks/explain-move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: ac.signal,
        })
        const json: unknown = await res.json().catch(() => null)
        if (!res.ok) {
          const msg =
            json &&
            typeof json === "object" &&
            "error" in json &&
            typeof (json as { error?: string }).error === "string"
              ? (json as { error: string }).error
              : "Couldn’t generate explanation right now."
          setErrorByKey((m) => ({ ...m, [key]: msg }))
          return
        }
        setExplanationsByKey((m) => ({ ...m, [key]: json as ExplainMoveResponse }))
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          return
        }
        setErrorByKey((m) => ({
          ...m,
          [key]: "Couldn’t generate explanation right now.",
        }))
      } finally {
        inFlightRef.current.delete(key)
        setLoadingByKey((m) => ({ ...m, [key]: false }))
        if (fetchAbortRef.current === ac) {
          fetchAbortRef.current = null
        }
      }
  }, [])

  const handleRequestExplain = React.useCallback(
    (row: MoverRow) => {
      const key = rowKey(row)
      clearDebounce()
      clearLeaveGrace()

      if (explanationsRef.current[key]) {
        return
      }
      if (inFlightRef.current.has(key)) {
        return
      }

      if (!fineHover) {
        void runFetch(row)
        return
      }

      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null
        void runFetch(row)
      }, DEBOUNCE_MS)
    },
    [clearDebounce, clearLeaveGrace, fineHover, runFetch]
  )

  const handleCancelPendingExplain = React.useCallback(() => {
    clearDebounce()
    if (!fineHover) return
    scheduleClose()
  }, [clearDebounce, fineHover, scheduleClose])

  const handlePopoverOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        pointerInsidePopoverRef.current = false
        clearDebounce()
        clearLeaveGrace()
        fetchAbortRef.current?.abort()
        fetchAbortRef.current = null
        setPopoverKey(null)
      }
    },
    [clearDebounce, clearLeaveGrace]
  )

  const handleRetry = React.useCallback(
    (row: MoverRow) => {
      const key = rowKey(row)
      setExplanationsByKey((m) => {
        const next = { ...m }
        delete next[key]
        return next
      })
      setErrorByKey((m) => ({ ...m, [key]: null }))
      void runFetch(row)
    },
    [runFetch]
  )

  const handlePopoverPointerEnter = React.useCallback(() => {
    pointerInsidePopoverRef.current = true
    clearLeaveGrace()
  }, [clearLeaveGrace])

  const handlePopoverPointerLeave = React.useCallback(() => {
    pointerInsidePopoverRef.current = false
    scheduleClose()
  }, [scheduleClose])

  const measureStrip = React.useCallback(() => {
    const strip1 = firstStripRef.current
    const track = trackRef.current
    if (!strip1 || !track) return
    const gapRaw = getComputedStyle(track).gap
    const gapPx = Number.parseFloat(gapRaw) || 12
    const w = strip1.offsetWidth + gapPx
    if (w > 0) setStripPx(w)
  }, [])

  React.useLayoutEffect(() => {
    measureStrip()
  }, [measureStrip, items])

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduceMotion(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  React.useEffect(() => {
    if (reduceMotion) return
    const ro = new ResizeObserver(() => measureStrip())
    const track = trackRef.current
    const strip1 = firstStripRef.current
    if (track) ro.observe(track)
    if (strip1) ro.observe(strip1)
    return () => ro.disconnect()
  }, [measureStrip, reduceMotion, items.length])

  React.useEffect(() => {
    return () => {
      clearDebounce()
      clearLeaveGrace()
      fetchAbortRef.current?.abort()
    }
  }, [clearDebounce, clearLeaveGrace])

  /** Slower scroll: longer duration scales with list size. */
  const durationSec = React.useMemo(() => {
    return Math.min(520, Math.max(160, items.length * 18))
  }, [items.length])

  /** True while the pointer is anywhere over the scrolling track (cards, gaps, duplicate strip). */
  const [isPointerOverTrack, setIsPointerOverTrack] = React.useState(false)
  const isAnimationPaused = isPointerOverTrack || popoverKey !== null

  const shiftVar = stripPx !== null ? `${-stripPx}px` : "-50%"

  if (items.length === 0) {
    return (
      <p className="px-4 text-center text-sm text-zinc-500">No mover data to show right now.</p>
    )
  }

  const edgeFade = (
    <>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#f9f9f8] via-[#f9f9f8]/85 to-transparent sm:w-24 md:w-32"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#f9f9f8] via-[#f9f9f8]/85 to-transparent sm:w-24 md:w-32"
        aria-hidden
      />
    </>
  )

  const renderInteractiveCard = (row: MoverRow, index: number, prefix: string) => {
    const key = rowKey(row)
    return (
      <InteractiveMoverCard
        key={`${prefix}-${key}-${index}`}
        row={row}
        popoverOpen={popoverKey === key}
        explanation={explanationsByKey[key] ?? null}
        loading={Boolean(loadingByKey[key])}
        error={errorByKey[key] ?? null}
        fineHover={fineHover}
        onOpenChange={(open) => {
          if (open) {
            setPopoverKey(key)
            return
          }
          handlePopoverOpenChange(false)
        }}
        onRequestExplain={(r) => {
          setPopoverKey(rowKey(r))
          handleRequestExplain(r)
        }}
        onCancelPendingExplain={handleCancelPendingExplain}
        onPopoverPointerEnter={handlePopoverPointerEnter}
        onPopoverPointerLeave={handlePopoverPointerLeave}
        onRetry={handleRetry}
      />
    )
  }

  if (reduceMotion) {
    return (
      <div
        className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden"
        role="region"
        aria-label="Biggest stock gainers and losers"
      >
        {edgeFade}
        <div
          className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          tabIndex={0}
        >
          <div className="flex w-max gap-3 px-4 py-1 sm:px-6">
            {items.map((row, index) => renderInteractiveCard(row, index, "rm"))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden"
      role="region"
      aria-label="Biggest stock gainers and losers, auto-scrolling"
    >
      {edgeFade}
      <div
        ref={trackRef}
        className="movers-marquee-track flex w-max shrink-0 gap-3 px-4 py-1 will-change-transform sm:px-6"
        onPointerEnter={() => setIsPointerOverTrack(true)}
        onPointerLeave={() => setIsPointerOverTrack(false)}
        style={
          {
            "--movers-shift": shiftVar,
            "--movers-duration": `${durationSec}s`,
            "--movers-play-state": isAnimationPaused ? "paused" : "running",
          } as React.CSSProperties
        }
      >
        <div ref={firstStripRef} className="flex shrink-0 gap-3">
          {items.map((row, index) => renderInteractiveCard(row, index, "a"))}
        </div>
        <div className="flex shrink-0 gap-3" inert aria-hidden>
          {items.map((row, index) => (
            <MoverCardDuplicate key={`dup-${index}-${row.kind}-${row.symbol}`} row={row} />
          ))}
        </div>
      </div>
    </div>
  )
}
