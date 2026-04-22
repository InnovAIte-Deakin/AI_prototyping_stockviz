"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type {
  IndicatorConfig,
  IndicatorDefaults,
  IndicatorGroups,
} from "@/lib/url-state";

type IndicatorsPanelProps = {
  value: IndicatorConfig;
  onChange: (indicatorConfig: IndicatorConfig) => void;
  availableIndicators: IndicatorGroups;
  defaultIndicatorConfig: IndicatorDefaults;
};

const titleCase = (value: string): string =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());

export function IndicatorsPanel({
  value,
  onChange,
  availableIndicators,
  defaultIndicatorConfig,
}: IndicatorsPanelProps) {
  const groupKeys = Object.keys(availableIndicators);

  return (
    <div className="rounded-[22px] border border-[#ece6e1] bg-[#fbf8f6] p-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7b7f7f]">
          Indicators
        </p>
        <h2 className="text-xl font-semibold text-[#4f4e4e]">
          Control technical inputs
        </h2>
        <p className="text-sm leading-6 text-[#6a706f]">
          Toggle indicator families on or off and fine-tune the periods used by
          the technical-analysis service.
        </p>
      </div>

      <Accordion type="multiple" defaultValue={groupKeys} className="mt-5">
        {groupKeys.map((groupKey) => {
          const indicators = availableIndicators[groupKey] ?? [];
          const enabledCount = indicators.filter(
            (indicator) => value[indicator]?.enabled !== false,
          ).length;

          return (
            <AccordionItem
              key={groupKey}
              value={groupKey}
              className="border-none py-1"
            >
              <AccordionTrigger className="rounded-[18px] border border-[#e7dfd9] bg-white px-4 py-3 no-underline hover:no-underline">
                <div>
                  <p className="text-sm font-medium text-[#4f4e4e]">
                    {titleCase(groupKey)}
                  </p>
                  <p className="mt-1 text-xs text-[#7b7f7f]">
                    {enabledCount} of {indicators.length} enabled
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-3">
                {indicators.map((indicator) => {
                  const indicatorConfig = value[indicator] ?? { enabled: true };
                  const defaultEntry = defaultIndicatorConfig[indicator] ?? {
                    enabled: true,
                  };
                  const parameterEntries = Object.entries(defaultEntry).filter(
                    ([key, rawValue]) =>
                      key !== "enabled" && typeof rawValue === "number",
                  );
                  const isEnabled = indicatorConfig.enabled !== false;

                  return (
                    <div
                      key={indicator}
                      className={`rounded-[18px] border border-[#e7dfd9] bg-white p-4 transition ${
                        isEnabled ? "" : "opacity-75"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-[#4f4e4e]">
                            {indicator}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[#6a706f]">
                            {parameterEntries.length > 0
                              ? "Tune the calculation periods for this indicator."
                              : "This indicator currently uses its built-in defaults only."}
                          </p>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) =>
                            onChange({
                              ...value,
                              [indicator]: {
                                ...indicatorConfig,
                                enabled: checked === true,
                              },
                            })
                          }
                          aria-label={`Toggle ${indicator}`}
                        />
                      </div>

                      {parameterEntries.length > 0 ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {parameterEntries.map(([key, defaultValue]) => (
                            <label key={key} className="grid gap-1.5">
                              <span className="text-xs font-medium text-[#7b7f7f]">
                                {titleCase(key)}
                              </span>
                              <Input
                                type="number"
                                min={1}
                                step={1}
                                disabled={!isEnabled}
                                value={String(
                                  indicatorConfig[key] ?? defaultValue,
                                )}
                                onChange={(event) => {
                                  const nextValue = Number(event.target.value);

                                  onChange({
                                    ...value,
                                    [indicator]: {
                                      ...indicatorConfig,
                                      [key]:
                                        Number.isFinite(nextValue) &&
                                        nextValue > 0
                                          ? nextValue
                                          : defaultValue,
                                    },
                                  });
                                }}
                              />
                            </label>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
