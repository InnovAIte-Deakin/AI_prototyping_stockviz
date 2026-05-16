import type { RangeDirection } from "@/lib/stocks/explain-range-schema"

import type { PriceHistoryTab } from "@/hooks/use-alpha-vantage-series"

export type ChartBarForRange = {
  period: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export type SelectedRangePayload = {
  from: string
  to: string
  startClose: number
  endClose: number
  absoluteChange: number
  percentageChange: number
  direction: RangeDirection
  highestClose?: number
  lowestClose?: number
  biggestUpDay?: {
    date: string
    percentageChange: number
    close: number
  }
  biggestDownDay?: {
    date: string
    percentageChange: number
    close: number
  }
  volumeSpikes?: Array<{
    date: string
    volume: number
    close: number
  }>
}

const directionFromPct = (percentageChange: number): RangeDirection => {
  if (percentageChange > 0.25) return "up"
  if (percentageChange < -0.25) return "down"
  return "flat"
}

const periodToIsoDate = (period: string, isYearOnly: boolean): string => {
  if (isYearOnly) {
    return `${period.slice(0, 4)}-01-01`
  }
  if (/^\d{4}$/.test(period)) {
    return `${period}-01-01`
  }
  if (/^\d{4}-\d{2}$/.test(period)) {
    return `${period}-01`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    return period
  }
  const d = new Date(`${period}T12:00:00Z`)
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10)
  }
  return period
}

const computeVolumeSpikes = (
  slice: ChartBarForRange[]
): SelectedRangePayload["volumeSpikes"] | undefined => {
  const withVol = slice.filter(
    (b) => typeof b.volume === "number" && Number.isFinite(b.volume) && b.volume > 0
  )
  if (withVol.length < 3) {
    return undefined
  }
  const volumes = withVol.map((b) => b.volume as number)
  const sorted = [...volumes].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  if (!median || median <= 0) {
    return undefined
  }
  const threshold = median * 1.85
  const spikes = withVol
    .filter((b) => (b.volume as number) >= threshold)
    .sort((a, b) => (b.volume as number) - (a.volume as number))
    .slice(0, 5)
    .map((b) => ({
      date: b.period,
      volume: b.volume as number,
      close: b.close,
    }))
  return spikes.length > 0 ? spikes : undefined
}

/** Stable string key for comparing a chart `period` to user date inputs. */
export const rowPeriodSortKey = (
  period: string,
  tab: PriceHistoryTab
): string => {
  if (tab === "yearly") {
    return period.slice(0, 4).padEnd(4, "0")
  }
  if (tab === "monthly") {
    return period.slice(0, 7)
  }
  return period.slice(0, 10)
}

const normalizeUserFromKey = (iso: string, tab: PriceHistoryTab): string => {
  if (tab === "yearly") {
    return iso.slice(0, 4)
  }
  if (tab === "monthly") {
    return iso.slice(0, 7)
  }
  return iso.slice(0, 10)
}

const normalizeUserToKey = (iso: string, tab: PriceHistoryTab): string => {
  if (tab === "yearly") {
    return iso.slice(0, 4)
  }
  if (tab === "monthly") {
    return iso.slice(0, 7)
  }
  return iso.slice(0, 10)
}

/**
 * Maps manual from/to date strings (from `<input type="date">` / month fields) to inclusive row indices.
 */
export const findChartIndicesForUserDates = (
  chartData: ChartBarForRange[],
  tab: PriceHistoryTab,
  fromIso: string,
  toIso: string
): { start: number; end: number } | null => {
  const fk = normalizeUserFromKey(fromIso, tab)
  const tk = normalizeUserToKey(toIso, tab)
  if (!fk || !tk || fk > tk) {
    return null
  }
  let start = -1
  let end = -1
  for (let i = 0; i < chartData.length; i++) {
    const k = rowPeriodSortKey(chartData[i].period, tab)
    if (k >= fk && k <= tk) {
      if (start === -1) {
        start = i
      }
      end = i
    }
  }
  if (start === -1 || end === -1 || end < start) {
    return null
  }
  return { start, end }
}

/**
 * Computes OHLC path stats for a contiguous index range on chart data (oldest → newest order).
 * `isYearlyTab` maps period labels (calendar years) to stable ISO `from`/`to` bounds.
 */
export const computeSelectedRangeStats = (
  chartData: ChartBarForRange[],
  startIndex: number,
  endIndex: number,
  isYearlyTab: boolean
): SelectedRangePayload | null => {
  const lo = Math.min(startIndex, endIndex)
  const hi = Math.max(startIndex, endIndex)
  if (lo < 0 || hi >= chartData.length || lo === hi) {
    return null
  }
  const slice = chartData.slice(lo, hi + 1)
  if (slice.length < 2) {
    return null
  }

  const first = slice[0]
  const last = slice[slice.length - 1]
  const startClose = first.close
  const endClose = last.close
  if (!Number.isFinite(startClose) || !Number.isFinite(endClose) || startClose <= 0) {
    return null
  }

  const absoluteChange = endClose - startClose
  const percentageChange = ((endClose - startClose) / startClose) * 100
  const direction = directionFromPct(percentageChange)

  let highestClose = -Infinity
  let lowestClose = Infinity
  for (const b of slice) {
    highestClose = Math.max(highestClose, b.close)
    lowestClose = Math.min(lowestClose, b.close)
  }

  let biggestUpDay: SelectedRangePayload["biggestUpDay"]
  let biggestDownDay: SelectedRangePayload["biggestDownDay"]
  let bestUp = -Infinity
  let bestDown = Infinity

  for (let i = 1; i < slice.length; i++) {
    const prev = slice[i - 1].close
    const cur = slice[i].close
    if (!Number.isFinite(prev) || prev <= 0) {
      continue
    }
    const pct = ((cur - prev) / prev) * 100
    if (pct > 0 && pct > bestUp) {
      bestUp = pct
      biggestUpDay = {
        date: slice[i].period,
        percentageChange: pct,
        close: cur,
      }
    }
    if (pct < 0 && pct < bestDown) {
      bestDown = pct
      biggestDownDay = {
        date: slice[i].period,
        percentageChange: pct,
        close: cur,
      }
    }
  }

  const fromRaw = first.period
  const toRaw = last.period
  let from = periodToIsoDate(fromRaw, isYearlyTab)
  let to = periodToIsoDate(toRaw, isYearlyTab)
  if (isYearlyTab) {
    const yEnd = toRaw.slice(0, 4)
    to = `${yEnd}-12-31`
  } else if (/^\d{4}-\d{2}$/.test(toRaw)) {
    const d = new Date(`${toRaw}-01T12:00:00Z`)
    const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))
    to = lastDay.toISOString().slice(0, 10)
  }

  if (from > to) {
    ;[from, to] = [to, from]
  }

  const volumeSpikes = computeVolumeSpikes(slice)

  return {
    from,
    to,
    startClose,
    endClose,
    absoluteChange,
    percentageChange,
    direction,
    highestClose: Number.isFinite(highestClose) ? highestClose : undefined,
    lowestClose: Number.isFinite(lowestClose) ? lowestClose : undefined,
    biggestUpDay,
    biggestDownDay,
    volumeSpikes,
  }
}
