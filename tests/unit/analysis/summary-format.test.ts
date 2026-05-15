import { describe, expect, it } from "vitest";
import { formatAnalysisSummary } from "@/lib/analysis/summary-format";

const markdownSummary =
  "**TSLA: Neutral with Cautious Upside Potential** **Directional View & Conviction:** TSLA maintains a neutral stance with moderate conviction for potential range-bound trading or minor upside, primarily supported by mild technical strength. A strong directional bias is absent due to balanced fundamental and sentiment signals. **Key Supporting Factors:** Technical indicators suggest moderate stability and potential for consolidation or gradual appreciation. Sentiment remains cautiously positive. **Main Downside Risks:** Fundamental neutrality derived from cached data implies a current lack of compelling new growth catalysts, which could cap significant upside. **Execution Note:** Maintain existing positions. Consider scaling into long positions only on clear breakout confirmations.";

describe("formatAnalysisSummary", () => {
  it("extracts a headline and labelled sections from markdown-like AI summaries", () => {
    const result = formatAnalysisSummary(markdownSummary);

    expect(result.headline).toBe(
      "TSLA: Neutral with Cautious Upside Potential",
    );
    expect(result.sections).toEqual([
      {
        title: "Directional View & Conviction",
        tone: "neutral",
        body: "TSLA maintains a neutral stance with moderate conviction for potential range-bound trading or minor upside, primarily supported by mild technical strength. A strong directional bias is absent due to balanced fundamental and sentiment signals.",
      },
      {
        title: "Key Supporting Factors",
        tone: "positive",
        body: "Technical indicators suggest moderate stability and potential for consolidation or gradual appreciation. Sentiment remains cautiously positive.",
      },
      {
        title: "Main Downside Risks",
        tone: "risk",
        body: "Fundamental neutrality derived from cached data implies a current lack of compelling new growth catalysts, which could cap significant upside.",
      },
      {
        title: "Execution Note",
        tone: "action",
        body: "Maintain existing positions. Consider scaling into long positions only on clear breakout confirmations.",
      },
    ]);
  });

  it("falls back to a cleaned overview when the summary has no labelled sections", () => {
    const result = formatAnalysisSummary(
      "AAPL shows a hold bias. **Momentum** remains balanced.\n\nWatch valuation risk.",
    );

    expect(result.headline).toBeUndefined();
    expect(result.sections).toEqual([
      {
        title: "Overview",
        tone: "neutral",
        body: "AAPL shows a hold bias. Momentum remains balanced. Watch valuation risk.",
      },
    ]);
  });
});
