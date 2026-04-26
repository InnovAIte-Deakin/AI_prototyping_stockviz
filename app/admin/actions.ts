"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  cleanupExpiredAnalysisCacheForAdmin,
  clearAnalysisCacheForAdmin,
} from "@/lib/admin/diagnostics-service";

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

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
