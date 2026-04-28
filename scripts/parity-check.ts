import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import analysisServiceModule from "../lib/analysis/analysis-service.js";
import basicTechnicalAnalysisServiceModule from "../lib/analysis/basic-technical-analysis-service.js";
import enhancedScoringServiceModule from "../lib/analysis/enhanced-scoring-service.js";
import fundamentalAnalysisServiceModule from "../lib/analysis/fundamental-analysis-service.js";
import sentimentServiceModule from "../lib/analysis/sentiment-service.js";
import weightServiceModule from "../lib/analysis/weight-service.js";
import aiModule from "../lib/ai/index.js";
import dataServiceModule from "../lib/market/data-service.js";
import dataSourceManagerModule from "../lib/market/data-source-manager.js";

type Weights = {
  fundamental: number;
  sentiment: number;
  technical: number;
};

type ParityFixture = {
  acceptedDeltas: string[];
  indicatorsConfig?: Record<string, unknown>;
  mode: "advanced" | "normal";
  requiredAnalysisSections: string[];
  symbol: string;
  timeframe: string;
  tolerances: {
    maxScoreDelta: number;
    minDataPoints: number;
    requireSameRecommendation: boolean;
  };
  weights: Weights;
};

type ParityFixtureFile = {
  fixtures: ParityFixture[];
  version: number;
};

type AnalysisSummary = {
  dataPoints: number;
  mode: string;
  recommendation: string;
  score: number;
  sections: string[];
  symbol: string;
};

type NoopCache = {
  get: () => null;
  getAsync: () => Promise<null>;
  set: () => undefined;
  setAsync: () => Promise<void>;
  stats: () => { expired: number; size: number; valid: number };
};

type NoopApiTracker = {
  getAPIStatistics: () => Record<string, never>;
  logAPICall: () => Promise<void>;
};

const repoRoot = process.cwd();
const defaultFixturePath = path.join(
  repoRoot,
  "tests",
  "fixtures",
  "parity",
  "symbols.json",
);

const activeScanRoots = [
  "app",
  "components",
  "hooks",
  "lib",
  "scripts",
  "tests",
];
const skipDirs = new Set([".git", ".next", "node_modules", "legacy"]);
const scanExtensions = new Set([
  ".cjs",
  ".js",
  ".jsx",
  ".json",
  ".mjs",
  ".ts",
  ".tsx",
]);
const archivedRuntimePatterns = [
  /\blegacy[\\/](backend|frontend)\b/i,
  /from\s+["'][^"']*legacy[\\/]/i,
  /require\(["'][^"']*legacy[\\/]/i,
];

const { createAnalysisService } = analysisServiceModule;
const { createBasicTechnicalAnalysisService } =
  basicTechnicalAnalysisServiceModule;
const { createEnhancedScoringService } = enhancedScoringServiceModule;
const { createFundamentalAnalysisService } = fundamentalAnalysisServiceModule;
const { createSentimentService } = sentimentServiceModule;
const { createWeightService } = weightServiceModule;
const { createSummaryService } = aiModule;
const { createDataService } = dataServiceModule;
const { createDataSourceManager } = dataSourceManagerModule;

const getArgValue = (name: string): string | null => {
  const prefix = `${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
};

const hasArg = (name: string): boolean => process.argv.includes(name);

const fixturePath = path.resolve(
  getArgValue("--fixtures") ||
    process.env.PARITY_FIXTURE_PATH ||
    defaultFixturePath,
);
const runLive = hasArg("--live") || process.env.PARITY_LIVE === "1";

const fail = (message: string): never => {
  throw new Error(message);
};

const loadLocalEnv = async (): Promise<void> => {
  const envPath = path.join(repoRoot, ".env.local");
  if (!existsSync(envPath)) {
    return;
  }

  const raw = await readFile(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

const createNoopCache = (): NoopCache => ({
  get: () => null,
  getAsync: async () => null,
  set: () => undefined,
  setAsync: async () => undefined,
  stats: () => ({ expired: 0, size: 0, valid: 0 }),
});

const createNoopApiTracker = (): NoopApiTracker => ({
  getAPIStatistics: () => ({}),
  logAPICall: async () => undefined,
});

const loadFixtures = async (): Promise<ParityFixture[]> => {
  const raw = await readFile(fixturePath, "utf8");
  const parsed = JSON.parse(raw) as ParityFixtureFile;

  if (parsed.version !== 1) {
    fail(`Unsupported parity fixture version: ${parsed.version}`);
  }
  if (!Array.isArray(parsed.fixtures) || parsed.fixtures.length === 0) {
    fail("Parity fixture file must contain at least one fixture.");
  }

  for (const fixture of parsed.fixtures) {
    if (!/^[A-Z][A-Z0-9.:-]*$/.test(fixture.symbol)) {
      fail(`Invalid fixture symbol: ${fixture.symbol}`);
    }
    if (!fixture.requiredAnalysisSections.length) {
      fail(`Fixture ${fixture.symbol} must define required analysis sections.`);
    }
    const weightTotal =
      fixture.weights.fundamental +
      fixture.weights.technical +
      fixture.weights.sentiment;
    if (weightTotal !== 100) {
      fail(
        `Fixture ${fixture.symbol} weights must total 100, got ${weightTotal}.`,
      );
    }
  }

  return parsed.fixtures;
};

const walkFiles = async (dir: string): Promise<string[]> => {
  if (!existsSync(dir)) {
    return [];
  }

  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (skipDirs.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
      continue;
    }

    if (scanExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
};

const auditLegacyRuntimeReferences = async (): Promise<string[]> => {
  const candidates = (
    await Promise.all(
      activeScanRoots.map((root) => walkFiles(path.join(repoRoot, root))),
    )
  ).flat();
  const violations: string[] = [];

  for (const filePath of candidates) {
    const relativePath = path.relative(repoRoot, filePath).replace(/\\/g, "/");
    if (relativePath === "scripts/parity-check.ts") {
      continue;
    }

    const contents = await readFile(filePath, "utf8");
    if (archivedRuntimePatterns.some((pattern) => pattern.test(contents))) {
      violations.push(relativePath);
    }
  }

  return violations;
};

const getAnalysisPayload = (payload: unknown): Record<string, unknown> => {
  if (typeof payload !== "object" || payload === null) {
    fail("Analysis payload must be an object.");
  }

  const record = payload as Record<string, unknown>;
  const analysis = record.analysis;
  if (typeof analysis !== "object" || analysis === null) {
    fail("Analysis payload is missing analysis object.");
  }

  return analysis as Record<string, unknown>;
};

const summarizeAnalysis = (
  payload: unknown,
  fallbackSymbol: string,
): AnalysisSummary => {
  const analysis = getAnalysisPayload(payload);
  const overall = analysis.overall as Record<string, unknown> | undefined;
  const meta = analysis.meta as Record<string, unknown> | undefined;
  const source = payload as Record<string, unknown>;

  return {
    dataPoints: Number(meta?.dataPoints ?? 0),
    mode: String(analysis.mode ?? ""),
    recommendation: String(overall?.recommendation ?? ""),
    score: Number(overall?.score ?? Number.NaN),
    sections: Object.keys(analysis),
    symbol: String(source.symbol ?? fallbackSymbol),
  };
};

const assertRootContract = (
  fixture: ParityFixture,
  summary: AnalysisSummary,
): string[] => {
  const issues: string[] = [];

  if (summary.symbol.toUpperCase() !== fixture.symbol) {
    issues.push(`expected symbol ${fixture.symbol}, got ${summary.symbol}`);
  }
  if (summary.mode !== fixture.mode) {
    issues.push(`expected mode ${fixture.mode}, got ${summary.mode}`);
  }
  if (
    !Number.isFinite(summary.score) ||
    summary.score < 0 ||
    summary.score > 100
  ) {
    issues.push(`score must be in range 0..100, got ${summary.score}`);
  }
  if (!summary.recommendation) {
    issues.push("missing overall recommendation");
  }
  if (summary.dataPoints < fixture.tolerances.minDataPoints) {
    issues.push(
      `expected at least ${fixture.tolerances.minDataPoints} data points, got ${summary.dataPoints}`,
    );
  }

  for (const section of fixture.requiredAnalysisSections) {
    if (!summary.sections.includes(section)) {
      issues.push(`missing analysis section ${section}`);
    }
  }

  return issues;
};

const runLiveRootChecks = async (
  fixtures: ParityFixture[],
): Promise<Map<string, AnalysisSummary>> => {
  const cache = createNoopCache();
  const apiTracker = createNoopApiTracker();
  const dataSourceManager = createDataSourceManager({ cache, apiTracker });
  const dataService = createDataService({ dataSourceManager });
  const weightService = createWeightService();
  const analysisService = createAnalysisService({
    enhancedScoringService: createEnhancedScoringService(),
    fundamentalAnalysisService: createFundamentalAnalysisService({
      apiTracker,
      cache,
      dataSourceManager,
    }),
    sentimentService: createSentimentService({ apiTracker }),
    summaryService: createSummaryService({ provider: "fallback" }),
    technicalAnalysisService: createBasicTechnicalAnalysisService(),
    weightService,
  });
  const summaries = new Map<string, AnalysisSummary>();

  for (const fixture of fixtures) {
    const stockData = await dataService.fetchStockData(
      fixture.symbol,
      fixture.timeframe,
    );
    const analysis =
      fixture.mode === "normal"
        ? await analysisService.performNormalAnalysis(
            fixture.symbol,
            stockData,
            fixture.timeframe,
          )
        : await analysisService.performAdvancedAnalysis(
            fixture.symbol,
            stockData,
            fixture.timeframe,
            fixture.weights,
            fixture.indicatorsConfig || {},
          );

    const summary = summarizeAnalysis(analysis, fixture.symbol);
    const issues = assertRootContract(fixture, summary);

    if (issues.length > 0) {
      fail(
        `${fixture.symbol} root parity contract failed: ${issues.join("; ")}`,
      );
    }

    summaries.set(fixture.symbol, summary);
  }

  return summaries;
};

const main = async (): Promise<void> => {
  const fixtures = await loadFixtures();
  const violations = await auditLegacyRuntimeReferences();

  if (violations.length > 0) {
    fail(
      `Active runtime references archived paths:\n${violations
        .map((filePath) => `- ${filePath}`)
        .join("\n")}`,
    );
  }

  console.log(
    `[parity] Loaded ${fixtures.length} fixtures from ${fixturePath}`,
  );
  console.log("[parity] Active runtime archive import audit passed.");

  if (!runLive) {
    console.log(
      "[parity] Contract-only mode complete. Add --live for data checks.",
    );
    return;
  }

  await loadLocalEnv();
  await runLiveRootChecks(fixtures);
  console.log("[parity] Live parity checks passed.");
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[parity] ${message}`);
  process.exitCode = 1;
});
