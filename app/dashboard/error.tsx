"use client";

import { RouteErrorBoundary } from "@/components/route-error-boundary";

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <RouteErrorBoundary
      error={error}
      heading="Dashboard could not be loaded."
      message="The dashboard route hit a runtime problem while preparing the authenticated launch surface."
      unstable_retry={unstable_retry}
    />
  );
}
