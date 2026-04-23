import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

type AnalysisWeights = {
  fundamental: number;
  technical: number;
  sentiment: number;
};

type WeightService = {
  getWeightingStyle: (weights: AnalysisWeights) => string;
  suggestAlternativeWeights: (weights: AnalysisWeights) => unknown[];
  validateAndParseWeights: (weights: AnalysisWeights) => AnalysisWeights;
};

const require = createRequire(import.meta.url);
const { createWeightService } =
  require("../../../lib/analysis/weight-service.js") as {
    createWeightService: (options?: {
      logger?: Pick<Console, "log">;
    }) => WeightService;
  };

describe("WeightService", () => {
  it("normalizes analysis weights with the same 100-point contract as URL state", () => {
    const service = createWeightService({ logger: { log: vi.fn() } });

    expect(
      service.validateAndParseWeights({
        fundamental: 2,
        technical: 3,
        sentiment: 5,
      }),
    ).toEqual({
      fundamental: 20,
      technical: 30,
      sentiment: 50,
    });
  });

  it("falls back to defaults and logs when weights are invalid", () => {
    const logger = { log: vi.fn() };
    const service = createWeightService({ logger });

    expect(
      service.validateAndParseWeights({
        fundamental: 0,
        technical: 0,
        sentiment: 0,
      }),
    ).toEqual({
      fundamental: 40,
      technical: 35,
      sentiment: 25,
    });
    expect(logger.log).toHaveBeenCalledWith(
      "Zero total weights, using defaults",
    );
  });

  it("describes the dominant weighting style for user-facing summaries", () => {
    const service = createWeightService({ logger: { log: vi.fn() } });

    expect(
      service.getWeightingStyle({
        fundamental: 60,
        technical: 25,
        sentiment: 15,
      }),
    ).toBe("fundamental value investing");
    expect(
      service.getWeightingStyle({
        fundamental: 40,
        technical: 35,
        sentiment: 25,
      }),
    ).toBe("balanced multi-factor approach");
  });
});
