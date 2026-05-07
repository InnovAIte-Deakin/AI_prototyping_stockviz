export type UserFieldName =
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
  preferences?: import("@/lib/user/preferences-service").UserPreferences;
};

export const INITIAL_USER_ACTION_STATE: UserActionState = {
  status: "idle",
  submittedAt: 0,
};
