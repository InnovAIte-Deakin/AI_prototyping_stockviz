"use client";

import { RouteErrorBoundary } from "@/components/route-error-boundary";

export default function StockDetailError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <RouteErrorBoundary
      error={error}
      heading="Stock detail could not be loaded."
      message="The detail route hit a runtime problem while loading quote, price history, metric, peer, or recommendation data."
      unstable_retry={unstable_retry}
    />
  );
}
