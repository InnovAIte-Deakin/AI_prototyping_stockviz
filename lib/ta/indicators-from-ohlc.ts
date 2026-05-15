export type OhlcInput = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type TaBar = {
  date: string;
  close: number;
  sma20: number | null;
  sma50: number | null;
  ema12: number | null;
  ema26: number | null;
  bbUpper: number | null;
  bbMiddle: number | null;
  bbLower: number | null;
  rsi14: number | null;
  macdLine: number | null;
  macdSignal: number | null;
  macdHist: number | null;
  atr14: number | null;
  obv: number | null;
};

const smaAt = (
  closes: number[],
  index: number,
  period: number,
): number | null => {
  if (index + 1 < period) return null;

  let sum = 0;
  for (let i = index - period + 1; i <= index; i += 1) {
    sum += closes[i];
  }
  return sum / period;
};

const stdevAt = (
  closes: number[],
  index: number,
  period: number,
): number | null => {
  if (index + 1 < period) return null;

  const slice = closes.slice(index - period + 1, index + 1);
  const mean = slice.reduce((sum, value) => sum + value, 0) / period;
  const variance =
    slice.reduce((sum, value) => sum + (value - mean) ** 2, 0) / period;

  return Math.sqrt(variance);
};

const buildEma = (closes: number[], period: number): Array<number | null> => {
  const out: Array<number | null> = closes.map(() => null);
  const multiplier = 2 / (period + 1);
  let ema: number | null = null;

  for (let i = 0; i < closes.length; i += 1) {
    const seed = smaAt(closes, i, period);
    if (ema === null) {
      if (seed !== null) {
        ema = seed;
        out[i] = ema;
      }
    } else {
      ema = (closes[i] - ema) * multiplier + ema;
      out[i] = ema;
    }
  }

  return out;
};

const buildRsi = (
  closes: number[],
  period: number,
): Array<number | null> => {
  const out: Array<number | null> = closes.map(() => null);
  if (closes.length < period + 1) return out;

  let averageGain = 0;
  let averageLoss = 0;
  for (let i = 1; i <= period; i += 1) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) {
      averageGain += change;
    } else {
      averageLoss += -change;
    }
  }

  averageGain /= period;
  averageLoss /= period;
  const initialRelativeStrength =
    averageLoss === 0 ? Infinity : averageGain / averageLoss;
  out[period] = 100 - 100 / (1 + initialRelativeStrength);

  for (let i = period + 1; i < closes.length; i += 1) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    averageGain = (averageGain * (period - 1) + gain) / period;
    averageLoss = (averageLoss * (period - 1) + loss) / period;

    const relativeStrength =
      averageLoss === 0 ? Infinity : averageGain / averageLoss;
    out[i] = 100 - 100 / (1 + relativeStrength);
  }

  return out;
};

const buildAtr = (
  points: OhlcInput[],
  period: number,
): Array<number | null> => {
  const out: Array<number | null> = points.map(() => null);
  if (points.length < period + 1) return out;

  const trueRanges: number[] = [];
  for (let i = 0; i < points.length; i += 1) {
    if (i === 0) {
      trueRanges.push(points[i].high - points[i].low);
    } else {
      const high = points[i].high;
      const low = points[i].low;
      const previousClose = points[i - 1].close;
      trueRanges.push(
        Math.max(
          high - low,
          Math.abs(high - previousClose),
          Math.abs(low - previousClose),
        ),
      );
    }
  }

  let atr = 0;
  for (let i = 1; i <= period; i += 1) {
    atr += trueRanges[i];
  }
  atr /= period;
  out[period] = atr;

  for (let i = period + 1; i < points.length; i += 1) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
    out[i] = atr;
  }

  return out;
};

const buildObv = (points: OhlcInput[]): Array<number | null> => {
  const out: Array<number | null> = points.map(() => null);
  if (points.length === 0) return out;

  let obv = 0;
  out[0] = obv;

  for (let i = 1; i < points.length; i += 1) {
    if (points[i].close > points[i - 1].close) {
      obv += points[i].volume;
    } else if (points[i].close < points[i - 1].close) {
      obv -= points[i].volume;
    }
    out[i] = obv;
  }

  return out;
};

export const computeTaFromOhlc = (points: OhlcInput[]): TaBar[] => {
  if (points.length === 0) return [];

  const closes = points.map((point) => point.close);
  const sma20 = closes.map((_, index) => smaAt(closes, index, 20));
  const sma50 = closes.map((_, index) => smaAt(closes, index, 50));
  const ema12 = buildEma(closes, 12);
  const ema26 = buildEma(closes, 26);

  const macdLine = closes.map((_, index) => {
    const fast = ema12[index];
    const slow = ema26[index];
    if (fast === null || slow === null) return null;
    return fast - slow;
  });

  const macdSignal: Array<number | null> = closes.map(() => null);
  const macdValues: number[] = [];
  const macdIndexes: number[] = [];

  for (let i = 0; i < macdLine.length; i += 1) {
    const value = macdLine[i];
    if (value !== null) {
      macdValues.push(value);
      macdIndexes.push(i);
    }
  }

  const signalValues = buildEma(macdValues, 9);
  for (let i = 0; i < macdIndexes.length; i += 1) {
    macdSignal[macdIndexes[i]] = signalValues[i];
  }

  const macdHist = macdLine.map((line, index) => {
    const signal = macdSignal[index];
    if (line === null || signal === null) return null;
    return line - signal;
  });

  const bbUpper = closes.map((_, index) => {
    const middle = sma20[index];
    const standardDeviation = stdevAt(closes, index, 20);
    if (middle === null || standardDeviation === null) return null;
    return middle + 2 * standardDeviation;
  });
  const bbLower = closes.map((_, index) => {
    const middle = sma20[index];
    const standardDeviation = stdevAt(closes, index, 20);
    if (middle === null || standardDeviation === null) return null;
    return middle - 2 * standardDeviation;
  });

  const rsi14 = buildRsi(closes, 14);
  const atr14 = buildAtr(points, 14);
  const obv = buildObv(points);

  return points.map((point, index) => ({
    date: point.date,
    close: point.close,
    sma20: sma20[index],
    sma50: sma50[index],
    ema12: ema12[index],
    ema26: ema26[index],
    bbUpper: bbUpper[index],
    bbMiddle: sma20[index],
    bbLower: bbLower[index],
    rsi14: rsi14[index],
    macdLine: macdLine[index],
    macdSignal: macdSignal[index],
    macdHist: macdHist[index],
    atr14: atr14[index],
    obv: obv[index],
  }));
};
