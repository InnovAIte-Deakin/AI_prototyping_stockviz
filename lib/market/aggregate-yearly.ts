import type { OhlcPoint } from "@/lib/market/yahoo-finance";

/** Calendar-year OHLCV aggregated from monthly bars, sorted ascending by year. */
export type YearlyOhlcPoint = {
  year: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const yearFromDate = (date: string): string => {
  const y = date.slice(0, 4);
  return y.length === 4 ? y : date;
};

export const aggregateMonthlyToYearly = (
  monthly: OhlcPoint[],
): YearlyOhlcPoint[] => {
  if (monthly.length === 0) {
    return [];
  }

  const byYear = new Map<string, OhlcPoint[]>();

  for (const m of monthly) {
    const y = yearFromDate(m.date);
    const list = byYear.get(y);
    if (list) {
      list.push(m);
    } else {
      byYear.set(y, [m]);
    }
  }

  const years = [...byYear.keys()].sort((a, b) => a.localeCompare(b));
  const result: YearlyOhlcPoint[] = [];

  for (const year of years) {
    const months = byYear.get(year);
    if (!months || months.length === 0) {
      continue;
    }
    months.sort((a, b) => a.date.localeCompare(b.date));

    const open = months[0].open;
    const close = months[months.length - 1].close;
    let high = -Infinity;
    let low = Infinity;
    let volume = 0;

    for (const m of months) {
      high = Math.max(high, m.high);
      low = Math.min(low, m.low);
      volume += m.volume;
    }

    if (!Number.isFinite(high) || !Number.isFinite(low)) {
      continue;
    }

    result.push({
      year,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  return result;
};
