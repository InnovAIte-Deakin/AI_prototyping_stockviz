"use client";

import { RouteErrorBoundary } from "@/components/route-error-boundary";

export default function PortfolioError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <RouteErrorBoundary
      error={error}
      heading="Portfolio could not be loaded."
      message="The portfolio route hit a runtime problem while loading holdings, personalization state, or portfolio summary data."
      unstable_retry={unstable_retry}
    />
  );
}
