import { existsSync } from "node:fs";
import path from "node:path";

import React from "react";
import { describe, expect, it, vi } from "vitest";

const repoRoot = process.cwd();

const errorRoutes = [
  {
    importComponent: () => import("@/app/analysis/[symbol]/error"),
    label: "analysis",
    path: "app/analysis/[symbol]/error.tsx",
  },
  {
    importComponent: () => import("@/app/stock/[symbol]/error"),
    label: "stock detail",
    path: "app/stock/[symbol]/error.tsx",
  },
  {
    importComponent: () => import("@/app/market/error"),
    label: "market",
    path: "app/market/error.tsx",
  },
  {
    importComponent: () => import("@/app/portfolio/error"),
    label: "portfolio",
    path: "app/portfolio/error.tsx",
  },
  {
    importComponent: () => import("@/app/dashboard/error"),
    label: "dashboard",
    path: "app/dashboard/error.tsx",
  },
] as const;

describe("route error boundaries", () => {
  it.each(errorRoutes)(
    "provides a renderable $label error boundary",
    async ({ importComponent, path: routePath }) => {
      expect(existsSync(path.join(repoRoot, routePath))).toBe(true);

      const loadedBoundary = await importComponent();
      const Boundary = loadedBoundary.default;

      expect(
        React.isValidElement(
          <Boundary
            error={new Error("Route failed")}
            unstable_retry={vi.fn()}
          />,
        ),
      ).toBe(true);
    },
  );
});
