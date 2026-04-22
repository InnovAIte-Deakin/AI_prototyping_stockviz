"use client";

import { BarChart3, Gauge, MessageSquareText } from "lucide-react";

import { Slider } from "@/components/ui/slider";
import type { AnalysisWeights } from "@/lib/url-state";
import { normalizeWeights } from "@/lib/url-state";

type WeightsPanelProps = {
  value: AnalysisWeights;
  onChange: (weights: AnalysisWeights) => void;
};

const presetWeights: Array<{
  name: string;
  description: string;
  weights: AnalysisWeights;
}> = [
  {
    name: "Balanced",
    description: "Keep a mixed multi-factor view across the full analysis.",
    weights: { fundamental: 40, technical: 35, sentiment: 25 },
  },
  {
    name: "Conservative Value",
    description: "Lean harder on fundamentals and intrinsic-value signals.",
    weights: { fundamental: 60, technical: 25, sentiment: 15 },
  },
  {
    name: "Technical Trader",
    description: "Bias the result toward chart structure and price action.",
    weights: { fundamental: 20, technical: 60, sentiment: 20 },
  },
  {
    name: "Sentiment Momentum",
    description: "Give more influence to news flow and market psychology.",
    weights: { fundamental: 25, technical: 30, sentiment: 45 },
  },
];

const weightRows: Array<{
  key: keyof AnalysisWeights;
  label: string;
  icon: typeof Gauge;
}> = [
  { key: "fundamental", label: "Fundamental", icon: Gauge },
  { key: "technical", label: "Technical", icon: BarChart3 },
  { key: "sentiment", label: "Sentiment", icon: MessageSquareText },
];

const getWeightingStyle = (weights: AnalysisWeights): string => {
  const normalized = normalizeWeights(weights);
  const max = Math.max(
    normalized.fundamental,
    normalized.technical,
    normalized.sentiment,
  );

  if (normalized.fundamental === max && max > 40) {
    return "Fundamental value investing";
  }

  if (normalized.technical === max && max > 40) {
    return "Technical trading signals";
  }

  if (normalized.sentiment === max && max > 40) {
    return "Market sentiment and psychology";
  }

  return "Balanced multi-factor approach";
};

export function WeightsPanel({ value, onChange }: WeightsPanelProps) {
  const normalizedWeights = normalizeWeights(value);

  return (
    <div className="rounded-[22px] border border-[#ece6e1] bg-[#fbf8f6] p-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7b7f7f]">
          Weighting
        </p>
        <h2 className="text-xl font-semibold text-[#4f4e4e]">
          Adjust analysis influence
        </h2>
        <p className="text-sm leading-6 text-[#6a706f]">
          Tune how much each analysis pillar contributes before you rerun the
          server-side result.
        </p>
      </div>

      <div className="mt-5 space-y-5">
        {weightRows.map((row) => {
          const Icon = row.icon;
          const normalizedValue = normalizedWeights[row.key];

          return (
            <div key={row.key} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-white p-2 text-[#5f5e5e] shadow-[0_6px_18px_rgba(55,49,45,0.06)]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#4f4e4e]">
                      {row.label}
                    </p>
                    <p className="text-xs text-[#7b7f7f]">
                      Applied weight: {normalizedValue}%
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-[#4f4e4e]">
                  {value[row.key]}
                </span>
              </div>

              <Slider
                min={0}
                max={100}
                step={1}
                value={[value[row.key]]}
                onValueChange={(nextValue) =>
                  onChange({
                    ...value,
                    [row.key]: nextValue[0] ?? value[row.key],
                  })
                }
              />
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-[18px] border border-[#e7dfd9] bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b7f7f]">
          Current profile
        </p>
        <p className="mt-2 text-sm font-medium text-[#4f4e4e]">
          {getWeightingStyle(value)}
        </p>
        <p className="mt-1 text-sm text-[#6a706f]">
          Normalized to F {normalizedWeights.fundamental}% / T{" "}
          {normalizedWeights.technical}% / S {normalizedWeights.sentiment}%.
        </p>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b7f7f]">
          Quick presets
        </p>
        <div className="mt-3 grid gap-2">
          {presetWeights.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => onChange(preset.weights)}
              className="rounded-[18px] border border-[#e7dfd9] bg-white px-4 py-3 text-left transition hover:border-[#d7cfc8] hover:bg-[#fffdfb]"
            >
              <p className="text-sm font-medium text-[#4f4e4e]">
                {preset.name}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#6a706f]">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
