export type PortfolioFieldName =
  | "symbol"
  | "shares"
  | "avgPrice"
  | "acquiredAt"
  | "notes"
  | "holdingId";

export type PortfolioActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<PortfolioFieldName, string>>;
};

export const INITIAL_PORTFOLIO_ACTION_STATE: PortfolioActionState = {
  status: "idle",
};
