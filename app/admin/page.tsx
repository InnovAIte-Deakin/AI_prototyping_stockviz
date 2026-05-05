import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Eraser,
  KeyRound,
  ServerCog,
  ShieldCheck,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";

import {
  cleanupExpiredAnalysisCacheAction,
  clearAnalysisCacheAction,
  updateProviderPreferencesAction,
} from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AdminAuthError,
  AdminForbiddenError,
  getAdminDiagnostics,
  type AdminDiagnostics,
  type DiagnosticStatus,
} from "@/lib/admin/diagnostics-service";
import { cn } from "@/lib/utils";

type AdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type NoticeTone = "success" | "warning" | "error";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Diagnostics",
  description:
    "Inspect StockViz service configuration, cache state, and external API usage.",
};

const statusTone: Record<DiagnosticStatus, string> = {
  ok: "border-[#cfe2d7] bg-[#edf7f1] text-[#2f6b43]",
  warning: "border-[#e9dcc3] bg-[#fbf4e6] text-[#8a5a12]",
  error: "border-[#eccdcd] bg-[#fff1f1] text-[#a03b3b]",
};

const noticeTone: Record<NoticeTone, string> = {
  success: "border-[#cfe2d7] bg-[#edf7f1] text-[#2f6b43]",
  warning: "border-[#e9dcc3] bg-[#fbf4e6] text-[#8a5a12]",
  error: "border-[#eccdcd] bg-[#fff1f1] text-[#a03b3b]",
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function noticeFor(params: Record<string, string | string[] | undefined>) {
  const notice = firstParam(params.notice);
  const count = firstParam(params.count);
  const detail = firstParam(params.detail);

  switch (notice) {
    case "cache-cleared":
      return {
        description: `${count || "0"} cache entries were removed.`,
        title: "Analysis cache cleared",
        tone: "success" as const,
      };
    case "cache-cleaned":
      return {
        description: `${count || "0"} expired cache entries were removed.`,
        title: "Expired cache cleaned",
        tone: "success" as const,
      };
    case "cache-clear-error":
      return {
        description: detail || "The cache clear action could not complete.",
        title: "Cache clear failed",
        tone: "error" as const,
      };
    case "cache-cleanup-error":
      return {
        description: detail || "The expired-cache cleanup could not complete.",
        title: "Cache cleanup failed",
        tone: "error" as const,
      };
    case "provider-settings-saved":
      return {
        description: `Provider preferences were saved. ${count || "0"} cache entries were cleared.`,
        title: "Provider settings saved",
        tone: "success" as const,
      };
    case "provider-settings-error":
      return {
        description: detail || "Provider preferences could not be saved.",
        title: "Provider settings failed",
        tone: "error" as const,
      };
    default:
      return null;
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(seconds: number) {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ${seconds % 60}s`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function compactKey(value: string) {
  if (value.length <= 42) {
    return value;
  }

  return `${value.slice(0, 24)}...${value.slice(-12)}`;
}

function StatusBadge({
  label,
  status,
}: {
  label?: string;
  status: DiagnosticStatus;
}) {
  const Icon =
    status === "ok"
      ? CheckCircle2
      : status === "warning"
        ? AlertTriangle
        : XCircle;

  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-2.5 py-1", statusTone[status])}
    >
      <Icon className="mr-1 h-3.5 w-3.5" />
      {label || status}
    </Badge>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#e2dbd4] bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-[#f3eeea] p-2 text-[#5f5e5e]">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7b7f7f]">
            {label}
          </p>
          <p className="mt-1 truncate text-lg font-semibold text-[#4f4e4e]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function AccessDenied({ error }: { error: AdminForbiddenError }) {
  return (
    <div className="min-h-screen bg-[#f9f9f8] px-6 py-10 text-[#2d3433] md:px-10">
      <div className="mx-auto max-w-3xl rounded-[24px] border border-[#e2dbd4] bg-white p-8 shadow-[0_18px_44px_rgba(55,49,45,0.06)]">
        <div className="mb-5 inline-flex rounded-2xl bg-[#fff1f1] p-3 text-[#a03b3b]">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#4f4e4e]">
          Admin access is restricted.
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#6a706f]">{error.message}</p>
        <Button
          asChild
          className="mt-6 h-10 rounded-xl bg-[#5f5e5e] px-4 text-white hover:bg-[#4f4e4e]"
        >
          <Link href="/dashboard">Return to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

function Notice({
  notice,
}: {
  notice: { description: string; title: string; tone: NoticeTone };
}) {
  return (
    <div
      className={cn(
        "rounded-[18px] border px-4 py-3 text-sm",
        noticeTone[notice.tone],
      )}
      role="status"
    >
      <p className="font-semibold">{notice.title}</p>
      <p className="mt-1 leading-6">{notice.description}</p>
    </div>
  );
}

function Header({ diagnostics }: { diagnostics: AdminDiagnostics }) {
  const serviceWarnings = diagnostics.providers.filter(
    (provider) => provider.status !== "ok",
  ).length;
  const overallStatus: DiagnosticStatus =
    diagnostics.database.status === "error"
      ? "error"
      : serviceWarnings > 0
        ? "warning"
        : "ok";

  return (
    <div className="rounded-[24px] border border-[#e2dbd4] bg-white p-6 shadow-[0_18px_44px_rgba(55,49,45,0.05)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-[#ddd6d0] bg-[#f5f1ee] text-[#6a706f]"
            >
              Diagnostics console
            </Badge>
            <StatusBadge label="Runtime" status={overallStatus} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#4f4e4e] md:text-4xl">
            Admin diagnostics
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#636968]">
            Monitor the migrated runtime, service configuration, cache state,
            and external API usage from the root Next.js app.
          </p>
        </div>

        <div className="rounded-[18px] border border-[#e2dbd4] bg-[#fbf8f6] px-4 py-3 text-sm text-[#5f5e5e]">
          <p className="font-medium">Generated</p>
          <p className="mt-1 text-[#6a706f]">
            {formatDate(diagnostics.generatedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

function AccessPanel({ diagnostics }: { diagnostics: AdminDiagnostics }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
      <MetricTile
        icon={ServerCog}
        label="Environment"
        value={diagnostics.system.environment}
      />
      <MetricTile
        icon={Clock}
        label="Uptime"
        value={formatDuration(diagnostics.system.uptimeSeconds)}
      />
      <MetricTile
        icon={ShieldCheck}
        label="Access"
        value={
          diagnostics.access.accessMode === "allowlist"
            ? "Allowlist"
            : "Authenticated"
        }
      />
      {!diagnostics.access.allowlistConfigured ? (
        <div className="rounded-[18px] border border-[#e9dcc3] bg-[#fbf4e6] px-4 py-3 text-sm text-[#8a5a12] lg:col-span-3">
          <p className="font-semibold">Admin allowlist is not configured.</p>
          <p className="mt-1 leading-6">
            Set `STOCKVIZ_ADMIN_EMAILS` to restrict diagnostics access to named
            operator accounts before a shared deployment.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function ServicePanel({ diagnostics }: { diagnostics: AdminDiagnostics }) {
  return (
    <section className="rounded-[22px] border border-[#e2dbd4] bg-white p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#4f4e4e]">
            Service configuration
          </h2>
          <p className="mt-1 text-sm text-[#6a706f]">
            Key presence and database diagnostic access.
          </p>
        </div>
        <StatusBadge status={diagnostics.database.status} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {diagnostics.providers.map((provider) => (
          <div
            key={provider.name}
            className="rounded-[18px] border border-[#e7e0da] bg-[#fbfaf8] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-2xl bg-white p-2 text-[#5f5e5e]">
                <KeyRound className="h-4 w-4" />
              </div>
              <StatusBadge status={provider.status} />
            </div>
            <h3 className="mt-4 font-semibold text-[#4f4e4e]">
              {provider.name}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#6a706f]">
              {provider.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProviderControlPanel({
  diagnostics,
}: {
  diagnostics: AdminDiagnostics;
}) {
  return (
    <section className="rounded-[22px] border border-[#e2dbd4] bg-white p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#4f4e4e]">
            <ServerCog className="h-4 w-4 text-[#5f5e5e]" />
            Data source control
          </h2>
          <p className="mt-1 text-sm text-[#6a706f]">
            Selected providers are tried first. Automatic fallback remains
            enabled.
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit rounded-full border-[#ddd6d0] bg-[#f5f1ee] text-[#6a706f]"
        >
          Global
        </Badge>
      </div>

      <form action={updateProviderPreferencesAction} className="space-y-4">
        <div className="grid gap-3">
          {diagnostics.providerPreferences.map((preference) => (
            <div
              key={preference.capability}
              className="grid gap-3 rounded-[18px] border border-[#e7e0da] bg-[#fbfaf8] p-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] md:items-center"
            >
              <div>
                <div className="text-sm font-semibold text-[#4f4e4e]">
                  {preference.capabilityLabel}
                </div>
                <div className="mt-1 text-xs leading-5 text-[#6a706f]">
                  Current: {preference.providerLabel}. Fallback enabled.
                </div>
              </div>
              <select
                name={`provider.${preference.capability}`}
                defaultValue={preference.provider}
                className="h-10 rounded-xl border border-[#d8d1cb] bg-white px-3 text-sm text-[#4f4e4e] shadow-sm outline-none transition focus:border-[#5f5e5e] focus:ring-2 focus:ring-[#5f5e5e]/20"
              >
                {preference.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                    {option.available ? "" : " (key missing)"}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 border-t border-[#eee8e2] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-[#6a706f]">
            Saving clears analysis cache so users receive data from the new
            provider order.
          </p>
          <Button
            type="submit"
            className="h-9 rounded-xl bg-[#5f5e5e] px-3 text-white hover:bg-[#4f4e4e]"
          >
            <Save className="mr-2 h-4 w-4" />
            Save providers
          </Button>
        </div>
      </form>
    </section>
  );
}

function CachePanel({ diagnostics }: { diagnostics: AdminDiagnostics }) {
  return (
    <section className="rounded-[22px] border border-[#e2dbd4] bg-white p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#4f4e4e]">
            Analysis cache
          </h2>
          <p className="mt-1 text-sm text-[#6a706f]">
            {diagnostics.cache.available
              ? `${diagnostics.cache.inspected} entries inspected from ${diagnostics.cache.total} total.`
              : diagnostics.cache.error || "Cache diagnostics are unavailable."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={cleanupExpiredAnalysisCacheAction}>
            <Button
              type="submit"
              variant="outline"
              className="h-9 rounded-xl border-[#d8d1cb] bg-white px-3 text-[#5f5e5e] hover:bg-[#f3efeb]"
            >
              <Eraser className="mr-2 h-4 w-4" />
              Clean expired
            </Button>
          </form>
          <form action={clearAnalysisCacheAction}>
            <Button
              type="submit"
              variant="destructive"
              className="h-9 rounded-xl px-3"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear cache
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricTile
          icon={Database}
          label="Total"
          value={String(diagnostics.cache.total)}
        />
        <MetricTile
          icon={CheckCircle2}
          label="Valid"
          value={String(diagnostics.cache.valid)}
        />
        <MetricTile
          icon={AlertTriangle}
          label="Expired"
          value={String(diagnostics.cache.expired)}
        />
      </div>

      <div className="mt-5 overflow-x-auto rounded-[18px] border border-[#e7e0da]">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[minmax(160px,1.4fr)_minmax(140px,0.8fr)_minmax(140px,0.8fr)_90px] bg-[#f5f1ee] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#7b7f7f]">
            <span>Cache key</span>
            <span>Created</span>
            <span>Expires</span>
            <span>Status</span>
          </div>
          {diagnostics.cache.recentEntries.length > 0 ? (
            diagnostics.cache.recentEntries.map((entry) => (
              <div
                key={`${entry.cacheKey}-${entry.createdAt}`}
                className="grid grid-cols-[minmax(160px,1.4fr)_minmax(140px,0.8fr)_minmax(140px,0.8fr)_90px] gap-3 border-t border-[#eee8e2] px-4 py-3 text-sm text-[#5f5e5e]"
              >
                <code className="truncate text-xs text-[#4f4e4e]">
                  {compactKey(entry.cacheKey)}
                </code>
                <span>{formatDate(entry.createdAt)}</span>
                <span>{formatDate(entry.expiresAt)}</span>
                <span
                  className={cn(
                    "font-medium",
                    entry.status === "valid"
                      ? "text-[#2f6b43]"
                      : "text-[#a03b3b]",
                  )}
                >
                  {entry.status}
                </span>
              </div>
            ))
          ) : (
            <div className="border-t border-[#eee8e2] px-4 py-6 text-sm text-[#6a706f]">
              No cache entries available.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ApiUsagePanel({ diagnostics }: { diagnostics: AdminDiagnostics }) {
  return (
    <section className="rounded-[22px] border border-[#e2dbd4] bg-white p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#4f4e4e]">API usage</h2>
          <p className="mt-1 text-sm text-[#6a706f]">
            {diagnostics.apiUsage.available
              ? `${diagnostics.apiUsage.inspected} calls inspected from ${diagnostics.apiUsage.totalCalls} total.`
              : diagnostics.apiUsage.error ||
                "API usage diagnostics are unavailable."}
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit rounded-full border-[#d7dfdb] bg-[#eef4f1] text-[#2f6b43]"
        >
          <Activity className="mr-1 h-3.5 w-3.5" />
          {diagnostics.apiUsage.totalCalls} calls
        </Badge>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {diagnostics.apiUsage.apis.length > 0 ? (
          diagnostics.apiUsage.apis.map((api) => (
            <div
              key={api.name}
              className="rounded-[18px] border border-[#e7e0da] bg-[#fbfaf8] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-[#4f4e4e]">{api.name}</h3>
                  <p className="mt-1 text-sm text-[#6a706f]">
                    {api.averageResponseTime}ms average response
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full border-[#ddd6d0] bg-white text-[#6a706f]"
                >
                  {api.total} calls
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white px-3 py-2">
                  <p className="text-[#7b7f7f]">Successful</p>
                  <p className="mt-1 font-semibold text-[#2f6b43]">
                    {api.successful}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-2">
                  <p className="text-[#7b7f7f]">Failed</p>
                  <p className="mt-1 font-semibold text-[#a03b3b]">
                    {api.failed}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[18px] border border-dashed border-[#d8d1cb] bg-[#fbfaf8] p-5 text-sm text-[#6a706f] lg:col-span-2">
            No API usage has been logged yet.
          </div>
        )}
      </div>

      <div className="mt-5 overflow-x-auto rounded-[18px] border border-[#e7e0da]">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[minmax(110px,0.8fr)_minmax(120px,1fr)_minmax(90px,0.6fr)_minmax(90px,0.6fr)_minmax(90px,0.6fr)] bg-[#f5f1ee] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#7b7f7f]">
            <span>API</span>
            <span>Endpoint</span>
            <span>Symbol</span>
            <span>Latency</span>
            <span>Status</span>
          </div>
          {diagnostics.apiUsage.recentCalls.length > 0 ? (
            diagnostics.apiUsage.recentCalls.map((call) => (
              <div
                key={`${call.apiName}-${call.endpoint}-${call.createdAt}`}
                className="grid grid-cols-[minmax(110px,0.8fr)_minmax(120px,1fr)_minmax(90px,0.6fr)_minmax(90px,0.6fr)_minmax(90px,0.6fr)] gap-3 border-t border-[#eee8e2] px-4 py-3 text-sm text-[#5f5e5e]"
              >
                <span className="truncate font-medium text-[#4f4e4e]">
                  {call.apiName}
                </span>
                <span className="truncate">{call.endpoint}</span>
                <span>{call.symbol || "-"}</span>
                <span>
                  {typeof call.responseTime === "number"
                    ? `${call.responseTime}ms`
                    : "-"}
                </span>
                <span
                  className={cn(
                    "font-medium",
                    call.success ? "text-[#2f6b43]" : "text-[#a03b3b]",
                  )}
                >
                  {call.success ? "ok" : "failed"}
                </span>
              </div>
            ))
          ) : (
            <div className="border-t border-[#eee8e2] px-4 py-6 text-sm text-[#6a706f]">
              No recent API calls available.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = searchParams ? await searchParams : {};
  const notice = noticeFor(params);
  let diagnostics: AdminDiagnostics;

  try {
    diagnostics = await getAdminDiagnostics();
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    if (error instanceof AdminForbiddenError) {
      return <AccessDenied error={error} />;
    }

    throw error;
  }

  return (
    <div className="min-h-screen bg-[#f9f9f8] px-4 py-8 text-[#2d3433] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Header diagnostics={diagnostics} />
        {notice ? <Notice notice={notice} /> : null}
        <AccessPanel diagnostics={diagnostics} />
        <ServicePanel diagnostics={diagnostics} />
        <ProviderControlPanel diagnostics={diagnostics} />
        <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <CachePanel diagnostics={diagnostics} />
          <ApiUsagePanel diagnostics={diagnostics} />
        </div>
      </div>
    </div>
  );
}
