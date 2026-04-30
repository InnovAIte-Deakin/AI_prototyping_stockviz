"use client"

import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import type { MoverRow } from "@/lib/fmp/biggest-movers"

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

type MoverCardProps = {
  row: MoverRow
  /** Duplicate strip: same visuals, no focus (inert wrapper). */
  duplicate?: boolean
}

const MoverCard = ({ row, duplicate = false }: MoverCardProps) => {
  const isGainer = row.kind === "gainer"
  const accent = isGainer ? "text-emerald-400" : "text-rose-400"
  const badgeBg = isGainer
    ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
    : "bg-rose-500/15 text-rose-300 ring-rose-500/30"

  const inner = (
    <>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-mono text-lg font-semibold tracking-tight text-white">
            {row.symbol}
          </p>
          <p className="line-clamp-2 text-xs leading-snug text-zinc-400">{row.name}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
            badgeBg
          )}
        >
          {isGainer ? "Gainer" : "Loser"}
        </span>
      </div>
      <div className="mt-auto flex flex-wrap items-end justify-between gap-2 border-t border-zinc-800/80 pt-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Last</p>
          <p className="text-sm font-medium tabular-nums text-zinc-100">${formatPrice(row.price)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Chg / %</p>
          <p className={cn("text-sm font-semibold tabular-nums", accent)}>
            {formatDollarChange(row.change)}{" "}
            <span className="text-xs font-medium">({formatPct(row.changePct)})</span>
          </p>
        </div>
      </div>
      {row.exchange ? (
        <p className="mt-2 truncate text-[10px] text-zinc-600">{row.exchange}</p>
      ) : null}
    </>
  )

  const shellClass = cn(
    "flex h-full min-h-[132px] shrink-0 flex-col rounded-xl border border-zinc-800 bg-zinc-950/90 p-4",
    "shadow-sm shadow-black/40 transition-colors",
    duplicate
      ? "select-none"
      : "hover:border-zinc-600 hover:bg-zinc-900/90 focus-within:border-zinc-600 focus-within:bg-zinc-900/90"
  )

  if (duplicate) {
    return (
      <div className={cn(CARD_WIDTH_CLASS, shellClass)} aria-hidden role="presentation">
        {inner}
      </div>
    )
  }

  return (
    <Link
      href={`/stock/${encodeURIComponent(row.symbol)}`}
      className={cn(
        CARD_WIDTH_CLASS,
        shellClass,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      )}
      aria-label={`${isGainer ? "Gainer" : "Loser"} ${row.symbol}, ${row.name}`}
    >
      {inner}
    </Link>
  )
}

type MoversCarouselProps = {
  gainers: MoverRow[]
  losers: MoverRow[]
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

export const MoversCarousel = ({ gainers, losers }: MoversCarouselProps) => {
  const items = React.useMemo(
    () => interleaveGainersLosers(gainers, losers),
    [gainers, losers]
  )

  const [reduceMotion, setReduceMotion] = React.useState(false)
  const firstStripRef = React.useRef<HTMLDivElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const [stripPx, setStripPx] = React.useState<number | null>(null)

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

  /** Slower scroll: longer duration scales with list size. */
  const durationSec = React.useMemo(() => {
    return Math.min(520, Math.max(160, items.length * 18))
  }, [items.length])

  if (items.length === 0) {
    return (
      <p className="px-4 text-center text-sm text-zinc-500">No mover data to show right now.</p>
    )
  }

  const edgeFade = (
    <>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-black via-black/85 to-transparent sm:w-24 md:w-32"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-black via-black/85 to-transparent sm:w-24 md:w-32"
        aria-hidden
      />
    </>
  )

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
            {items.map((row, index) => (
              <MoverCard key={`${row.kind}-${row.symbol}-${index}`} row={row} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const shiftVar =
    stripPx !== null ? `${-stripPx}px` : "-50%"

  return (
    <div
      className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden"
      role="region"
      aria-label="Biggest stock gainers and losers, auto-scrolling"
    >
      {edgeFade}
      <div
        ref={trackRef}
        className={cn(
          "flex w-max shrink-0 gap-3 px-4 py-1 will-change-transform sm:px-6",
          "hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]"
        )}
        style={
          {
            "--movers-shift": shiftVar,
            animation: `movers-marquee-x ${durationSec}s linear infinite`,
          } as React.CSSProperties
        }
      >
        <div ref={firstStripRef} className="flex shrink-0 gap-3">
          {items.map((row, index) => (
            <MoverCard key={`a-${row.kind}-${row.symbol}-${index}`} row={row} />
          ))}
        </div>
        <div className="flex shrink-0 gap-3" inert aria-hidden>
          {items.map((row, index) => (
            <MoverCard key={`b-${row.kind}-${row.symbol}-${index}`} row={row} duplicate />
          ))}
        </div>
      </div>
    </div>
  )
}
