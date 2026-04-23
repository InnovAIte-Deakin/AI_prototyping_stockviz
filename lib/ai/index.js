import fallbackSummaryServiceModule from "./fallback-summary-service.js";
import geminiSummaryServiceModule from "./gemini-summary-service.js";

const { createFallbackSummaryService } = fallbackSummaryServiceModule;
const { createGeminiSummaryService } = geminiSummaryServiceModule;

function createSummaryService({
  apiKey = process.env.GEMINI_API_KEY,
  provider = process.env.AI_SUMMARY_PROVIDER || "auto",
  logger = console,
  ...rest
} = {}) {
  const normalizedProvider = String(provider || "auto")
    .trim()
    .toLowerCase();
  const fallbackService = createFallbackSummaryService({ logger });

  if (normalizedProvider === "fallback") {
    return fallbackService;
  }

  if (!apiKey && normalizedProvider !== "gemini") {
    return fallbackService;
  }

  const geminiService = createGeminiSummaryService({
    apiKey,
    logger,
    fallbackService,
    ...rest,
  });

  return geminiService.isConfigured() ? geminiService : fallbackService;
}

const aiModule = {
  createSummaryService,
  createFallbackSummaryService,
  createGeminiSummaryService,
};

export {
  createSummaryService,
  createFallbackSummaryService,
  createGeminiSummaryService,
};

export default aiModule;
