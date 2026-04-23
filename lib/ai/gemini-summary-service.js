import { GoogleGenerativeAI } from "@google/generative-ai";
import fallbackSummaryServiceModule from "./fallback-summary-service.js";

const { createFallbackSummaryService } = fallbackSummaryServiceModule;

class GeminiSummaryService {
  constructor({
    apiKey = process.env.GEMINI_API_KEY,
    modelName = "gemini-2.5-flash",
    apiTracker = null,
    fallbackService = createFallbackSummaryService(),
    logger = console,
    GenerativeAI = GoogleGenerativeAI,
  } = {}) {
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.apiTracker = apiTracker;
    this.fallbackService = fallbackService;
    this.logger = logger;
    this.GenerativeAI = GenerativeAI;
    this.provider = "gemini";
    this.model = null;
    this.initialize();
  }

  initialize() {
    if (!this.apiKey) {
      this.logger.log(
        "[ai] GEMINI_API_KEY not configured, using fallback summary provider.",
      );
      return;
    }

    try {
      const client = new this.GenerativeAI(this.apiKey);
      this.model = client.getGenerativeModel({ model: this.modelName });
    } catch (error) {
      this.logger.error(
        "[ai] Failed to initialize Gemini summary provider:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  isConfigured() {
    return Boolean(this.model);
  }

  formatFundamentalSection(fundamental) {
    return [
      `Score: ${fundamental?.score ?? 50}/100`,
      fundamental?.recommendation
        ? `Recommendation: ${fundamental.recommendation}`
        : null,
      fundamental?.notes ? `Notes: ${fundamental.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  formatTechnicalSection(technical) {
    const indicatorNames = Object.keys(technical?.indicators || {}).filter(
      (key) => key !== "patterns",
    );

    return [
      `Score: ${technical?.score ?? 50}/100`,
      technical?.recommendation
        ? `Recommendation: ${technical.recommendation}`
        : null,
      indicatorNames.length > 0
        ? `Indicators: ${indicatorNames.sort().join(", ")}`
        : null,
      technical?.error ? `Error: ${technical.error}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  formatSentimentSection(sentiment) {
    return [
      `Score: ${sentiment?.score ?? 50}/100`,
      sentiment?.summary ? `Summary: ${sentiment.summary}` : null,
      Array.isArray(sentiment?.newsItems)
        ? `News items analyzed: ${sentiment.newsItems.length}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  buildNormalPrompt(
    fundamental,
    technical,
    sentiment,
    weights,
    symbol,
    timeframe,
  ) {
    return `You are a helpful stock analysis explainer.

Create a concise beginner-friendly summary for ${symbol} on the ${timeframe} timeframe.

Use this weighting profile:
- Fundamental: ${weights?.fundamental ?? 40}%
- Technical: ${weights?.technical ?? 35}%
- Sentiment: ${weights?.sentiment ?? 25}%

Fundamental analysis:
${this.formatFundamentalSection(fundamental)}

Technical analysis:
${this.formatTechnicalSection(technical)}

Sentiment analysis:
${this.formatSentimentSection(sentiment)}

Return:
1. A plain-English recommendation.
2. Two strengths.
3. Two risks.
4. One short next-step note.

Keep it under 180 words.`;
  }

  buildAdvancedPrompt(
    fundamental,
    technical,
    sentiment,
    weights,
    symbol,
    timeframe,
  ) {
    return `You are a quantitative market analyst.

Create a concise advanced summary for ${symbol} on the ${timeframe} timeframe.

Weighting profile:
- Fundamental: ${weights?.fundamental ?? 40}%
- Technical: ${weights?.technical ?? 35}%
- Sentiment: ${weights?.sentiment ?? 25}%

Fundamental analysis:
${this.formatFundamentalSection(fundamental)}

Technical analysis:
${this.formatTechnicalSection(technical)}

Sentiment analysis:
${this.formatSentimentSection(sentiment)}

Return:
1. Directional view with conviction.
2. Key supporting factors.
3. Main downside risks.
4. A short execution note.

Keep it under 220 words and use actionable language.`;
  }

  async trackApiCall(symbol, timeframe, success, responseTime) {
    try {
      if (typeof this.apiTracker?.logAPICall === "function") {
        await this.apiTracker.logAPICall(
          "Gemini",
          "generateContent",
          symbol,
          timeframe,
          success,
          responseTime,
        );
      }
    } catch (error) {
      this.logger.warn(
        "[ai] Failed to record Gemini API call:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  async generateWeightedAISummary(
    fundamental,
    technical,
    sentiment,
    weights,
    symbol,
    timeframe = "current",
    mode = "normal",
  ) {
    if (!this.model) {
      return this.fallbackService.generateWeightedAISummary(
        fundamental,
        technical,
        sentiment,
        weights,
        symbol,
        timeframe,
        mode,
      );
    }

    const prompt =
      mode === "advanced"
        ? this.buildAdvancedPrompt(
            fundamental,
            technical,
            sentiment,
            weights,
            symbol,
            timeframe,
          )
        : this.buildNormalPrompt(
            fundamental,
            technical,
            sentiment,
            weights,
            symbol,
            timeframe,
          );

    const startTime = Date.now();

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text()?.trim();
      const responseTime = Date.now() - startTime;

      await this.trackApiCall(symbol, timeframe, true, responseTime);

      if (text) {
        return text;
      }

      this.logger.warn(
        "[ai] Gemini returned an empty summary, using fallback provider.",
      );
    } catch (error) {
      const responseTime = Date.now() - startTime;
      await this.trackApiCall(symbol, timeframe, false, responseTime);

      this.logger.warn(
        "[ai] Gemini summary generation failed, using fallback provider:",
        error instanceof Error ? error.message : error,
      );
    }

    return this.fallbackService.generateWeightedAISummary(
      fundamental,
      technical,
      sentiment,
      weights,
      symbol,
      timeframe,
      mode,
    );
  }
}

function createGeminiSummaryService(options) {
  return new GeminiSummaryService(options);
}

const geminiSummaryServiceModule = {
  GeminiSummaryService,
  createGeminiSummaryService,
};

export { GeminiSummaryService, createGeminiSummaryService };

export default geminiSummaryServiceModule;
