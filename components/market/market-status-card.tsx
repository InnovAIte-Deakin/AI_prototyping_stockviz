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
    ? "border-[#d7dfdb] bg-[#eef4f1] text-[#2f6b43]"
    : "border-[#e6d8d5] bg-[#f8efed] text-[#9a4d43]";

  return (
    <Card className="rounded-[28px] border border-[#e6e0db] bg-white shadow-[0_18px_48px_rgba(55,49,45,0.05)]">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-[#4f4e4e]">
              US market status
            </CardTitle>
            <CardDescription className="text-[#6a706f]">
              Live session information from the current root Finnhub proxy.
            </CardDescription>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-[#ddd6d0] bg-[#f9f9f8] text-[#5f5e5e] hover:bg-[#f2efec]"
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
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[#ece6e1] bg-[#fbf8f6] p-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b7f7f]">
                  Current session
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={statusTone}>{statusLabel}</Badge>
                  <Badge className="border-[#ddd6d0] bg-white text-[#6a706f]">
                    {formatSession(data?.session)}
                  </Badge>
                </div>
                <p className="text-sm leading-6 text-[#6a706f]">
                  {data?.holiday
                    ? `Holiday: ${data.holiday}`
                    : "No market holiday reported for the current snapshot."}
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-[20px] bg-white px-4 py-3 shadow-[0_10px_24px_rgba(55,49,45,0.04)]">
                <div className="rounded-2xl bg-[#f3eeea] p-2 text-[#5f5e5e]">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#4f4e4e]">
                    Auto-refresh
                  </p>
                  <p className="text-xs text-[#6a706f]">Every 30 seconds</p>
                </div>
              </div>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-[#ece6e1] bg-white px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b7f7f]">
                  Exchange
                </dt>
                <dd className="mt-2 text-base font-semibold text-[#4f4e4e]">
                  {data?.exchange || "US"}
                </dd>
              </div>
              <div className="rounded-[22px] border border-[#ece6e1] bg-white px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b7f7f]">
                  Timezone
                </dt>
                <dd className="mt-2 text-base font-semibold text-[#4f4e4e]">
                  {data?.timezone || "Unknown"}
                </dd>
              </div>
              <div className="rounded-[22px] border border-[#ece6e1] bg-white px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b7f7f]">
                  Holiday
                </dt>
                <dd className="mt-2 text-base font-semibold text-[#4f4e4e]">
                  {data?.holiday || "None"}
                </dd>
              </div>
              <div className="rounded-[22px] border border-[#ece6e1] bg-white px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b7f7f]">
                  Snapshot
                </dt>
                <dd className="mt-2 text-base font-semibold text-[#4f4e4e]">
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
