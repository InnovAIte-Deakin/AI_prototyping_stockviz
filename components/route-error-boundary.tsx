"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type RouteErrorBoundaryProps = {
  error: Error & { digest?: string };
  heading: string;
  message: string;
  unstable_retry: () => void;
};

export function RouteErrorBoundary({
  error,
  heading,
  message,
  unstable_retry,
}: RouteErrorBoundaryProps) {
  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground md:px-10">
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center">
        <section className="w-full rounded-[28px] border border-border bg-card p-8 shadow-[0_20px_60px_rgba(55,49,45,0.06)]">
          <div className="mb-5 inline-flex rounded-2xl bg-destructive/10 p-3 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Route error
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {heading}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {message}
            </p>
          </div>

          {error.digest ? (
            <p className="mt-5 rounded-xl border border-border bg-muted px-4 py-3 text-xs text-muted-foreground">
              Error reference: {error.digest}
            </p>
          ) : null}

          <Button className="mt-6" type="button" onClick={unstable_retry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </section>
      </div>
    </div>
  );
}
