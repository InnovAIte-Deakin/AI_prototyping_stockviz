export const DEFAULT_ANALYSIS_TIMEFRAME = "1M";

export const DEFAULT_ANALYSIS_WEIGHTS: AnalysisWeights = {
  fundamental: 40,
  technical: 35,
  sentiment: 25,
};

export type AnalysisWeights = {
  fundamental: number;
  technical: number;
  sentiment: number;
};

export type RawAnalysisWeights = Partial<
  Record<keyof AnalysisWeights, number | string>
>;

export type SearchParamValue = string | string[] | undefined;

export type IndicatorGroups = Record<string, string[]>;

export type IndicatorDefaults = Record<
  string,
  Record<string, number | boolean | undefined>
>;

export type IndicatorConfigEntry = {
  enabled?: boolean;
  [key: string]: number | boolean | undefined;
};

export type IndicatorConfig = Record<string, IndicatorConfigEntry>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const getSingleSearchParam = (
  value: SearchParamValue,
): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return typeof value === "string" ? value : undefined;
};

export const normalizeWeights = (
  rawWeights?: RawAnalysisWeights | null,
  defaults: AnalysisWeights = DEFAULT_ANALYSIS_WEIGHTS,
): AnalysisWeights => {
  const fundamental = Number(rawWeights?.fundamental ?? defaults.fundamental);
  const technical = Number(rawWeights?.technical ?? defaults.technical);
  const sentiment = Number(rawWeights?.sentiment ?? defaults.sentiment);

  if (
    Number.isNaN(fundamental) ||
    Number.isNaN(technical) ||
    Number.isNaN(sentiment)
  ) {
    return { ...defaults };
  }

  if (fundamental < 0 || technical < 0 || sentiment < 0) {
    return { ...defaults };
  }

  const total = fundamental + technical + sentiment;
  if (total === 0) {
    return { ...defaults };
  }

  const normalized = {
    fundamental: Math.round((fundamental / total) * 100),
    technical: Math.round((technical / total) * 100),
    sentiment: Math.round((sentiment / total) * 100),
  };

  const normalizedTotal =
    normalized.fundamental + normalized.technical + normalized.sentiment;

  if (normalizedTotal !== 100) {
    normalized.fundamental += 100 - normalizedTotal;
  }

  return normalized;
};

export const areWeightsEqual = (
  left: AnalysisWeights,
  right: AnalysisWeights = DEFAULT_ANALYSIS_WEIGHTS,
): boolean =>
  left.fundamental === right.fundamental &&
  left.technical === right.technical &&
  left.sentiment === right.sentiment;

const getSupportedIndicatorNames = (
  availableIndicators: IndicatorGroups,
  defaultIndicatorConfig: IndicatorDefaults,
): string[] => {
  const fromGroups = Object.values(availableIndicators).flat();
  return Array.from(
    new Set([...fromGroups, ...Object.keys(defaultIndicatorConfig)]),
  ).sort();
};

export const normalizeIndicatorConfig = (
  rawConfig: unknown,
  defaultIndicatorConfig: IndicatorDefaults,
  availableIndicators: IndicatorGroups,
): IndicatorConfig => {
  const normalized: IndicatorConfig = {};

  for (const indicator of getSupportedIndicatorNames(
    availableIndicators,
    defaultIndicatorConfig,
  )) {
    const defaults = {
      enabled: true,
      ...(defaultIndicatorConfig[indicator] ?? {}),
    };
    const rawEntry =
      isRecord(rawConfig) && isRecord(rawConfig[indicator])
        ? rawConfig[indicator]
        : {};

    const nextEntry: IndicatorConfigEntry = {
      enabled: rawEntry.enabled === false ? false : defaults.enabled !== false,
    };

    for (const [key, defaultValue] of Object.entries(defaults)) {
      if (key === "enabled") {
        continue;
      }

      if (typeof defaultValue === "number") {
        const candidate = Number(rawEntry[key]);
        nextEntry[key] =
          Number.isFinite(candidate) && candidate > 0
            ? candidate
            : defaultValue;
      }
    }

    normalized[indicator] = nextEntry;
  }

  return normalized;
};

const compactIndicatorConfig = (
  indicatorConfig: IndicatorConfig,
  defaultIndicatorConfig: IndicatorDefaults,
  availableIndicators: IndicatorGroups,
): IndicatorConfig | null => {
  const normalized = normalizeIndicatorConfig(
    indicatorConfig,
    defaultIndicatorConfig,
    availableIndicators,
  );
  const defaults = normalizeIndicatorConfig(
    {},
    defaultIndicatorConfig,
    availableIndicators,
  );
  const compact: IndicatorConfig = {};

  for (const indicator of getSupportedIndicatorNames(
    availableIndicators,
    defaultIndicatorConfig,
  )) {
    const current = normalized[indicator];
    const baseline = defaults[indicator];
    const nextEntry: IndicatorConfigEntry = {};

    if ((current.enabled ?? true) !== (baseline.enabled ?? true)) {
      nextEntry.enabled = current.enabled;
    }

    for (const [key, value] of Object.entries(current)) {
      if (key === "enabled" || typeof value !== "number") {
        continue;
      }

      if (value !== baseline[key]) {
        nextEntry[key] = value;
      }
    }

    if (Object.keys(nextEntry).length > 0) {
      compact[indicator] = nextEntry;
    }
  }

  return Object.keys(compact).length > 0 ? compact : null;
};

export const encodeIndicatorConfig = (
  indicatorConfig: IndicatorConfig,
  defaultIndicatorConfig: IndicatorDefaults,
  availableIndicators: IndicatorGroups,
): string | null => {
  const compact = compactIndicatorConfig(
    indicatorConfig,
    defaultIndicatorConfig,
    availableIndicators,
  );

  return compact ? JSON.stringify(compact) : null;
};

export const decodeIndicatorConfig = (
  value: SearchParamValue,
  defaultIndicatorConfig: IndicatorDefaults,
  availableIndicators: IndicatorGroups,
): IndicatorConfig => {
  const rawValue = getSingleSearchParam(value);

  if (!rawValue) {
    return normalizeIndicatorConfig(
      {},
      defaultIndicatorConfig,
      availableIndicators,
    );
  }

  try {
    const parsed = JSON.parse(rawValue);
    return normalizeIndicatorConfig(
      parsed,
      defaultIndicatorConfig,
      availableIndicators,
    );
  } catch {
    return normalizeIndicatorConfig(
      {},
      defaultIndicatorConfig,
      availableIndicators,
    );
  }
};

export const areIndicatorConfigsEqual = (
  left: IndicatorConfig,
  right: IndicatorConfig,
  defaultIndicatorConfig: IndicatorDefaults,
  availableIndicators: IndicatorGroups,
): boolean =>
  encodeIndicatorConfig(left, defaultIndicatorConfig, availableIndicators) ===
  encodeIndicatorConfig(right, defaultIndicatorConfig, availableIndicators);

export const getEnabledIndicatorNames = (
  indicatorConfig: IndicatorConfig,
): string[] =>
  Object.entries(indicatorConfig)
    .filter(([, entry]) => entry.enabled !== false)
    .map(([indicator]) => indicator)
    .sort();

export const buildAnalysisSearchParams = ({
  timeframe,
  weights,
  indicatorConfig,
  defaultIndicatorConfig,
  availableIndicators,
  defaultTimeframe = DEFAULT_ANALYSIS_TIMEFRAME,
}: {
  timeframe?: string;
  weights?: RawAnalysisWeights | null;
  indicatorConfig: IndicatorConfig;
  defaultIndicatorConfig: IndicatorDefaults;
  availableIndicators: IndicatorGroups;
  defaultTimeframe?: string;
}): URLSearchParams => {
  const params = new URLSearchParams();
  const normalizedWeights = normalizeWeights(weights);

  if (timeframe && timeframe !== defaultTimeframe) {
    params.set("tf", timeframe);
  }

  if (!areWeightsEqual(normalizedWeights)) {
    params.set("wf", String(normalizedWeights.fundamental));
    params.set("wt", String(normalizedWeights.technical));
    params.set("ws", String(normalizedWeights.sentiment));
  }

  const encodedIndicators = encodeIndicatorConfig(
    indicatorConfig,
    defaultIndicatorConfig,
    availableIndicators,
  );
  if (encodedIndicators) {
    params.set("ic", encodedIndicators);
  }

  return params;
};
