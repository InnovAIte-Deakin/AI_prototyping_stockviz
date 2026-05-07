import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

const tokenizedFiles = [
  "app/analysis/[symbol]/page.tsx",
  "app/dashboard/page.tsx",
  "components/market/market-news-feed.tsx",
  "components/market/market-overview.tsx",
  "components/market/market-status-card.tsx",
  "components/market/trending-tabs.tsx",
  "components/search/symbol-search.tsx",
] as const;

const requiredCiCommands = [
  "npm ci",
  "npm run lint",
  "npm run typecheck",
  "npm run test",
  "npm run build",
  "npm run parity:check",
] as const;

const userFacingFiles = [
  "app/dashboard/page.tsx",
  "app/analysis/[symbol]/page.tsx",
  "components/layout/navbar.tsx",
  "components/layout/footer.tsx",
] as const;

describe("design token and CI polish", () => {
  it.each(tokenizedFiles)("uses semantic colors in %s", (relativePath) => {
    const source = readFileSync(path.join(repoRoot, relativePath), "utf8");

    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it.each(userFacingFiles)(
    "does not show migration copy in %s",
    (relativePath) => {
      const source = readFileSync(path.join(repoRoot, relativePath), "utf8");
      expect(source).not.toMatch(
        /Migration|Migrated|migration shell|root app/i,
      );
    },
  );

  it("defines CI checks for the project quality gates", () => {
    const workflowPath = path.join(repoRoot, ".github/workflows/ci.yml");
    expect(existsSync(workflowPath)).toBe(true);

    const workflow = readFileSync(workflowPath, "utf8");
    for (const command of requiredCiCommands) {
      expect(workflow).toContain(command);
    }
  });
});
