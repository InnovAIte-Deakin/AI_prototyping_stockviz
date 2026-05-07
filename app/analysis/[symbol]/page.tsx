import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Gauge,
  MessageSquareText,
  Newspaper,
} from "lucide-react";
import runtime from "@/lib/analysis/runtime";
import { AnalysisControls } from "@/components/analysis/analysis-controls";
import { SymbolSearch } from "@/components/search/symbol-search";
import { PriceHistoryChart } from "@/components/analysis/price-history-chart";
import { SentimentHeadlines } from "@/components/analysis/sentiment-headlines";
import { Button } from "@/components/ui/button";
import { WishlistButton } from "@/components/user/wishlist-button";
import type { AnalysisResult } from "@/lib/types";
import { UserFeatureAuthError } from "@/lib/user/session";
import {
  getWishlistItemForCurrentUserBySymbol,
  toWishlistItemSummary,
  type WishlistItemSummary,
} from "@/lib/user/wishlist-service";
import {
  buildAnalysisSearchParams,
  decodeIndicatorConfig,
  getEnabledIndicatorNames,
  getSingleSearchParam,
  normalizeIndicatorConfig,
  normalizeWeights,
  type SearchParamValue,
} from "@/lib/url-state";
import { getResolvedSymbolRedirect } from "@/lib/market/symbol-resolution";

const TIMEFRAMES = ["1D", "1W", "1M", "3M", "6M", "1Y", "2Y"] as const;
const { analyzeSymbol } = runtime;

type Timeframe = (typeof TIMEFRAMES)[number];

type AnalysisPageProps = {
  params: Promise<{ symbol?: string }>;
  searchParams: Promise<Record<string, SearchParamValue>>;
};

type ChartPoint = {
  close: number;
  date: string;
  [key: string]: unknown;
};

type ScoreCardSource = {
  recommendation?: string;
  score?: number;
  source?: string;
};

const isChartPoint = (value: unknown): value is ChartPoint => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const point = value as { close?: unknown; date?: unknown };
  return typeof point.date === "string" && typeof point.close === "number";
};

function getTone(score: number): string {
  if (score >= 70) return "bg-finance-success/10 text-finance-success";
  if (score >= 50) return "bg-finance-warning/10 text-finance-warning";
  return "bg-destructive/10 text-destructive";
}

function normalizeTimeframe(value: string | undefined): Timeframe {
  return TIMEFRAMES.includes(value as Timeframe) ? (value as Timeframe) : "1M";
}

function encodeSearchParams(
  searchParams: Record<string, SearchParamValue>,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
    } else if (typeof value === "string") {
      params.set(key, value);
    }
  }

  return params.toString();
}

async function resolveCompanyNameRoute(
  symbol: string,
): Promise<string | null> {
  if (symbol.length <= 5) {
    return null;
  }

  const response = await runtime.searchService.searchSymbols(symbol);
  return getResolvedSymbolRedirect(symbol, response.results || []);
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol?: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  const normalizedSymbol = String(symbol || "")
    .trim()
    .toUpperCase();

  return {
    title: normalizedSymbol ? `${normalizedSymbol} Analysis` : "Analysis",
    description: `StockViz analysis for ${normalizedSymbol || "a symbol"} using active market services.`,
  };
}

export default async function AnalysisPage({
  params,
  searchParams,
}: AnalysisPageProps) {
  const { symbol } = await params;
  const resolvedSearchParams = (await searchParams) || {};
  const normalizedSymbol = String(symbol || "")
    .trim()
    .toUpperCase();

  if (!normalizedSymbol) notFound();

  const timeframe = normalizeTimeframe(
    getSingleSearchParam(resolvedSearchParams.tf),
  );
  const resolvedRouteSymbol = await resolveCompanyNameRoute(normalizedSymbol);
  if (resolvedRouteSymbol) {
    const query = encodeSearchParams(resolvedSearchParams);
    redirect(
      query
        ? `/analysis/${encodeURIComponent(resolvedRouteSymbol)}?${query}`
        : `/analysis/${encodeURIComponent(resolvedRouteSymbol)}`,
    );
  }

  const availableIndicators =
    runtime.technicalAnalysisService.getAvailableIndicators();
  const defaultIndicatorConfig = normalizeIndicatorConfig(
    {},
    runtime.technicalAnalysisService.getDefaultConfig(),
    availableIndicators,
  );
  const selectedWeights = normalizeWeights({
    fundamental: getSingleSearchParam(resolvedSearchParams.wf),
    technical: getSingleSearchParam(resolvedSearchParams.wt),
    sentiment: getSingleSearchParam(resolvedSearchParams.ws),
  });
  const activeIndicatorConfig = decodeIndicatorConfig(
    resolvedSearchParams.ic,
    defaultIndicatorConfig,
    availableIndicators,
  );
  let wishlistItem: WishlistItemSummary | null = null;
  try {
    const item = await getWishlistItemForCurrentUserBySymbol(normalizedSymbol);
    wishlistItem = item ? toWishlistItemSummary(item) : null;
  } catch (error) {
    if (!(error instanceof UserFeatureAuthError)) {
      throw error;
    }
  }
  const { analysis, stockData, weights } = await analyzeSymbol(
    normalizedSymbol,
    {
      timeframe,
      mode: "advanced",
      weights: selectedWeights,
      indicatorsConfig: activeIndicatorConfig,
    },
  );

  const analysisResult = analysis?.analysis as Partial<AnalysisResult> | undefined;
  const summary =
    analysisResult?.aiInsights?.summary || "No summary available.";
  const overall: ScoreCardSource = analysisResult?.overall || {};
  const fundamental: ScoreCardSource = analysisResult?.fundamental || {};
  const technical: ScoreCardSource = analysisResult?.technical || {};
  const sentiment: ScoreCardSource = analysisResult?.sentiment || {};
  const chartData: ChartPoint[] = Array.isArray(stockData?.ohlcv)
    ? stockData.ohlcv.filter(isChartPoint)
    : [];
  const latestPoint = chartData.at(-1);
  const activeIndicatorNames = getEnabledIndicatorNames(activeIndicatorConfig);
  const timeframeHrefs = Object.fromEntries(
    TIMEFRAMES.map((candidate) => {
      const nextSearchParams = buildAnalysisSearchParams({
        timeframe: candidate,
        weights,
        indicatorConfig: activeIndicatorConfig,
        defaultIndicatorConfig,
        availableIndicators,
      });
      const href = nextSearchParams.toString()
        ? `/analysis/${encodeURIComponent(normalizedSymbol)}?${nextSearchParams.toString()}`
        : `/analysis/${encodeURIComponent(normalizedSymbol)}`;

      return [candidate, href];
    }),
  ) as Record<Timeframe, string>;

  const scoreCards = [
    {
      label: "Overall",
      score: Number(overall.score ?? 50),
      note: String(overall.recommendation || "HOLD"),
      icon: Gauge,
    },
    {
      label: "Fundamental",
      score: Number(fundamental.score ?? 50),
      note: String(fundamental.recommendation || "HOLD"),
      icon: BarChart3,
    },
    {
      label: "Technical",
      score: Number(technical.score ?? 50),
      note: String(technical.recommendation || "HOLD"),
      icon: ArrowRight,
    },
    {
      label: "Sentiment",
      score: Number(sentiment.score ?? 50),
      note: String(sentiment.source || "News"),
      icon: Newspaper,
    },
  ];

  return (
    <div className="min-h-screen bg-surface px-6 py-8 text-on-background md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 rounded-[28px] border border-border bg-white p-7 shadow-[0_20px_60px_rgba(55,49,45,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              asChild
              variant="ghost"
              className="h-10 rounded-xl px-3 text-surface-tint hover:bg-muted"
            >
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Source: {stockData?.source || "Unknown data source"}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Analysis Workspace
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-surface-tint md:text-5xl">
                  {normalizedSymbol} analysis
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                  This screen combines market data, fundamentals, technical
                  indicators, sentiment, and AI-assisted summary notes.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {TIMEFRAMES.map((candidate) => (
                  <Button
                    key={candidate}
                    asChild
                    variant="outline"
                    className={`h-10 rounded-xl border-border px-4 ${
                      candidate === timeframe
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "bg-white text-surface-tint"
                    }`}
                  >
                    <Link
                      href={timeframeHrefs[candidate]}
                      aria-current={
                        candidate === timeframe ? "true" : undefined
                      }
                    >
                      {candidate}
                    </Link>
                  </Button>
                ))}
              </div>
              <WishlistButton
                compact
                initialWishlistItem={wishlistItem}
                symbol={normalizedSymbol}
              />
            </div>

            <div className="rounded-[24px] border border-border bg-card p-5">
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Search another symbol
              </p>
              <SymbolSearch
                compact
                submitLabel="Go"
                initialQuery={normalizedSymbol}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {scoreCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-[22px] border border-border bg-white p-5 shadow-[0_12px_32px_rgba(55,49,45,0.04)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </span>
                  <div className="rounded-2xl bg-muted p-2 text-surface-tint">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-end gap-3">
                  <p className="text-4xl font-semibold text-on-surface">
                    <span className="sr-only">{card.label} score </span>
                    {card.score}
                  </p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getTone(card.score)}`}
                  >
                    {card.note}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <AnalysisControls
          symbol={normalizedSymbol}
          timeframe={timeframe}
          weights={weights}
          indicatorConfig={activeIndicatorConfig}
          defaultIndicatorConfig={defaultIndicatorConfig}
          availableIndicators={availableIndicators}
        />

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-[24px] border border-border bg-white p-6 shadow-[0_12px_32px_rgba(55,49,45,0.04)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-on-surface">
                  Price history
                </h2>
                <p className="text-sm text-muted-foreground">
                  {chartData.length} points loaded from{" "}
                  {stockData?.source || "the active provider"}.
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Latest close</p>
                <p className="text-2xl font-semibold text-on-surface">
                  {latestPoint?.close
                    ? `$${Number(latestPoint.close).toFixed(2)}`
                    : "Unavailable"}
                </p>
              </div>
            </div>
            <PriceHistoryChart data={chartData} />
          </div>

          <div className="space-y-6">
            <div className="rounded-[24px] border border-border bg-white p-6 shadow-[0_12px_32px_rgba(55,49,45,0.04)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-muted p-3 text-surface-tint">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-on-surface">
                    Summary
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Blended output from analysis services.
                  </p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-on-surface">{summary}</p>

              <dl className="mt-6 grid grid-cols-2 gap-4 rounded-[20px] bg-card p-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Timeframe</dt>
                  <dd className="mt-1 font-medium text-on-surface">
                    {timeframe}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Weights</dt>
                  <dd className="mt-1 font-medium text-on-surface">
                    F {weights.fundamental}% / T {weights.technical}% / S{" "}
                    {weights.sentiment}%
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Indicators</dt>
                  <dd className="mt-1 font-medium text-on-surface">
                    {activeIndicatorNames.length > 0
                      ? activeIndicatorNames.join(", ")
                      : "None enabled"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Recommendation</dt>
                  <dd className="mt-1 font-medium text-on-surface">
                    {overall.recommendation || "HOLD"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Data source</dt>
                  <dd className="mt-1 font-medium text-on-surface">
                    {stockData?.source || "Unknown"}
                  </dd>
                </div>
              </dl>
            </div>

            <SentimentHeadlines
              sentiment={sentiment}
              symbol={normalizedSymbol}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

