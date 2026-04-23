export {
  DEFAULT_USER_PREFERENCES,
  USER_CURRENCIES,
  USER_RISK_PROFILES,
  USER_TIMEFRAMES,
  normalizeUserPreferences,
  type UserCurrency,
  type UserDefaultTimeframe,
  type UserPreferences,
  type UserRiskProfile,
} from "@/lib/user/preferences";
import {
  normalizeUserPreferences,
  preferencesToJson,
  type UserPreferences,
} from "@/lib/user/preferences";
import { requireUserFeatureContext } from "@/lib/user/session";

export async function getPreferencesForCurrentUser(): Promise<UserPreferences> {
  const { supabase, user } = await requireUserFeatureContext();

  const { data, error } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Could not load user preferences.");
  }

  return normalizeUserPreferences(data?.preferences ?? null);
}

export async function updatePreferencesForCurrentUser(
  preferences: UserPreferences,
): Promise<UserPreferences> {
  const { supabase, user } = await requireUserFeatureContext();
  const normalized = normalizeUserPreferences(preferencesToJson(preferences));

  const { data, error } = await supabase
    .from("profiles")
    .update({ preferences: preferencesToJson(normalized) })
    .eq("id", user.id)
    .select("preferences")
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Could not update user preferences.");
  }

  if (!data) {
    throw new Error("Profile not found or no longer accessible.");
  }

  return normalizeUserPreferences(data.preferences);
}
