import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  getSupabasePublishableKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";
import {
  getProviderPreferences,
  PROVIDER_CAPABILITY_LABELS,
  PROVIDER_CAPABILITY_OPTIONS,
  PROVIDER_LABELS,
  saveProviderPreferences,
  type ProviderCapability,
  type ProviderId,
  type ProviderPreference,
} from "@/lib/market/provider-preferences";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL_ENV_KEYS = ["STOCKVIZ_ADMIN_EMAILS", "ADMIN_EMAILS"];
const CACHE_SAMPLE_LIMIT = 1000;
const API_SAMPLE_LIMIT = 1000;

export class AdminAuthError extends Error {
  constructor() {
    super("Authentication required.");
    this.name = "AdminAuthError";
  }
}

export class AdminForbiddenError extends Error {
  constructor(email: string | null) {
    super(
      email
        ? `${email} is not listed as a diagnostics admin.`
        : "This account is not listed as a diagnostics admin.",
    );
    this.name = "AdminForbiddenError";
  }
}

export type AdminAccess = {
  accessMode: "allowlist" | "authenticated";
  allowlistConfigured: boolean;
  email: string | null;
  userId: string;
};

export type DiagnosticStatus = "ok" | "warning" | "error";

export type ProviderDiagnostic = {
  detail: string;
  name: string;
  status: DiagnosticStatus;
};

export type CacheDiagnostic = {
  available: boolean;
  error: string | null;
  expired: number;
  inspected: number;
  recentEntries: Array<{
    cacheKey: string;
    createdAt: string;
    expiresAt: string;
    status: "valid" | "expired";
  }>;
  timeoutMs: number;
  total: number;
  valid: number;
};

export type ApiUsageDiagnostic = {
  apis: Array<{
    averageResponseTime: number;
    failed: number;
    name: string;
    successful: number;
    total: number;
  }>;
  available: boolean;
  error: string | null;
  inspected: number;
  recentCalls: Array<{
    apiName: string;
    createdAt: string;
    endpoint: string;
    responseTime: number | null;
    success: boolean | null;
    symbol: string | null;
    timeframe: string | null;
  }>;
  totalCalls: number;
};

export type ProviderPreferenceDiagnostic = ProviderPreference & {
  capabilityLabel: string;
  options: Array<{
    available: boolean;
    id: ProviderId;
    label: string;
    requiresEnv: string | null;
  }>;
  providerLabel: string;
};

export type AdminDiagnostics = {
  access: AdminAccess;
  apiUsage: ApiUsageDiagnostic;
  cache: CacheDiagnostic;
  database: {
    detail: string;
    status: DiagnosticStatus;
  };
  generatedAt: string;
  providerPreferences: ProviderPreferenceDiagnostic[];
  providers: ProviderDiagnostic[];
  system: {
    environment: string;
    nodeVersion: string;
    uptimeSeconds: number;
  };
};

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const hasValue = (value: string | undefined): boolean =>
  Boolean(value && value.trim() && !value.includes("your-"));

const isProviderEnvAvailable = (envName: string | undefined): boolean => {
  if (!envName) {
    return true;
  }
  return hasValue(process.env[envName]);
};

function toProviderPreferenceDiagnostics(
  preferences: Record<ProviderCapability, ProviderPreference>,
): ProviderPreferenceDiagnostic[] {
  return Object.values(preferences).map((preference) => ({
    ...preference,
    capabilityLabel: PROVIDER_CAPABILITY_LABELS[preference.capability],
    options: PROVIDER_CAPABILITY_OPTIONS[preference.capability].map(
      (option) => ({
        available: isProviderEnvAvailable(option.requiresEnv),
        id: option.id,
        label: option.label,
        requiresEnv: option.requiresEnv || null,
      }),
    ),
    providerLabel: PROVIDER_LABELS[preference.provider],
  }));
}

const getAdminEmailAllowlist = (): string[] => {
  const raw = ADMIN_EMAIL_ENV_KEYS.map((key) => process.env[key])
    .find(Boolean)
    ?.trim();

  if (!raw) {
    return [];
  }

  return raw
    .split(/[,\s;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

export async function requireAdminAccess(): Promise<AdminAccess> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AdminAuthError();
  }

  const email = user.email?.toLowerCase() ?? null;
  const allowlist = getAdminEmailAllowlist();
  const allowlistConfigured = allowlist.length > 0;

  if (allowlistConfigured && (!email || !allowlist.includes(email))) {
    throw new AdminForbiddenError(email);
  }

  return {
    accessMode: allowlistConfigured ? "allowlist" : "authenticated",
    allowlistConfigured,
    email,
    userId: user.id,
  };
}

function getProviderDiagnostics(): ProviderDiagnostic[] {
  const supabaseUrl = hasValue(getSupabaseUrl());
  const supabasePublicKey = hasValue(getSupabasePublishableKey());
  const supabaseServiceKey = hasValue(getSupabaseServiceRoleKey());
  const alphaVantage = hasValue(process.env.ALPHA_VANTAGE_API_KEY);
  const finnhub = hasValue(process.env.FINNHUB_API_KEY);
  const twelveData = hasValue(process.env.TWELVE_DATA_API_KEY);
  const gemini = hasValue(process.env.GEMINI_API_KEY);
  const aiProvider = String(process.env.AI_SUMMARY_PROVIDER || "auto")
    .trim()
    .toLowerCase();

  return [
    {
      name: "Supabase public client",
      status: supabaseUrl && supabasePublicKey ? "ok" : "error",
      detail:
        supabaseUrl && supabasePublicKey
          ? "URL and publishable key are configured."
          : "Missing public Supabase URL or publishable key.",
    },
    {
      name: "Supabase service role",
      status: supabaseUrl && supabaseServiceKey ? "ok" : "error",
      detail:
        supabaseUrl && supabaseServiceKey
          ? "Service-role database diagnostics are available."
          : "Missing Supabase URL or service-role key.",
    },
    {
      name: "Yahoo Finance",
      status: "ok",
      detail:
        "Primary stock data, fundamentals, stock-detail history, and search provider. No API key is required.",
    },
    {
      name: "Alpha Vantage",
      status: alphaVantage ? "ok" : "warning",
      detail: alphaVantage
        ? "Sentiment provider and fallback market-data key is configured."
        : "Sentiment provider and fallback market-data key is not configured.",
    },
    {
      name: "Finnhub",
      status: finnhub ? "ok" : "warning",
      detail: finnhub
        ? "Stock-detail and market-news provider key is configured."
        : "Stock-detail and market-news provider key is not configured.",
    },
    {
      name: "Twelve Data",
      status: twelveData ? "ok" : "warning",
      detail: twelveData
        ? "Secondary time-series provider key is configured."
        : "Secondary time-series provider key is not configured.",
    },
    {
      name: "Gemini summaries",
      status: gemini || aiProvider === "fallback" ? "ok" : "warning",
      detail: gemini
        ? "Gemini summary provider can be selected."
        : "Fallback summary provider will be used.",
    },
  ];
}

async function getCacheDiagnostic(): Promise<CacheDiagnostic> {
  try {
    const supabase = createAdminClient();
    const { count, data, error } = await supabase
      .from("analysis_cache")
      .select("cache_key, created_at, expires_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(CACHE_SAMPLE_LIMIT);

    if (error) {
      throw error;
    }

    const rows = data || [];
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    const recentEntries = rows.slice(0, 8).map((row) => {
      const isExpired = new Date(row.expires_at).getTime() <= now;
      if (isExpired) {
        expired += 1;
      } else {
        valid += 1;
      }

      return {
        cacheKey: row.cache_key,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        status: isExpired ? ("expired" as const) : ("valid" as const),
      };
    });

    for (const row of rows.slice(8)) {
      if (new Date(row.expires_at).getTime() <= now) {
        expired += 1;
      } else {
        valid += 1;
      }
    }

    return {
      available: true,
      error: null,
      expired,
      inspected: rows.length,
      recentEntries,
      timeoutMs: 5 * 60 * 1000,
      total: count ?? rows.length,
      valid,
    };
  } catch (error) {
    return {
      available: false,
      error: toErrorMessage(error),
      expired: 0,
      inspected: 0,
      recentEntries: [],
      timeoutMs: 5 * 60 * 1000,
      total: 0,
      valid: 0,
    };
  }
}

async function getApiUsageDiagnostic(): Promise<ApiUsageDiagnostic> {
  try {
    const supabase = createAdminClient();
    const { count, data, error } = await supabase
      .from("api_call_log")
      .select(
        "api_name, endpoint, symbol, timeframe, success, response_time, created_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .limit(API_SAMPLE_LIMIT);

    if (error) {
      throw error;
    }

    const rows = data || [];
    const apiBuckets = new Map<
      string,
      {
        averageResponseTime: number;
        failed: number;
        responseTimeTotal: number;
        successful: number;
        total: number;
      }
    >();

    for (const row of rows) {
      const bucket =
        apiBuckets.get(row.api_name) ||
        ({
          averageResponseTime: 0,
          failed: 0,
          responseTimeTotal: 0,
          successful: 0,
          total: 0,
        } satisfies {
          averageResponseTime: number;
          failed: number;
          responseTimeTotal: number;
          successful: number;
          total: number;
        });

      bucket.total += 1;
      bucket.responseTimeTotal += row.response_time || 0;
      if (row.success) {
        bucket.successful += 1;
      } else {
        bucket.failed += 1;
      }
      apiBuckets.set(row.api_name, bucket);
    }

    const apis = Array.from(apiBuckets.entries())
      .map(([name, bucket]) => ({
        averageResponseTime:
          bucket.total > 0
            ? Math.round(bucket.responseTimeTotal / bucket.total)
            : 0,
        failed: bucket.failed,
        name,
        successful: bucket.successful,
        total: bucket.total,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      apis,
      available: true,
      error: null,
      inspected: rows.length,
      recentCalls: rows.slice(0, 10).map((row) => ({
        apiName: row.api_name,
        createdAt: row.created_at,
        endpoint: row.endpoint,
        responseTime: row.response_time,
        success: row.success,
        symbol: row.symbol,
        timeframe: row.timeframe,
      })),
      totalCalls: count ?? rows.length,
    };
  } catch (error) {
    return {
      apis: [],
      available: false,
      error: toErrorMessage(error),
      inspected: 0,
      recentCalls: [],
      totalCalls: 0,
    };
  }
}

export async function getAdminDiagnostics(): Promise<AdminDiagnostics> {
  const access = await requireAdminAccess();
  const [cache, apiUsage, providerPreferences] = await Promise.all([
    getCacheDiagnostic(),
    getApiUsageDiagnostic(),
    getProviderPreferences(),
  ]);

  const databaseOk = cache.available && apiUsage.available;
  const databaseError = cache.error || apiUsage.error;

  return {
    access,
    apiUsage,
    cache,
    database: {
      detail: databaseOk
        ? "Service-role reads are available for diagnostic tables."
        : databaseError || "Diagnostic tables are unavailable.",
      status: databaseOk ? "ok" : "error",
    },
    generatedAt: new Date().toISOString(),
    providerPreferences: toProviderPreferenceDiagnostics(providerPreferences),
    providers: getProviderDiagnostics(),
    system: {
      environment: process.env.NODE_ENV || "development",
      nodeVersion: process.version,
      uptimeSeconds: Math.round(process.uptime()),
    },
  };
}

export async function updateProviderPreferencesForAdmin(
  preferences: Array<{ capability: string; provider: string }>,
) {
  const access = await requireAdminAccess();
  const updated = await saveProviderPreferences({
    preferences,
    updatedBy: access.userId,
  });
  return toProviderPreferenceDiagnostics(updated);
}

export async function clearAnalysisCacheForAdmin() {
  await requireAdminAccess();
  const supabase = createAdminClient();

  const { count, error: countError } = await supabase
    .from("analysis_cache")
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw countError;
  }

  const { error } = await supabase
    .from("analysis_cache")
    .delete()
    .neq("cache_key", "__stockviz_keep_no_rows__");

  if (error) {
    throw error;
  }

  return { deletedCount: count ?? 0 };
}

export async function cleanupExpiredAnalysisCacheForAdmin() {
  await requireAdminAccess();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("analysis_cache")
    .delete()
    .lte("expires_at", new Date().toISOString())
    .select("cache_key");

  if (error) {
    throw error;
  }

  return { deletedCount: data?.length || 0 };
}
