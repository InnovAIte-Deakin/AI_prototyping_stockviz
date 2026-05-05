import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export const PROVIDER_CAPABILITIES = [
  "stock_ohlcv",
  "stock_price_series",
  "fundamentals",
  "symbol_search",
  "sentiment_news",
] as const;

export type ProviderCapability = (typeof PROVIDER_CAPABILITIES)[number];

export const PROVIDER_IDS = [
  "yahooFinance",
  "twelveData",
  "polygon",
  "alphaVantage",
  "fmp",
  "finnhub",
] as const;

export type ProviderId = (typeof PROVIDER_IDS)[number];

export type ProviderOption = {
  id: ProviderId;
  label: string;
  requiresEnv?: string;
};

export type ProviderPreference = {
  capability: ProviderCapability;
  fallbackEnabled: boolean;
  provider: ProviderId;
  updatedAt: string | null;
  updatedBy: string | null;
};

type ProviderPreferenceRow = {
  capability: string;
  fallback_enabled: boolean;
  provider: string;
  updated_at: string | null;
  updated_by: string | null;
};

const CACHE_TTL_MS = 30_000;

let preferenceCache:
  | {
      expiresAt: number;
      preferences: Record<ProviderCapability, ProviderPreference>;
    }
  | null = null;

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  alphaVantage: "Alpha Vantage",
  finnhub: "Finnhub",
  fmp: "Financial Modeling Prep",
  polygon: "Polygon.io",
  twelveData: "Twelve Data",
  yahooFinance: "Yahoo Finance",
};

export const PROVIDER_CAPABILITY_LABELS: Record<ProviderCapability, string> = {
  fundamentals: "Fundamentals",
  sentiment_news: "Sentiment/news",
  stock_ohlcv: "Stock OHLCV / analysis chart",
  stock_price_series: "Stock detail price history",
  symbol_search: "Symbol search",
};

export const PROVIDER_CAPABILITY_OPTIONS: Record<
  ProviderCapability,
  ProviderOption[]
> = {
  stock_ohlcv: [
    { id: "yahooFinance", label: PROVIDER_LABELS.yahooFinance },
    {
      id: "twelveData",
      label: PROVIDER_LABELS.twelveData,
      requiresEnv: "TWELVE_DATA_API_KEY",
    },
    {
      id: "polygon",
      label: PROVIDER_LABELS.polygon,
      requiresEnv: "POLYGON_API_KEY",
    },
    {
      id: "alphaVantage",
      label: PROVIDER_LABELS.alphaVantage,
      requiresEnv: "ALPHA_VANTAGE_API_KEY",
    },
  ],
  stock_price_series: [
    { id: "yahooFinance", label: PROVIDER_LABELS.yahooFinance },
    {
      id: "alphaVantage",
      label: PROVIDER_LABELS.alphaVantage,
      requiresEnv: "ALPHA_VANTAGE_API_KEY",
    },
  ],
  fundamentals: [
    { id: "yahooFinance", label: PROVIDER_LABELS.yahooFinance },
    { id: "fmp", label: PROVIDER_LABELS.fmp, requiresEnv: "FMP_API_KEY" },
    {
      id: "finnhub",
      label: PROVIDER_LABELS.finnhub,
      requiresEnv: "FINNHUB_API_KEY",
    },
    {
      id: "alphaVantage",
      label: PROVIDER_LABELS.alphaVantage,
      requiresEnv: "ALPHA_VANTAGE_API_KEY",
    },
  ],
  symbol_search: [
    { id: "yahooFinance", label: PROVIDER_LABELS.yahooFinance },
    {
      id: "finnhub",
      label: PROVIDER_LABELS.finnhub,
      requiresEnv: "FINNHUB_API_KEY",
    },
    {
      id: "twelveData",
      label: PROVIDER_LABELS.twelveData,
      requiresEnv: "TWELVE_DATA_API_KEY",
    },
    {
      id: "alphaVantage",
      label: PROVIDER_LABELS.alphaVantage,
      requiresEnv: "ALPHA_VANTAGE_API_KEY",
    },
  ],
  sentiment_news: [
    {
      id: "alphaVantage",
      label: PROVIDER_LABELS.alphaVantage,
      requiresEnv: "ALPHA_VANTAGE_API_KEY",
    },
  ],
};

export const DEFAULT_PROVIDER_PREFERENCES: Record<
  ProviderCapability,
  ProviderPreference
> = {
  fundamentals: {
    capability: "fundamentals",
    fallbackEnabled: true,
    provider: "yahooFinance",
    updatedAt: null,
    updatedBy: null,
  },
  sentiment_news: {
    capability: "sentiment_news",
    fallbackEnabled: true,
    provider: "alphaVantage",
    updatedAt: null,
    updatedBy: null,
  },
  stock_ohlcv: {
    capability: "stock_ohlcv",
    fallbackEnabled: true,
    provider: "yahooFinance",
    updatedAt: null,
    updatedBy: null,
  },
  stock_price_series: {
    capability: "stock_price_series",
    fallbackEnabled: true,
    provider: "yahooFinance",
    updatedAt: null,
    updatedBy: null,
  },
  symbol_search: {
    capability: "symbol_search",
    fallbackEnabled: true,
    provider: "yahooFinance",
    updatedAt: null,
    updatedBy: null,
  },
};

const isProviderCapability = (value: string): value is ProviderCapability =>
  (PROVIDER_CAPABILITIES as readonly string[]).includes(value);

const isProviderAllowedForCapability = (
  capability: ProviderCapability,
  provider: string,
): provider is ProviderId =>
  PROVIDER_CAPABILITY_OPTIONS[capability].some(
    (option) => option.id === provider,
  );

export const buildProviderOrder = (
  capability: ProviderCapability,
  selectedProvider: string,
  fallbackEnabled: boolean,
): ProviderId[] => {
  const defaultOrder = PROVIDER_CAPABILITY_OPTIONS[capability].map(
    (option) => option.id,
  );
  const preferred = isProviderAllowedForCapability(capability, selectedProvider)
    ? selectedProvider
    : DEFAULT_PROVIDER_PREFERENCES[capability].provider;

  if (!fallbackEnabled) {
    return [preferred];
  }

  return [preferred, ...defaultOrder.filter((provider) => provider !== preferred)];
};

export const normalizeProviderPreferenceRows = (
  rows: ProviderPreferenceRow[],
): Record<ProviderCapability, ProviderPreference> => {
  const normalized: Record<ProviderCapability, ProviderPreference> = {
    fundamentals: { ...DEFAULT_PROVIDER_PREFERENCES.fundamentals },
    sentiment_news: { ...DEFAULT_PROVIDER_PREFERENCES.sentiment_news },
    stock_ohlcv: { ...DEFAULT_PROVIDER_PREFERENCES.stock_ohlcv },
    stock_price_series: { ...DEFAULT_PROVIDER_PREFERENCES.stock_price_series },
    symbol_search: { ...DEFAULT_PROVIDER_PREFERENCES.symbol_search },
  };

  for (const row of rows) {
    if (!isProviderCapability(row.capability)) {
      continue;
    }
    if (!isProviderAllowedForCapability(row.capability, row.provider)) {
      continue;
    }

    normalized[row.capability] = {
      capability: row.capability,
      fallbackEnabled: row.fallback_enabled,
      provider: row.provider,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
    };
  }

  return normalized;
};

export const resetProviderPreferencesCache = () => {
  preferenceCache = null;
};

export async function getProviderPreferences(options?: {
  forceRefresh?: boolean;
}): Promise<Record<ProviderCapability, ProviderPreference>> {
  const now = Date.now();
  if (
    !options?.forceRefresh &&
    preferenceCache &&
    preferenceCache.expiresAt > now
  ) {
    return preferenceCache.preferences;
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("provider_preferences")
      .select("capability, provider, fallback_enabled, updated_at, updated_by");

    if (error) {
      throw error;
    }

    const preferences = normalizeProviderPreferenceRows(data || []);
    preferenceCache = {
      expiresAt: now + CACHE_TTL_MS,
      preferences,
    };
    return preferences;
  } catch {
    return DEFAULT_PROVIDER_PREFERENCES;
  }
}

export async function saveProviderPreferences(input: {
  preferences: Array<{
    capability: string;
    provider: string;
  }>;
  updatedBy: string;
}): Promise<Record<ProviderCapability, ProviderPreference>> {
  const rows = input.preferences.map((preference) => {
    if (!isProviderCapability(preference.capability)) {
      throw new Error(`Unsupported provider capability: ${preference.capability}`);
    }
    if (
      !isProviderAllowedForCapability(
        preference.capability,
        preference.provider,
      )
    ) {
      throw new Error(
        `${preference.provider} is not supported for ${preference.capability}`,
      );
    }

    return {
      capability: preference.capability,
      fallback_enabled: true,
      provider: preference.provider,
      updated_by: input.updatedBy,
      updated_at: new Date().toISOString(),
    };
  });

  const supabase = createAdminClient();
  const { error } = await supabase.from("provider_preferences").upsert(rows, {
    onConflict: "capability",
  });

  if (error) {
    throw error;
  }

  resetProviderPreferencesCache();
  return getProviderPreferences({ forceRefresh: true });
}
