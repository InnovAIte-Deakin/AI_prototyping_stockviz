import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BarChart3, Gauge, MessageSquareText, Newspaper } from "lucide-react";
import runtime from "@/lib/analysis/runtime";
import { SymbolSearch } from "@/components/search/symbol-search";
import { PriceHistoryChart } from "@/components/analysis/price-history-chart";
import { Button } from "@/components/ui/button";

const TIMEFRAMES = ["1D", "1W", "1M", "3M", "6M", "1Y", "2Y"];
const { analyzeSymbol } = runtime;

function getTone(score) {
  if (score >= 70) return "bg-[#e7f6ec] text-[#24613d]";
  if (score >= 50) return "bg-[#f8f1df] text-[#7a5d18]";
  return "bg-[#fdeceb] text-[#8a2f2d]";
}

function normalizeTimeframe(value) {
  return TIMEFRAMES.includes(value) ? value : "1M";
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { symbol } = await params;
  const normalizedSymbol = String(symbol || "").trim().toUpperCase();

  return {
    title: normalizedSymbol ? `${normalizedSymbol} Analysis` : "Analysis",
    description: `StockViz analysis for ${normalizedSymbol || "a symbol"} using the migrated root market services.`,
  };
}

export default async function AnalysisPage({ params, searchParams }) {
  const { symbol } = await params;
  const resolvedSearchParams = (await searchParams) || {};
  const normalizedSymbol = String(symbol || "").trim().toUpperCase();

  if (!normalizedSymbol) notFound();

  const timeframe = normalizeTimeframe(resolvedSearchParams.tf);
  const { analysis, stockData, weights } = await analyzeSymbol(normalizedSymbol, {
    timeframe,
    mode: "advanced",
  });

  const summary = analysis?.analysis?.aiInsights?.summary || "No summary available.";
  const overall = analysis?.analysis?.overall || {};
  const fundamental = analysis?.analysis?.fundamental || {};
  const technical = analysis?.analysis?.technical || {};
  const sentiment = analysis?.analysis?.sentiment || {};
  const chartData = Array.isArray(stockData?.ohlcv) ? stockData.ohlcv : [];
  const latestPoint = chartData.at(-1);

  const scoreCards = [
    {
      label: "Overall",
      score: overall.score ?? 50,
      note: overall.recommendation || "HOLD",
      icon: Gauge,
    },
    {
      label: "Fundamental",
      score: fundamental.score ?? 50,
      note: fundamental.recommendation || "HOLD",
      icon: BarChart3,
    },
    {
      label: "Technical",
      score: technical.score ?? 50,
      note: technical.recommendation || "HOLD",
      icon: ArrowRight,
    },
    {
      label: "Sentiment",
      score: sentiment.score ?? 50,
      note: sentiment.source || "News",
      icon: Newspaper,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9f8] px-6 py-8 text-[#2d3433] md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 rounded-[28px] border border-[#e6e0db] bg-white p-7 shadow-[0_20px_60px_rgba(55,49,45,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button asChild variant="ghost" className="h-10 rounded-xl px-3 text-[#5f5e5e] hover:bg-[#f5f1ee]">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
            <p className="text-sm text-[#6a706f]">Source: {stockData?.source || "Unknown data source"}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7b7f7f]">
                  Migrated Analysis Route
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#5f5e5e] md:text-5xl">
                  {normalizedSymbol} analysis
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-[#636968]">
                  This screen is powered by the new root market data layer and extracted analysis
                  services. It is the first end-to-end slice back on the App Router.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {TIMEFRAMES.map((candidate) => (
                  <Button
                    key={candidate}
                    asChild
                    variant="outline"
                    className={`h-10 rounded-xl border-[#d7d1cc] px-4 ${
                      candidate === timeframe ? "bg-[#5f5e5e] text-white hover:bg-[#4f4e4e]" : "bg-white text-[#5f5e5e]"
                    }`}
                  >
                    <Link href={`/analysis/${encodeURIComponent(normalizedSymbol)}?tf=${candidate}`}>{candidate}</Link>
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-[#ece6e1] bg-[#fbf8f6] p-5">
              <p className="mb-3 text-sm font-medium text-[#6a706f]">Search another symbol</p>
              <SymbolSearch compact submitLabel="Go" initialQuery={normalizedSymbol} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {scoreCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-[22px] border border-[#e6e0db] bg-white p-5 shadow-[0_12px_32px_rgba(55,49,45,0.04)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#6a706f]">{card.label}</span>
                  <div className="rounded-2xl bg-[#f1ece8] p-2 text-[#5f5e5e]">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-end gap-3">
                  <p className="text-4xl font-semibold text-[#4f4e4e]">{card.score}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getTone(card.score)}`}>
                    {card.note}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-[24px] border border-[#e6e0db] bg-white p-6 shadow-[0_12px_32px_rgba(55,49,45,0.04)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[#4f4e4e]">Price history</h2>
                <p className="text-sm text-[#6a706f]">
                  {chartData.length} points loaded from {stockData?.source || "the active provider"}.
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#6a706f]">Latest close</p>
                <p className="text-2xl font-semibold text-[#4f4e4e]">
                  {latestPoint?.close ? `$${Number(latestPoint.close).toFixed(2)}` : "Unavailable"}
                </p>
              </div>
            </div>
            <PriceHistoryChart data={chartData} />
          </div>

          <div className="rounded-[24px] border border-[#e6e0db] bg-white p-6 shadow-[0_12px_32px_rgba(55,49,45,0.04)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#f1ece8] p-3 text-[#5f5e5e]">
                <MessageSquareText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#4f4e4e]">Summary</h2>
                <p className="text-sm text-[#6a706f]">Blended output from extracted root analysis services.</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-[#4b514f]">{summary}</p>

            <dl className="mt-6 grid grid-cols-2 gap-4 rounded-[20px] bg-[#fbf8f6] p-4 text-sm">
              <div>
                <dt className="text-[#7b7f7f]">Timeframe</dt>
                <dd className="mt-1 font-medium text-[#4f4e4e]">{timeframe}</dd>
              </div>
              <div>
                <dt className="text-[#7b7f7f]">Weights</dt>
                <dd className="mt-1 font-medium text-[#4f4e4e]">
                  F {weights.fundamental}% / T {weights.technical}% / S {weights.sentiment}%
                </dd>
              </div>
              <div>
                <dt className="text-[#7b7f7f]">Recommendation</dt>
                <dd className="mt-1 font-medium text-[#4f4e4e]">{overall.recommendation || "HOLD"}</dd>
              </div>
              <div>
                <dt className="text-[#7b7f7f]">Data source</dt>
                <dd className="mt-1 font-medium text-[#4f4e4e]">{stockData?.source || "Unknown"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
