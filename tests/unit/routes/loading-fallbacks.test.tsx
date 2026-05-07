import { existsSync } from "node:fs";
import path from "node:path";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

const loadingRoutes = [
  {
    importComponent: () => import("@/app/analysis/[symbol]/loading"),
    label: "analysis",
    path: "app/analysis/[symbol]/loading.tsx",
  },
  {
    importComponent: () => import("@/app/stock/[symbol]/loading"),
    label: "stock detail",
    path: "app/stock/[symbol]/loading.tsx",
  },
  {
    importComponent: () => import("@/app/market/loading"),
    label: "market",
    path: "app/market/loading.tsx",
  },
  {
    importComponent: () => import("@/app/portfolio/loading"),
    label: "portfolio",
    path: "app/portfolio/loading.tsx",
  },
] as const;

describe("route loading fallbacks", () => {
  it.each(loadingRoutes)(
    "provides a renderable $label loading fallback",
    async ({ importComponent, path: routePath }) => {
      expect(existsSync(path.join(repoRoot, routePath))).toBe(true);

      const loadedFallback = await importComponent();
      const Loading = loadedFallback.default;

      expect(React.isValidElement(<Loading />)).toBe(true);
    },
  );

  it("marks the analysis loading fallback as busy", async () => {
    const loadedFallback = await import("@/app/analysis/[symbol]/loading");
    const Loading = loadedFallback.default;

    const html = renderToStaticMarkup(<Loading />);

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('role="status"');
  });
});
