import { describe, expect, it, vi } from "vitest";

describe("fundamental analysis cache integration", () => {
  it("uses async cache reads when the injected cache supports them", async () => {
    const cache = {
      get: vi.fn(() => null),
      getAsync: vi.fn(async () => ({
        breakdown: {},
        metrics: {},
        recommendation: "HOLD",
        score: 64,
        source: "cache",
      })),
      set: vi.fn(),
      setAsync: vi.fn(),
    };
    const dataSourceManager = {
      fetchFundamentalData: vi.fn(),
    };
    const { createFundamentalAnalysisService } = await import(
      "@/lib/analysis/fundamental-analysis-service.js"
    );

    const service = createFundamentalAnalysisService({
      cache,
      dataSourceManager,
      logger: { warn: vi.fn(), error: vi.fn() },
    });

    const result = await service.analyze("AAPL");

    expect(result.score).toBe(64);
    expect(cache.getAsync).toHaveBeenCalledWith("fa_analysis_AAPL");
    expect(dataSourceManager.fetchFundamentalData).not.toHaveBeenCalled();
  });
});
