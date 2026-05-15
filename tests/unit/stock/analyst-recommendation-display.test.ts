import { describe, expect, it } from "vitest";

import {
  rowToChartDatum,
  sortRecommendationsChronologically,
  totalRecommendations,
} from "@/lib/analyst-recommendation-display";

describe("analyst recommendation display helpers", () => {
  it("sorts recommendations oldest to newest", () => {
    const rows = sortRecommendationsChronologically([
      { period: "2026-Q2", buy: 3 },
      { period: "2025-12-01", buy: 1 },
      { period: "2026-01", buy: 2 },
    ]);

    expect(rows.map((row) => row.period)).toEqual([
      "2025-12-01",
      "2026-01",
      "2026-Q2",
    ]);
  });

  it("totals recommendation counts and clamps invalid values", () => {
    const row = {
      strongBuy: 2,
      buy: 4,
      hold: 3,
      sell: -1,
      strongSell: Number.NaN,
    };

    expect(totalRecommendations(row)).toBe(9);
    expect(rowToChartDatum(row)).toMatchObject({
      buy: 4,
      hold: 3,
      periodLabel: " ",
      sell: 0,
      strongBuy: 2,
      strongSell: 0,
    });
  });
});
