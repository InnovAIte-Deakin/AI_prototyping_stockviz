export type SummarySectionTone = "action" | "neutral" | "positive" | "risk";

export type FormattedSummarySection = {
  body: string;
  title: string;
  tone: SummarySectionTone;
};

export type FormattedAnalysisSummary = {
  headline?: string;
  sections: FormattedSummarySection[];
};

type BoldToken = {
  end: number;
  isSectionLabel: boolean;
  start: number;
  text: string;
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function cleanMarkdownText(value: string): string {
  return normalizeWhitespace(
    value
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/\*\*/g, "")
      .replace(/__/g, ""),
  );
}

function toSectionTitle(value: string): string {
  return cleanMarkdownText(value).replace(/:\s*$/, "").trim();
}

function getSectionTone(title: string): SummarySectionTone {
  const normalizedTitle = title.toLowerCase();

  if (
    normalizedTitle.includes("risk") ||
    normalizedTitle.includes("downside") ||
    normalizedTitle.includes("bear")
  ) {
    return "risk";
  }

  if (
    normalizedTitle.includes("factor") ||
    normalizedTitle.includes("support") ||
    normalizedTitle.includes("strength") ||
    normalizedTitle.includes("upside")
  ) {
    return "positive";
  }

  if (
    normalizedTitle.includes("execution") ||
    normalizedTitle.includes("action") ||
    normalizedTitle.includes("position")
  ) {
    return "action";
  }

  return "neutral";
}

function getBoldTokens(summary: string): BoldToken[] {
  const tokens: BoldToken[] = [];
  const boldPattern = /\*\*([\s\S]*?)\*\*/g;
  let match: RegExpExecArray | null;

  while ((match = boldPattern.exec(summary)) !== null) {
    const text = cleanMarkdownText(match[1] || "");

    if (!text) {
      continue;
    }

    tokens.push({
      end: match.index + match[0].length,
      isSectionLabel: /:\s*$/.test(text) && text.length <= 80,
      start: match.index,
      text,
    });
  }

  return tokens;
}

export function formatAnalysisSummary(
  summary: string,
): FormattedAnalysisSummary {
  const normalizedSummary = normalizeWhitespace(summary);
  const tokens = getBoldTokens(normalizedSummary);
  const sectionTokens = tokens.filter((token) => token.isSectionLabel);
  const firstSectionStart = sectionTokens[0]?.start ?? normalizedSummary.length;
  const headlineToken = tokens.find((token) => {
    if (token.isSectionLabel || token.start >= firstSectionStart) {
      return false;
    }

    return cleanMarkdownText(normalizedSummary.slice(0, token.start)) === "";
  });
  const sections: FormattedSummarySection[] = [];
  const preface = cleanMarkdownText(
    normalizedSummary.slice(headlineToken?.end ?? 0, firstSectionStart),
  );

  if (preface) {
    sections.push({
      body: preface,
      title: "Overview",
      tone: "neutral",
    });
  }

  sectionTokens.forEach((sectionToken, index) => {
    const nextSectionToken = sectionTokens[index + 1];
    const title = toSectionTitle(sectionToken.text);
    const body = cleanMarkdownText(
      normalizedSummary.slice(
        sectionToken.end,
        nextSectionToken?.start ?? normalizedSummary.length,
      ),
    );

    if (!title || !body) {
      return;
    }

    sections.push({
      body,
      title,
      tone: getSectionTone(title),
    });
  });

  if (sections.length === 0) {
    const fallbackBody =
      cleanMarkdownText(normalizedSummary) || "No summary available.";

    sections.push({
      body: fallbackBody,
      title: "Overview",
      tone: "neutral",
    });
  }

  return {
    headline: headlineToken?.text,
    sections,
  };
}
