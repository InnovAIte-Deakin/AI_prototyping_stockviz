import { describe, expect, it, vi } from "vitest";
import {
  createGeminiSummaryService,
  createSummaryService,
} from "@/lib/ai/index.js";

const defaultAnalysisInputs = [
  { notes: "Improving margins", recommendation: "BUY", score: 72 },
  {
    indicators: { MACD: { histogram: [0.2] }, RSI: [58] },
    recommendation: "HOLD",
    score: 61,
  },
  { newsItems: [], score: 55, summary: "Sentiment remains mixed" },
  { fundamental: 40, sentiment: 25, technical: 35 },
  "AAPL",
  "1M",
  "advanced",
] as const;

const createMockLogger = (): Console =>
  ({
    error: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
  }) as unknown as Console;

describe("summary service boundary", () => {
  it("uses the fallback summary provider when Gemini is not configured", async () => {
    const service = createSummaryService({
      apiKey: "",
      logger: createMockLogger(),
    });

    await expect(
      service.generateWeightedAISummary(...defaultAnalysisInputs),
    ).resolves.toContain("AAPL shows a hold bias");
  });

  it("returns Gemini output and records successful API tracking", async () => {
    const logAPICall = vi.fn(async () => undefined);
    const fallbackService = {
      generateWeightedAISummary: vi.fn(async () => "fallback"),
    };
    const generateContent = vi.fn(async () => ({
      response: Promise.resolve({
        text: () => "Gemini summary for AAPL",
      }),
    }));
    class FakeGenerativeAI {
      constructor(public apiKey: string) {}

      getGenerativeModel({ model }: { model: string }) {
        expect(this.apiKey).toBe("test-key");
        expect(model).toBe("gemini-2.5-flash");
        return { generateContent };
      }
    }

    const service = createGeminiSummaryService({
      GenerativeAI: FakeGenerativeAI,
      apiKey: "test-key",
      apiTracker: { logAPICall },
      fallbackService,
      logger: createMockLogger(),
    });

    await expect(
      service.generateWeightedAISummary(...defaultAnalysisInputs),
    ).resolves.toBe("Gemini summary for AAPL");
    expect(generateContent).toHaveBeenCalledTimes(1);
    expect(logAPICall).toHaveBeenCalledWith(
      "Gemini",
      "generateContent",
      "AAPL",
      "1M",
      true,
      expect.any(Number),
    );
    expect(fallbackService.generateWeightedAISummary).not.toHaveBeenCalled();
  });

  it("falls back cleanly when Gemini generation fails", async () => {
    const logAPICall = vi.fn(async () => undefined);
    const fallbackService = {
      generateWeightedAISummary: vi.fn(async () => "fallback summary"),
    };
    class ThrowingGenerativeAI {
      getGenerativeModel() {
        return {
          generateContent: vi.fn(async () => {
            throw new Error("Gemini unavailable");
          }),
        };
      }
    }

    const service = createGeminiSummaryService({
      GenerativeAI: ThrowingGenerativeAI,
      apiKey: "test-key",
      apiTracker: { logAPICall },
      fallbackService,
      logger: createMockLogger(),
    });

    await expect(
      service.generateWeightedAISummary(...defaultAnalysisInputs),
    ).resolves.toBe("fallback summary");
    expect(logAPICall).toHaveBeenCalledWith(
      "Gemini",
      "generateContent",
      "AAPL",
      "1M",
      false,
      expect.any(Number),
    );
    expect(fallbackService.generateWeightedAISummary).toHaveBeenCalledTimes(1);
  });
});
