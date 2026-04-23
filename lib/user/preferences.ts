import type { Json } from "@/lib/database.types";

export const USER_TIMEFRAMES = ["1D", "1W", "1M", "3M", "6M", "1Y"] as const;
export const USER_CURRENCIES = ["USD", "AUD", "EUR", "GBP", "CAD"] as const;
export const USER_RISK_PROFILES = [
  "balanced",
  "conservative",
  "growth",
  "income",
] as const;

export type UserDefaultTimeframe = (typeof USER_TIMEFRAMES)[number];
export type UserCurrency = (typeof USER_CURRENCIES)[number];
export type UserRiskProfile = (typeof USER_RISK_PROFILES)[number];

export type UserPreferences = {
  defaultTimeframe: UserDefaultTimeframe;
  currency: UserCurrency;
  riskProfile: UserRiskProfile;
  defaultWeights: {
    fundamental: number;
    technical: number;
    sentiment: number;
  };
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  defaultTimeframe: "1M",
  currency: "USD",
  riskProfile: "balanced",
  defaultWeights: {
    fundamental: 40,
    technical: 35,
    sentiment: 25,
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isOneOf = <T extends readonly string[]>(
  value: unknown,
  allowed: T,
): value is T[number] =>
  typeof value === "string" && (allowed as readonly string[]).includes(value);

const normalizeWeight = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100
    ? Math.round(parsed)
    : fallback;
};

export const preferencesToJson = (preferences: UserPreferences): Json => ({
  defaultTimeframe: preferences.defaultTimeframe,
  currency: preferences.currency,
  riskProfile: preferences.riskProfile,
  defaultWeights: {
    fundamental: preferences.defaultWeights.fundamental,
    technical: preferences.defaultWeights.technical,
    sentiment: preferences.defaultWeights.sentiment,
  },
});

export function normalizeUserPreferences(value: Json | null): UserPreferences {
  const source = isRecord(value) ? value : {};
  const weights = isRecord(source.defaultWeights) ? source.defaultWeights : {};

  return {
    defaultTimeframe: isOneOf(source.defaultTimeframe, USER_TIMEFRAMES)
      ? source.defaultTimeframe
      : DEFAULT_USER_PREFERENCES.defaultTimeframe,
    currency: isOneOf(source.currency, USER_CURRENCIES)
      ? source.currency
      : DEFAULT_USER_PREFERENCES.currency,
    riskProfile: isOneOf(source.riskProfile, USER_RISK_PROFILES)
      ? source.riskProfile
      : DEFAULT_USER_PREFERENCES.riskProfile,
    defaultWeights: {
      fundamental: normalizeWeight(
        weights.fundamental,
        DEFAULT_USER_PREFERENCES.defaultWeights.fundamental,
      ),
      technical: normalizeWeight(
        weights.technical,
        DEFAULT_USER_PREFERENCES.defaultWeights.technical,
      ),
      sentiment: normalizeWeight(
        weights.sentiment,
        DEFAULT_USER_PREFERENCES.defaultWeights.sentiment,
      ),
    },
  };
}
