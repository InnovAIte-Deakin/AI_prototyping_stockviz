"use server";

import { revalidatePath } from "next/cache";

import {
  DEFAULT_USER_PREFERENCES,
  USER_CURRENCIES,
  USER_RISK_PROFILES,
  USER_TIMEFRAMES,
  updatePreferencesForCurrentUser,
  type UserCurrency,
  type UserDefaultTimeframe,
  type UserPreferences,
  type UserRiskProfile,
} from "@/lib/user/preferences-service";
import { UserFeatureAuthError } from "@/lib/user/session";
import {
  createWishlistItemForCurrentUser,
  deleteWishlistItemForCurrentUser,
  updateWishlistItemForCurrentUser,
} from "@/lib/user/wishlist-service";

type UserFieldName =
  | "currency"
  | "defaultTimeframe"
  | "exchangeMic"
  | "fundamentalWeight"
  | "notes"
  | "riskProfile"
  | "sentimentWeight"
  | "stockName"
  | "symbol"
  | "technicalWeight"
  | "wishlistId";

export type UserActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<UserFieldName, string>>;
  saved?: boolean;
  submittedAt?: number;
  symbol?: string;
  wishlistId?: string | null;
  preferences?: UserPreferences;
};

export const INITIAL_USER_ACTION_STATE: UserActionState = {
  status: "idle",
  submittedAt: 0,
};

const symbolPattern = /^[A-Z0-9.\-]{1,15}$/;

const readTrimmedString = (formData: FormData, key: string): string => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const isOneOf = <T extends readonly string[]>(
  value: string,
  allowed: T,
): value is T[number] => allowed.includes(value);

const parseWeight = (
  formData: FormData,
  key: string,
  fieldName: UserFieldName,
  fieldErrors: NonNullable<UserActionState["fieldErrors"]>,
): number => {
  const raw = readTrimmedString(formData, key);
  const value = Number.parseInt(raw, 10);

  if (!raw) {
    fieldErrors[fieldName] = "Enter a weight.";
  } else if (!Number.isFinite(value) || value < 0 || value > 100) {
    fieldErrors[fieldName] = "Use a whole number from 0 to 100.";
  }

  return Number.isFinite(value) ? value : 0;
};

const revalidateUserFeaturePaths = (symbol?: string) => {
  revalidatePath("/portfolio");
  revalidatePath("/market");

  if (symbol) {
    revalidatePath(`/stock/${symbol}`);
    revalidatePath(`/analysis/${symbol}`);
  }
};

const mapUserActionError = (
  error: unknown,
  fallbackMessage: string,
): UserActionState => {
  if (error instanceof UserFeatureAuthError) {
    return {
      status: "error",
      message: "Your session has expired. Please sign in again.",
      submittedAt: Date.now(),
    };
  }

  if (error instanceof Error) {
    return {
      status: "error",
      message: error.message || fallbackMessage,
      submittedAt: Date.now(),
    };
  }

  return {
    status: "error",
    message: fallbackMessage,
    submittedAt: Date.now(),
  };
};

function parseWishlistFormData(formData: FormData) {
  const fieldErrors: NonNullable<UserActionState["fieldErrors"]> = {};
  const symbol = readTrimmedString(formData, "symbol").toUpperCase();
  const stockName = readTrimmedString(formData, "stockName");
  const exchangeMic = readTrimmedString(formData, "exchangeMic").toUpperCase();
  const notes = readTrimmedString(formData, "notes");

  if (!symbol) {
    fieldErrors.symbol = "Enter a symbol.";
  } else if (!symbolPattern.test(symbol)) {
    fieldErrors.symbol =
      "Use letters, numbers, dots, or hyphens only (max 15 characters).";
  }

  if (stockName.length > 200) {
    fieldErrors.stockName = "Stock name must be 200 characters or fewer.";
  }

  if (exchangeMic && !/^[A-Z0-9_:\-]{1,20}$/.test(exchangeMic)) {
    fieldErrors.exchangeMic =
      "Exchange MIC can use letters, numbers, underscores, colons, or hyphens.";
  }

  if (notes.length > 1000) {
    fieldErrors.notes = "Notes must be 1000 characters or fewer.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return {
    data: {
      symbol,
      name: stockName || null,
      exchangeMic: exchangeMic || null,
      notes: notes || null,
    },
  };
}

export async function createWishlistAction(
  _prevState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const parsed = parseWishlistFormData(formData);

  if (!parsed.data) {
    return {
      status: "error",
      message: "Please correct the highlighted fields and try again.",
      fieldErrors: parsed.fieldErrors,
      submittedAt: Date.now(),
    };
  }

  try {
    const item = await createWishlistItemForCurrentUser(parsed.data);
    revalidateUserFeaturePaths(item.stock.symbol);

    return {
      status: "success",
      message: `Saved ${item.stock.symbol} to your wishlist.`,
      saved: true,
      submittedAt: Date.now(),
      symbol: item.stock.symbol,
      wishlistId: item.id,
    };
  } catch (error) {
    return mapUserActionError(error, "Could not save this symbol right now.");
  }
}

export async function updateWishlistNotesAction(
  _prevState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const wishlistId = readTrimmedString(formData, "wishlistId");
  const symbol = readTrimmedString(formData, "symbol").toUpperCase();
  const notes = readTrimmedString(formData, "notes");

  if (!wishlistId) {
    return {
      status: "error",
      message: "Missing wishlist item identifier.",
      fieldErrors: {
        wishlistId: "Missing wishlist item identifier.",
      },
      submittedAt: Date.now(),
    };
  }

  if (notes.length > 1000) {
    return {
      status: "error",
      message: "Please correct the highlighted fields and try again.",
      fieldErrors: {
        notes: "Notes must be 1000 characters or fewer.",
      },
      submittedAt: Date.now(),
    };
  }

  try {
    const item = await updateWishlistItemForCurrentUser(
      wishlistId,
      notes || null,
    );
    revalidateUserFeaturePaths(item.stock.symbol);

    return {
      status: "success",
      message: `Updated ${item.stock.symbol} notes.`,
      saved: true,
      submittedAt: Date.now(),
      symbol: item.stock.symbol,
      wishlistId: item.id,
    };
  } catch (error) {
    return mapUserActionError(
      error,
      symbol
        ? `Could not update ${symbol} notes right now.`
        : "Could not update wishlist notes right now.",
    );
  }
}

export async function deleteWishlistAction(
  _prevState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const wishlistId = readTrimmedString(formData, "wishlistId");
  const symbol = readTrimmedString(formData, "symbol").toUpperCase();

  if (!wishlistId) {
    return {
      status: "error",
      message: "Missing wishlist item identifier.",
      fieldErrors: {
        wishlistId: "Missing wishlist item identifier.",
      },
      submittedAt: Date.now(),
    };
  }

  try {
    await deleteWishlistItemForCurrentUser(wishlistId);
    revalidateUserFeaturePaths(symbol);

    return {
      status: "success",
      message: symbol ? `Removed ${symbol} from your wishlist.` : "Removed.",
      saved: false,
      submittedAt: Date.now(),
      symbol,
      wishlistId: null,
    };
  } catch (error) {
    return mapUserActionError(error, "Could not remove this symbol right now.");
  }
}

export async function updatePreferencesAction(
  _prevState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const fieldErrors: NonNullable<UserActionState["fieldErrors"]> = {};
  const defaultTimeframe = readTrimmedString(formData, "defaultTimeframe");
  const currency = readTrimmedString(formData, "currency");
  const riskProfile = readTrimmedString(formData, "riskProfile");
  const fundamental = parseWeight(
    formData,
    "fundamentalWeight",
    "fundamentalWeight",
    fieldErrors,
  );
  const technical = parseWeight(
    formData,
    "technicalWeight",
    "technicalWeight",
    fieldErrors,
  );
  const sentiment = parseWeight(
    formData,
    "sentimentWeight",
    "sentimentWeight",
    fieldErrors,
  );

  if (!isOneOf(defaultTimeframe, USER_TIMEFRAMES)) {
    fieldErrors.defaultTimeframe = "Choose a supported default timeframe.";
  }

  if (!isOneOf(currency, USER_CURRENCIES)) {
    fieldErrors.currency = "Choose a supported display currency.";
  }

  if (!isOneOf(riskProfile, USER_RISK_PROFILES)) {
    fieldErrors.riskProfile = "Choose a supported risk profile.";
  }

  if (
    !fieldErrors.fundamentalWeight &&
    !fieldErrors.technicalWeight &&
    !fieldErrors.sentimentWeight &&
    fundamental + technical + sentiment !== 100
  ) {
    fieldErrors.fundamentalWeight = "Weights must total 100.";
    fieldErrors.technicalWeight = "Weights must total 100.";
    fieldErrors.sentimentWeight = "Weights must total 100.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please correct the highlighted preferences and try again.",
      fieldErrors,
      preferences: DEFAULT_USER_PREFERENCES,
      submittedAt: Date.now(),
    };
  }

  const preferences: UserPreferences = {
    defaultTimeframe: defaultTimeframe as UserDefaultTimeframe,
    currency: currency as UserCurrency,
    riskProfile: riskProfile as UserRiskProfile,
    defaultWeights: {
      fundamental,
      technical,
      sentiment,
    },
  };

  try {
    const updated = await updatePreferencesForCurrentUser(preferences);
    revalidateUserFeaturePaths();

    return {
      status: "success",
      message: "Saved your analysis preferences.",
      preferences: updated,
      submittedAt: Date.now(),
    };
  } catch (error) {
    return mapUserActionError(
      error,
      "Could not update your preferences right now.",
    );
  }
}
