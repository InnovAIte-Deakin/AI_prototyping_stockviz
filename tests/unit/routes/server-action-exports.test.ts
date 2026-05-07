import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

const serverActionFiles = [
  "app/admin/actions.ts",
  "app/auth/actions.ts",
  "app/portfolio/actions.ts",
  "app/user/actions.ts",
] as const;

describe("server action export shape", () => {
  it.each(serverActionFiles)(
    "exports only async functions from %s",
    (relativePath) => {
      const source = readFileSync(path.join(repoRoot, relativePath), "utf8");
      expect(source.trimStart().startsWith('"use server";')).toBe(true);
      expect(source).not.toMatch(/^export const\s+/m);
      expect(source).not.toMatch(/^export type\s+/m);

      const exportedFunctions =
        source.match(/^export async function\s+/gm) ?? [];
      expect(exportedFunctions.length).toBeGreaterThan(0);
    },
  );
});
