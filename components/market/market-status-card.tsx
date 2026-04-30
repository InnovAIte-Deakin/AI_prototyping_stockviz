"use client";

import { Activity, AlertCircle, RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUsMarketStatus } from "@/hooks/use-us-market-status";

const formatSession = (session?: string | null): string => {
  switch (session) {
    case "pre-market":
      return "Pre-market";
    case "regular":
      return "Regular session";
    case "post-market":
      return "Post-market";
    default:
      return "Closed";
  }
};

const formatSnapshot = (timestamp?: number): string => {
  if (!timestamp || !Number.isFinite(timestamp)) {
    return "Unavailable";
  }

  return new Date(timestamp * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export function MarketStatusCard() {
  const { data, error, isLoading, refetch } = useUsMarketStatus({
    refreshIntervalMs: 30_000,
  });

  const statusLabel = data?.isOpen ? "Open" : "Closed";
  const statusTone = data?.isOpen
    ? "border-border bg-finance-success/10 text-finance-success"
    : "border-border bg-destructive/10 text-destructive";

  return (
    <Card className="rounded-[28px] border border-border bg-white shadow-[0_18px_48px_rgba(55,49,45,0.05)]">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-on-surface">
              US market status
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Live session information from the current root Finnhub proxy.
            </CardDescription>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-border bg-surface text-surface-tint hover:bg-muted"
            onClick={() => {
              void refetch();
            }}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-[20px]" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-20 w-full rounded-[20px]" />
              <Skeleton className="h-20 w-full rounded-[20px]" />
              <Skeleton className="h-20 w-full rounded-[20px]" />
              <Skeleton className="h-20 w-full rounded-[20px]" />
            </div>
          </div>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Could not load market status</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {!isLoading && !error ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-border bg-card p-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Current session
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={statusTone}>{statusLabel}</Badge>
                  <Badge className="border-border bg-white text-muted-foreground">
                    {formatSession(data?.session)}
                  </Badge>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {data?.holiday
                    ? `Holiday: ${data.holiday}`
                    : "No market holiday reported for the current snapshot."}
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-[20px] bg-white px-4 py-3 shadow-[0_10px_24px_rgba(55,49,45,0.04)]">
                <div className="rounded-2xl bg-muted p-2 text-surface-tint">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-on-surface">
                    Auto-refresh
                  </p>
                  <p className="text-xs text-muted-foreground">Every 30 seconds</p>
                </div>
              </div>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-border bg-white px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Exchange
                </dt>
                <dd className="mt-2 text-base font-semibold text-on-surface">
                  {data?.exchange || "US"}
                </dd>
              </div>
              <div className="rounded-[22px] border border-border bg-white px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Timezone
                </dt>
                <dd className="mt-2 text-base font-semibold text-on-surface">
                  {data?.timezone || "Unknown"}
                </dd>
              </div>
              <div className="rounded-[22px] border border-border bg-white px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Holiday
                </dt>
                <dd className="mt-2 text-base font-semibold text-on-surface">
                  {data?.holiday || "None"}
                </dd>
              </div>
              <div className="rounded-[22px] border border-border bg-white px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Snapshot
                </dt>
                <dd className="mt-2 text-base font-semibold text-on-surface">
                  {formatSnapshot(data?.t)}
                </dd>
              </div>
            </dl>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

