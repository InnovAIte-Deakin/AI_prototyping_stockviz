import { describe, expect, it } from "vitest";

import {
  buildRowsForKeys,
  formatFundamentalTooltip,
  METRIC_GROUPS,
  parseMetricNumber,
  toDisplayValue,
} from "@/lib/fundamental-metric-charts";

describe("fundamental metric chart helpers", () => {
  it("parses finite numeric metric values", () => {
    expect(parseMetricNumber("12.5")).toBe(12.5);
    expect(parseMetricNumber(8)).toBe(8);
    expect(parseMetricNumber("")).toBeNull();
    expect(parseMetricNumber("n/a")).toBeNull();
  });

  it("converts fraction-like profitability values into percentage display values", () => {
    expect(toDisplayValue("netMarginAnnual", 0.2345)).toBeCloseTo(23.45);
    expect(formatFundamentalTooltip("netMarginAnnual", 0.2345)).toBe("23.45%");
    expect(toDisplayValue("peAnnual", 22.1)).toBe(22.1);
  });

  it("builds grouped rows with labels and display values", () => {
    const rows = buildRowsForKeys(
      {
        currentRatioAnnual: "1.9",
        quickRatioAnnual: 1.2,
      },
      METRIC_GROUPS.liquidity.keys,
    );

    expect(rows.map((row) => row.key)).toEqual([
      "currentRatioAnnual",
      "quickRatioAnnual",
    ]);
    expect(rows[0].label).toBe("Current ratio");
    expect(rows[0].display).toBe(1.9);
  });
});
