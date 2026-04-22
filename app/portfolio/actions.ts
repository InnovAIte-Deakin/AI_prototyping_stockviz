"use server";

import { revalidatePath } from "next/cache";

import {
  createHoldingForCurrentUser,
  deleteHoldingForCurrentUser,
  PortfolioAuthError,
  updateHoldingForCurrentUser,
} from "@/lib/portfolio/holdings-service";

type PortfolioFieldName =
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

type ParsedHoldingPayload = {
  symbol: string;
  shares: number;
  avgPrice: number;
  acquiredAt: string | null;
  notes: string | null;
};

const readTrimmedString = (formData: FormData, key: string): string => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const parseHoldingFormData = (
  formData: FormData,
): {
  data?: ParsedHoldingPayload;
  fieldErrors?: PortfolioActionState["fieldErrors"];
} => {
  const fieldErrors: NonNullable<PortfolioActionState["fieldErrors"]> = {};

  const symbolInput = readTrimmedString(formData, "symbol").toUpperCase();
  if (!symbolInput) {
    fieldErrors.symbol = "Enter a symbol.";
  } else if (!/^[A-Z0-9.\-]{1,15}$/.test(symbolInput)) {
    fieldErrors.symbol =
      "Use letters, numbers, dots, or hyphens only (max 15 characters).";
  }

  const sharesInput = readTrimmedString(formData, "shares");
  const shares = Number.parseFloat(sharesInput);
  if (!sharesInput) {
    fieldErrors.shares = "Enter the number of shares.";
  } else if (!Number.isFinite(shares) || shares <= 0) {
    fieldErrors.shares = "Shares must be a number greater than 0.";
  }

  const avgPriceInput = readTrimmedString(formData, "avgPrice");
  const avgPrice = Number.parseFloat(avgPriceInput);
  if (!avgPriceInput) {
    fieldErrors.avgPrice = "Enter the average cost per share.";
  } else if (!Number.isFinite(avgPrice) || avgPrice < 0) {
    fieldErrors.avgPrice = "Average cost must be 0 or greater.";
  }

  const acquiredAtInput = readTrimmedString(formData, "acquiredAt");
  if (
    acquiredAtInput &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(acquiredAtInput) ||
      Number.isNaN(Date.parse(`${acquiredAtInput}T00:00:00Z`)))
  ) {
    fieldErrors.acquiredAt = "Use a valid acquisition date.";
  }

  const notesInput = readTrimmedString(formData, "notes");
  if (notesInput.length > 1000) {
    fieldErrors.notes = "Notes must be 1000 characters or fewer.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      fieldErrors,
    };
  }

  return {
    data: {
      symbol: symbolInput,
      shares,
      avgPrice,
      acquiredAt: acquiredAtInput || null,
      notes: notesInput || null,
    },
  };
};

const mapPortfolioActionError = (
  error: unknown,
  fallbackMessage: string,
): PortfolioActionState => {
  if (error instanceof PortfolioAuthError) {
    return {
      status: "error",
      message: "Your session has expired. Please sign in again.",
    };
  }

  if (error instanceof Error) {
    return {
      status: "error",
      message: error.message || fallbackMessage,
    };
  }

  return {
    status: "error",
    message: fallbackMessage,
  };
};

export async function createHoldingAction(
  _prevState: PortfolioActionState,
  formData: FormData,
): Promise<PortfolioActionState> {
  const parsed = parseHoldingFormData(formData);

  if (!parsed.data) {
    return {
      status: "error",
      message: "Please correct the highlighted fields and try again.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  try {
    await createHoldingForCurrentUser(parsed.data);
    revalidatePath("/portfolio");

    return {
      status: "success",
      message: `Added ${parsed.data.symbol} to your portfolio.`,
    };
  } catch (error) {
    return mapPortfolioActionError(
      error,
      "Could not add the holding right now.",
    );
  }
}

export async function updateHoldingAction(
  _prevState: PortfolioActionState,
  formData: FormData,
): Promise<PortfolioActionState> {
  const holdingId = readTrimmedString(formData, "holdingId");
  if (!holdingId) {
    return {
      status: "error",
      message: "Missing holding identifier.",
      fieldErrors: {
        holdingId: "Missing holding identifier.",
      },
    };
  }

  const parsed = parseHoldingFormData(formData);
  if (!parsed.data) {
    return {
      status: "error",
      message: "Please correct the highlighted fields and try again.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  try {
    await updateHoldingForCurrentUser(holdingId, parsed.data);
    revalidatePath("/portfolio");

    return {
      status: "success",
      message: `Updated ${parsed.data.symbol}.`,
    };
  } catch (error) {
    return mapPortfolioActionError(
      error,
      "Could not update the holding right now.",
    );
  }
}

export async function deleteHoldingAction(
  _prevState: PortfolioActionState,
  formData: FormData,
): Promise<PortfolioActionState> {
  const holdingId = readTrimmedString(formData, "holdingId");
  const symbol = readTrimmedString(formData, "symbol");

  if (!holdingId) {
    return {
      status: "error",
      message: "Missing holding identifier.",
      fieldErrors: {
        holdingId: "Missing holding identifier.",
      },
    };
  }

  try {
    await deleteHoldingForCurrentUser(holdingId);
    revalidatePath("/portfolio");

    return {
      status: "success",
      message: symbol ? `Removed ${symbol}.` : "Holding removed.",
    };
  } catch (error) {
    return mapPortfolioActionError(
      error,
      "Could not remove the holding right now.",
    );
  }
}
