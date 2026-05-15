import { describe, expect, it } from "vitest";

import { computeTaFromOhlc } from "@/lib/ta/indicators-from-ohlc";

const bars = Array.from({ length: 60 }, (_, index) => ({
  date: `2026-03-${String((index % 28) + 1).padStart(2, "0")}`,
  open: 100 + index,
  high: 101 + index,
  low: 99 + index,
  close: 100 + index,
  volume: 1000 + index,
}));

describe("computeTaFromOhlc", () => {
  it("computes late-series indicators once enough bars exist", () => {
    const rows = computeTaFromOhlc(bars);
    const latest = rows.at(-1);

    expect(latest?.sma20).toBeGreaterThan(0);
    expect(latest?.sma50).toBeGreaterThan(0);
    expect(latest?.rsi14).toBeGreaterThanOrEqual(0);
    expect(latest?.macdLine).not.toBeNull();
    expect(latest?.obv).not.toBeNull();
  });
});
