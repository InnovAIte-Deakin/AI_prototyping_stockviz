"use client";

import { RouteErrorBoundary } from "@/components/route-error-boundary";

export default function MarketError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <RouteErrorBoundary
      error={error}
      heading="Market overview could not be loaded."
      message="The market route hit a runtime problem while loading session status, headlines, curated symbols, or wishlist state."
      unstable_retry={unstable_retry}
    />
  );
}
