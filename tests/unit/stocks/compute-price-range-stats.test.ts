import { describe, expect, it } from "vitest";

import { computeSelectedRangeStats } from "@/lib/stocks/compute-price-range-stats";

const rows = [
  {
    period: "2026-05-01",
    open: 100,
    high: 103,
    low: 98,
    close: 100,
    volume: 1000,
  },
  {
    period: "2026-05-02",
    open: 100,
    high: 111,
    low: 99,
    close: 110,
    volume: 2500,
  },
  {
    period: "2026-05-03",
    open: 110,
    high: 112,
    low: 104,
    close: 105,
    volume: 900,
  },
];

describe("computeSelectedRangeStats", () => {
  it("computes change, direction, highs, lows, and volume spikes", () => {
    const stats = computeSelectedRangeStats(rows, 0, 2, false);

    expect(stats?.from).toBe("2026-05-01");
    expect(stats?.to).toBe("2026-05-03");
    expect(stats?.absoluteChange).toBe(5);
    expect(stats?.percentageChange).toBe(5);
    expect(stats?.direction).toBe("up");
    expect(stats?.highestClose).toBe(110);
    expect(stats?.lowestClose).toBe(100);
  });
});
