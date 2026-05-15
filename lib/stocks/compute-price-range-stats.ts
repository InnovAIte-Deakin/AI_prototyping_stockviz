import type { PriceHistoryTab } from "@/hooks/use-price-series";
import type { RangeDirection } from "@/lib/stocks/explain-range-schema";

export type ChartBarForRange = {
  period: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type SelectedRangePayload = {
  from: string;
  to: string;
  startClose: number;
  endClose: number;
  absoluteChange: number;
  percentageChange: number;
  direction: RangeDirection;
  highestClose?: number;
  lowestClose?: number;
  biggestUpDay?: {
    date: string;
    percentageChange: number;
    close: number;
  };
  biggestDownDay?: {
    date: string;
    percentageChange: number;
    close: number;
  };
  volumeSpikes?: Array<{
    date: string;
    volume: number;
    close: number;
  }>;
};

const directionFromPercentage = (
  percentageChange: number,
): RangeDirection => {
  if (percentageChange > 0.25) return "up";
  if (percentageChange < -0.25) return "down";
  return "flat";
};

const periodToIsoDate = (period: string, isYearOnly: boolean): string => {
  if (isYearOnly) {
    return `${period.slice(0, 4)}-01-01`;
  }
  if (/^\d{4}$/.test(period)) {
    return `${period}-01-01`;
  }
  if (/^\d{4}-\d{2}$/.test(period)) {
    return `${period}-01`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    return period;
  }

  const date = new Date(`${period}T12:00:00Z`);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10);
  }

  return period;
};

const computeVolumeSpikes = (
  slice: ChartBarForRange[],
): SelectedRangePayload["volumeSpikes"] | undefined => {
  const withVolume = slice.filter(
    (bar) =>
      typeof bar.volume === "number" &&
      Number.isFinite(bar.volume) &&
      bar.volume > 0,
  );

  if (withVolume.length < 3) return undefined;

  const volumes = withVolume.map((bar) => bar.volume as number);
  const sorted = [...volumes].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  if (!median || median <= 0) return undefined;

  const threshold = median * 1.85;
  const spikes = withVolume
    .filter((bar) => (bar.volume as number) >= threshold)
    .sort((a, b) => (b.volume as number) - (a.volume as number))
    .slice(0, 5)
    .map((bar) => ({
      close: bar.close,
      date: bar.period,
      volume: bar.volume as number,
    }));

  return spikes.length > 0 ? spikes : undefined;
};

export const rowPeriodSortKey = (
  period: string,
  tab: PriceHistoryTab,
): string => {
  if (tab === "yearly") {
    return period.slice(0, 4).padEnd(4, "0");
  }
  if (tab === "monthly") {
    return period.slice(0, 7);
  }
  return period.slice(0, 10);
};

const normalizeUserDateKey = (
  iso: string,
  tab: PriceHistoryTab,
): string => {
  if (tab === "yearly") return iso.slice(0, 4);
  if (tab === "monthly") return iso.slice(0, 7);
  return iso.slice(0, 10);
};

export const findChartIndicesForUserDates = (
  chartData: ChartBarForRange[],
  tab: PriceHistoryTab,
  fromIso: string,
  toIso: string,
): { start: number; end: number } | null => {
  const fromKey = normalizeUserDateKey(fromIso, tab);
  const toKey = normalizeUserDateKey(toIso, tab);
  if (!fromKey || !toKey || fromKey > toKey) {
    return null;
  }

  let start = -1;
  let end = -1;

  for (let i = 0; i < chartData.length; i += 1) {
    const key = rowPeriodSortKey(chartData[i].period, tab);
    if (key >= fromKey && key <= toKey) {
      if (start === -1) start = i;
      end = i;
    }
  }

  if (start === -1 || end === -1 || end < start) {
    return null;
  }

  return { end, start };
};

export const computeSelectedRangeStats = (
  chartData: ChartBarForRange[],
  startIndex: number,
  endIndex: number,
  isYearlyTab: boolean,
): SelectedRangePayload | null => {
  const lo = Math.min(startIndex, endIndex);
  const hi = Math.max(startIndex, endIndex);
  if (lo < 0 || hi >= chartData.length || lo === hi) {
    return null;
  }

  const slice = chartData.slice(lo, hi + 1);
  if (slice.length < 2) return null;

  const first = slice[0];
  const last = slice[slice.length - 1];
  const startClose = first.close;
  const endClose = last.close;

  if (
    !Number.isFinite(startClose) ||
    !Number.isFinite(endClose) ||
    startClose <= 0
  ) {
    return null;
  }

  const absoluteChange = endClose - startClose;
  const percentageChange = ((endClose - startClose) / startClose) * 100;
  const direction = directionFromPercentage(percentageChange);

  let highestClose = -Infinity;
  let lowestClose = Infinity;

  for (const bar of slice) {
    highestClose = Math.max(highestClose, bar.close);
    lowestClose = Math.min(lowestClose, bar.close);
  }

  let biggestUpDay: SelectedRangePayload["biggestUpDay"];
  let biggestDownDay: SelectedRangePayload["biggestDownDay"];
  let bestUp = -Infinity;
  let bestDown = Infinity;

  for (let i = 1; i < slice.length; i += 1) {
    const previous = slice[i - 1].close;
    const current = slice[i].close;
    if (!Number.isFinite(previous) || previous <= 0) {
      continue;
    }

    const change = ((current - previous) / previous) * 100;
    if (change > 0 && change > bestUp) {
      bestUp = change;
      biggestUpDay = {
        close: current,
        date: slice[i].period,
        percentageChange: change,
      };
    }
    if (change < 0 && change < bestDown) {
      bestDown = change;
      biggestDownDay = {
        close: current,
        date: slice[i].period,
        percentageChange: change,
      };
    }
  }

  const fromRaw = first.period;
  const toRaw = last.period;
  let from = periodToIsoDate(fromRaw, isYearlyTab);
  let to = periodToIsoDate(toRaw, isYearlyTab);

  if (isYearlyTab) {
    to = `${toRaw.slice(0, 4)}-12-31`;
  } else if (/^\d{4}-\d{2}$/.test(toRaw)) {
    const date = new Date(`${toRaw}-01T12:00:00Z`);
    const lastDay = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
    );
    to = lastDay.toISOString().slice(0, 10);
  }

  if (from > to) {
    [from, to] = [to, from];
  }

  return {
    absoluteChange,
    biggestDownDay,
    biggestUpDay,
    direction,
    endClose,
    from,
    highestClose: Number.isFinite(highestClose) ? highestClose : undefined,
    lowestClose: Number.isFinite(lowestClose) ? lowestClose : undefined,
    percentageChange,
    startClose,
    to,
    volumeSpikes: computeVolumeSpikes(slice),
  };
};
