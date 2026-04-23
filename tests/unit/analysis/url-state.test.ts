import { describe, expect, it } from "vitest";
import {
  buildAnalysisSearchParams,
  decodeIndicatorConfig,
  encodeIndicatorConfig,
  getEnabledIndicatorNames,
  normalizeIndicatorConfig,
  normalizeWeights,
} from "@/lib/url-state";

const defaultIndicatorConfig = {
  MACD: { fast: 12, signal: 9, slow: 26 },
  RSI: { period: 14 },
  SMA: { period: 20 },
};

const availableIndicators = {
  momentum: ["RSI", "MACD"],
  trend: ["SMA"],
};

describe("analysis URL state", () => {
  it("normalizes arbitrary weights into a stable 100-point split", () => {
    expect(
      normalizeWeights({ fundamental: 1, technical: 1, sentiment: 1 }),
    ).toEqual({
      fundamental: 34,
      technical: 33,
      sentiment: 33,
    });

    expect(
      normalizeWeights({ fundamental: 2, technical: 3, sentiment: 5 }),
    ).toEqual({
      fundamental: 20,
      technical: 30,
      sentiment: 50,
    });
  });

  it("falls back to defaults for invalid weights", () => {
    expect(
      normalizeWeights({ fundamental: -1, technical: 50, sentiment: 51 }),
    ).toEqual({
      fundamental: 40,
      technical: 35,
      sentiment: 25,
    });

    expect(
      normalizeWeights({ fundamental: 0, technical: 0, sentiment: 0 }),
    ).toEqual({
      fundamental: 40,
      technical: 35,
      sentiment: 25,
    });
  });

  it("normalizes indicator config and ignores unsupported entries", () => {
    const normalized = normalizeIndicatorConfig(
      {
        RSI: { enabled: false, period: -5 },
        MACD: { fast: 8 },
        Unknown: { enabled: false },
      },
      defaultIndicatorConfig,
      availableIndicators,
    );

    expect(normalized).toEqual({
      MACD: { enabled: true, fast: 8, signal: 9, slow: 26 },
      RSI: { enabled: false, period: 14 },
      SMA: { enabled: true, period: 20 },
    });
    expect(getEnabledIndicatorNames(normalized)).toEqual(["MACD", "SMA"]);
  });

  it("round-trips only non-default URL state", () => {
    const indicatorConfig = normalizeIndicatorConfig(
      {
        RSI: { enabled: false },
      },
      defaultIndicatorConfig,
      availableIndicators,
    );

    const params = buildAnalysisSearchParams({
      availableIndicators,
      defaultIndicatorConfig,
      indicatorConfig,
      timeframe: "3M",
      weights: { fundamental: 50, technical: 25, sentiment: 25 },
    });

    expect(params.get("tf")).toBe("3M");
    expect(params.get("wf")).toBe("50");
    expect(params.get("wt")).toBe("25");
    expect(params.get("ws")).toBe("25");

    const encodedIndicators = params.get("ic");
    expect(encodedIndicators).toBe(
      encodeIndicatorConfig(
        indicatorConfig,
        defaultIndicatorConfig,
        availableIndicators,
      ),
    );
    expect(
      decodeIndicatorConfig(
        encodedIndicators ?? undefined,
        defaultIndicatorConfig,
        availableIndicators,
      ),
    ).toEqual(indicatorConfig);
  });
});
