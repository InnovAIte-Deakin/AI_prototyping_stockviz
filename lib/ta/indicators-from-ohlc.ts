import type { AlphaVantageOhlcPoint } from "@/lib/alphavantage/parse-time-series"

/** One row per input bar; leading entries may contain nulls where undefined. */
export type TaBar = {
  date: string
  close: number
  sma20: number | null
  sma50: number | null
  ema12: number | null
  ema26: number | null
  bbUpper: number | null
  bbMiddle: number | null
  bbLower: number | null
  rsi14: number | null
  macdLine: number | null
  macdSignal: number | null
  macdHist: number | null
  atr14: number | null
  obv: number | null
}

const smaAt = (closes: number[], index: number, period: number): number | null => {
  if (index + 1 < period) return null
  let s = 0
  for (let i = index - period + 1; i <= index; i++) {
    s += closes[i]
  }
  return s / period
}

const stdevAt = (closes: number[], index: number, period: number): number | null => {
  if (index + 1 < period) return null
  const slice = closes.slice(index - period + 1, index + 1)
  const mean = slice.reduce((a, b) => a + b, 0) / period
  let v = 0
  for (const x of slice) {
    v += (x - mean) ** 2
  }
  return Math.sqrt(v / period)
}

/** EMA aligned to `closes[i]`; seeds with SMA when full window available. */
const buildEma = (closes: number[], period: number): (number | null)[] => {
  const out: (number | null)[] = closes.map(() => null)
  const k = 2 / (period + 1)
  let ema: number | null = null
  for (let i = 0; i < closes.length; i++) {
    const sma = smaAt(closes, i, period)
    if (ema === null) {
      if (sma !== null) {
        ema = sma
        out[i] = ema
      }
    } else {
      ema = (closes[i] - ema) * k + ema
      out[i] = ema
    }
  }
  return out
}

/** Wilder RSI (period 14). */
const buildRsi = (closes: number[], period: number): (number | null)[] => {
  const out: (number | null)[] = closes.map(() => null)
  if (closes.length < period + 1) return out

  let avgGain = 0
  let avgLoss = 0
  for (let i = 1; i <= period; i++) {
    const ch = closes[i] - closes[i - 1]
    if (ch >= 0) avgGain += ch
    else avgLoss += -ch
  }
  avgGain /= period
  avgLoss /= period

  const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss
  out[period] = 100 - 100 / (1 + rs)

  for (let i = period + 1; i < closes.length; i++) {
    const ch = closes[i] - closes[i - 1]
    const gain = ch > 0 ? ch : 0
    const loss = ch < 0 ? -ch : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    const rsI = avgLoss === 0 ? Infinity : avgGain / avgLoss
    out[i] = 100 - 100 / (1 + rsI)
  }
  return out
}

/** Wilder ATR (period 14). */
const buildAtr = (points: AlphaVantageOhlcPoint[], period: number): (number | null)[] => {
  const out: (number | null)[] = points.map(() => null)
  if (points.length < period + 1) return out

  const tr: number[] = []
  for (let i = 0; i < points.length; i++) {
    if (i === 0) {
      tr.push(points[i].high - points[i].low)
    } else {
      const h = points[i].high
      const l = points[i].low
      const pc = points[i - 1].close
      tr.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)))
    }
  }

  let atr = 0
  for (let i = 1; i <= period; i++) {
    atr += tr[i]
  }
  atr /= period
  out[period] = atr

  for (let i = period + 1; i < points.length; i++) {
    atr = (atr * (period - 1) + tr[i]) / period
    out[i] = atr
  }
  return out
}

const buildObv = (points: AlphaVantageOhlcPoint[]): (number | null)[] => {
  const out: (number | null)[] = points.map(() => null)
  if (points.length === 0) return out
  let obv = 0
  out[0] = obv
  for (let i = 1; i < points.length; i++) {
    if (points[i].close > points[i - 1].close) {
      obv += points[i].volume
    } else if (points[i].close < points[i - 1].close) {
      obv -= points[i].volume
    }
    out[i] = obv
  }
  return out
}

/**
 * Computes common indicators from daily (or any) OHLC bars, oldest first,
 * matching definitions widely used in technical analysis literature.
 */
export const computeTaFromOhlc = (points: AlphaVantageOhlcPoint[]): TaBar[] => {
  if (points.length === 0) return []

  const closes = points.map((p) => p.close)
  const sma20 = closes.map((_, i) => smaAt(closes, i, 20))
  const sma50 = closes.map((_, i) => smaAt(closes, i, 50))
  const ema12 = buildEma(closes, 12)
  const ema26 = buildEma(closes, 26)

  const macdLineSeries: (number | null)[] = closes.map((_, i) => {
    const a = ema12[i]
    const b = ema26[i]
    if (a === null || b === null) return null
    return a - b
  })

  const macdSignalArr: (number | null)[] = closes.map(() => null)
  const macdVals: number[] = []
  const macdValIndex: number[] = []
  for (let i = 0; i < macdLineSeries.length; i++) {
    const m = macdLineSeries[i]
    if (m !== null) {
      macdVals.push(m)
      macdValIndex.push(i)
    }
  }
  if (macdVals.length > 0) {
    const signalOnMacd = buildEma(macdVals, 9)
    for (let j = 0; j < macdValIndex.length; j++) {
      macdSignalArr[macdValIndex[j]] = signalOnMacd[j]
    }
  }

  const macdHist: (number | null)[] = macdLineSeries.map((line, i) => {
    const sig = macdSignalArr[i]
    if (line === null || sig === null) return null
    return line - sig
  })

  const bbUpper: (number | null)[] = closes.map((_, i) => {
    const mid = sma20[i]
    const sd = stdevAt(closes, i, 20)
    if (mid === null || sd === null) return null
    return mid + 2 * sd
  })
  const bbLower: (number | null)[] = closes.map((_, i) => {
    const mid = sma20[i]
    const sd = stdevAt(closes, i, 20)
    if (mid === null || sd === null) return null
    return mid - 2 * sd
  })

  const rsi14 = buildRsi(closes, 14)
  const atr14 = buildAtr(points, 14)
  const obv = buildObv(points)

  return points.map((p, i) => ({
    date: p.date,
    close: p.close,
    sma20: sma20[i],
    sma50: sma50[i],
    ema12: ema12[i],
    ema26: ema26[i],
    bbUpper: bbUpper[i],
    bbMiddle: sma20[i],
    bbLower: bbLower[i],
    rsi14: rsi14[i],
    macdLine: macdLineSeries[i],
    macdSignal: macdSignalArr[i],
    macdHist: macdHist[i],
    atr14: atr14[i],
    obv: obv[i],
  }))
}
