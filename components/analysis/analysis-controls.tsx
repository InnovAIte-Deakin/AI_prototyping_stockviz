"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, SlidersHorizontal } from "lucide-react";

import { IndicatorsPanel } from "@/components/analysis/indicators-panel";
import { WeightsPanel } from "@/components/analysis/weights-panel";
import { Button } from "@/components/ui/button";
import type {
  AnalysisWeights,
  IndicatorConfig,
  IndicatorDefaults,
  IndicatorGroups,
} from "@/lib/url-state";
import {
  DEFAULT_ANALYSIS_WEIGHTS,
  areIndicatorConfigsEqual,
  areWeightsEqual,
  buildAnalysisSearchParams,
  getEnabledIndicatorNames,
  normalizeIndicatorConfig,
  normalizeWeights,
} from "@/lib/url-state";

type AnalysisControlsProps = {
  symbol: string;
  timeframe: string;
  weights: AnalysisWeights;
  indicatorConfig: IndicatorConfig;
  defaultIndicatorConfig: IndicatorDefaults;
  availableIndicators: IndicatorGroups;
};

export function AnalysisControls({
  symbol,
  timeframe,
  weights,
  indicatorConfig,
  defaultIndicatorConfig,
  availableIndicators,
}: AnalysisControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [draftWeights, setDraftWeights] = React.useState(weights);
  const [draftIndicatorConfig, setDraftIndicatorConfig] =
    React.useState(indicatorConfig);

  React.useEffect(() => {
    setDraftWeights(weights);
  }, [weights]);

  React.useEffect(() => {
    setDraftIndicatorConfig(indicatorConfig);
  }, [indicatorConfig]);

  const normalizedDraftWeights = normalizeWeights(draftWeights);
  const defaultIndicators = normalizeIndicatorConfig(
    {},
    defaultIndicatorConfig,
    availableIndicators,
  );
  const hasChanges =
    !areWeightsEqual(normalizedDraftWeights, weights) ||
    !areIndicatorConfigsEqual(
      draftIndicatorConfig,
      indicatorConfig,
      defaultIndicatorConfig,
      availableIndicators,
    );
  const enabledIndicators = getEnabledIndicatorNames(draftIndicatorConfig);

  const navigateWithState = (
    nextWeights: AnalysisWeights,
    nextIndicatorConfig: IndicatorConfig,
  ) => {
    const nextSearchParams = buildAnalysisSearchParams({
      timeframe,
      weights: nextWeights,
      indicatorConfig: nextIndicatorConfig,
      defaultIndicatorConfig,
      availableIndicators,
    });
    const query = nextSearchParams.toString();
    const href = query
      ? `/analysis/${encodeURIComponent(symbol)}?${query}`
      : `/analysis/${encodeURIComponent(symbol)}`;

    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  };

  return (
    <div className="rounded-[24px] border border-[#e6e0db] bg-white p-6 shadow-[0_12px_32px_rgba(55,49,45,0.04)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7b7f7f]">
            Analysis Controls
          </p>
          <h2 className="text-2xl font-semibold text-[#4f4e4e]">
            Re-run the analysis with custom inputs
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-[#6a706f]">
            The result stays server-rendered, but your timeframe, weights, and
            indicator settings now live in the URL so they can be refreshed and
            shared.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-[#d7d1cc] px-4 text-[#5f5e5e]"
            onClick={() => {
              setDraftWeights(DEFAULT_ANALYSIS_WEIGHTS);
              setDraftIndicatorConfig(defaultIndicators);
              navigateWithState(DEFAULT_ANALYSIS_WEIGHTS, defaultIndicators);
            }}
            disabled={isPending}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            type="button"
            className="h-10 rounded-xl bg-[#5f5e5e] px-4 text-white hover:bg-[#4f4e4e]"
            onClick={() =>
              navigateWithState(normalizedDraftWeights, draftIndicatorConfig)
            }
            disabled={!hasChanges || isPending}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            {isPending ? "Applying..." : "Apply controls"}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <WeightsPanel value={draftWeights} onChange={setDraftWeights} />
        <IndicatorsPanel
          value={draftIndicatorConfig}
          onChange={setDraftIndicatorConfig}
          availableIndicators={availableIndicators}
          defaultIndicatorConfig={defaultIndicatorConfig}
        />
      </div>

      <div className="mt-6 flex flex-col gap-2 rounded-[20px] border border-[#ece6e1] bg-[#fbf8f6] px-4 py-3 text-sm text-[#6a706f] md:flex-row md:items-center md:justify-between">
        <p>
          Current timeframe:{" "}
          <span className="font-medium text-[#4f4e4e]">{timeframe}</span>
        </p>
        <p>
          Enabled indicators:{" "}
          <span className="font-medium text-[#4f4e4e]">
            {enabledIndicators.length > 0
              ? enabledIndicators.join(", ")
              : "None"}
          </span>
        </p>
      </div>
    </div>
  );
}
