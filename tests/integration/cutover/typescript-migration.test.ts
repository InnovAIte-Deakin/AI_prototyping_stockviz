import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

const migratedFiles = [
  {
    from: "app/api/search/route.js",
    to: "app/api/search/route.ts",
  },
  {
    from: "app/analysis/[symbol]/page.jsx",
    to: "app/analysis/[symbol]/page.tsx",
  },
  {
    from: "lib/cache/index.js",
    to: "lib/cache/index.ts",
  },
  {
    from: "lib/analysis/runtime.js",
    to: "lib/analysis/runtime.ts",
  },
] as const;

describe("TypeScript migration cutover", () => {
  it.each(migratedFiles)("migrates $from to $to", ({ from, to }) => {
    expect(existsSync(path.join(repoRoot, from))).toBe(false);
    expect(existsSync(path.join(repoRoot, to))).toBe(true);
  });
});
