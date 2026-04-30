"use client";

import { RouteErrorBoundary } from "@/components/route-error-boundary";

export default function AnalysisError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <RouteErrorBoundary
      error={error}
      heading="Analysis could not be loaded."
      message="The stock analysis route hit a runtime problem while loading scores, indicators, or supporting market data."
      unstable_retry={unstable_retry}
    />
  );
}
