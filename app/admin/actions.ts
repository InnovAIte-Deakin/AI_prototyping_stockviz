"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  cleanupExpiredAnalysisCacheForAdmin,
  clearAnalysisCacheForAdmin,
  updateProviderPreferencesForAdmin,
} from "@/lib/admin/diagnostics-service";
import { PROVIDER_CAPABILITIES } from "@/lib/market/provider-preferences";

const getStringField = (
  value: Record<string, unknown>,
  key: string,
): string | null => {
  const field = value[key];
  return typeof field === "string" && field.trim() ? field.trim() : null;
};

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    return (
      getStringField(record, "message") ||
      getStringField(record, "error_description") ||
      getStringField(record, "error") ||
      getStringField(record, "details") ||
      JSON.stringify(record)
    );
  }

  return String(error);
};

const adminNoticeUrl = (
  notice: string,
  params: Record<string, string | number> = {},
) => {
  const searchParams = new URLSearchParams({ notice });

  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, String(value));
  }

  return `/admin?${searchParams.toString()}`;
};

export async function clearAnalysisCacheAction() {
  let target = adminNoticeUrl("cache-clear-error");

  try {
    const result = await clearAnalysisCacheForAdmin();
    revalidatePath("/admin");
    target = adminNoticeUrl("cache-cleared", {
      count: result.deletedCount,
    });
  } catch (error) {
    target = adminNoticeUrl("cache-clear-error", {
      detail: toErrorMessage(error),
    });
  }

  redirect(target);
}

export async function cleanupExpiredAnalysisCacheAction() {
  let target = adminNoticeUrl("cache-cleanup-error");

  try {
    const result = await cleanupExpiredAnalysisCacheForAdmin();
    revalidatePath("/admin");
    target = adminNoticeUrl("cache-cleaned", {
      count: result.deletedCount,
    });
  } catch (error) {
    target = adminNoticeUrl("cache-cleanup-error", {
      detail: toErrorMessage(error),
    });
  }

  redirect(target);
}

export async function updateProviderPreferencesAction(formData: FormData) {
  let target = adminNoticeUrl("provider-settings-error");

  try {
    const preferences = PROVIDER_CAPABILITIES.map((capability) => ({
      capability,
      provider: String(formData.get(`provider.${capability}`) || ""),
    }));

    await updateProviderPreferencesForAdmin(preferences);
    const cacheResult = await clearAnalysisCacheForAdmin();
    revalidatePath("/admin");
    target = adminNoticeUrl("provider-settings-saved", {
      count: cacheResult.deletedCount,
    });
  } catch (error) {
    target = adminNoticeUrl("provider-settings-error", {
      detail: toErrorMessage(error),
    });
  }

  redirect(target);
}
