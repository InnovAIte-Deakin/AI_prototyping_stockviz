import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const activeRoots = ["app", "components", "hooks", "lib", "scripts", "tests"];
const skipDirs = new Set([".git", ".next", "node_modules", "legacy"]);
const scanExtensions = new Set([
  ".cjs",
  ".js",
  ".jsx",
  ".json",
  ".mjs",
  ".ts",
  ".tsx",
]);
const archivedRuntimePatterns = [
  /\blegacy[\\/](backend|frontend)\b/i,
  /from\s+["'][^"']*legacy[\\/]/i,
  /require\(["'][^"']*legacy[\\/]/i,
];

async function walkFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (skipDirs.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
    } else if (scanExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("archive runtime cutover audit", () => {
  it("keeps active app code free of archived runtime imports", async () => {
    const files = (
      await Promise.all(
        activeRoots.map((root) => walkFiles(path.join(repoRoot, root))),
      )
    ).flat();

    const violations: string[] = [];
    for (const filePath of files) {
      const relativePath = path
        .relative(repoRoot, filePath)
        .replace(/\\/g, "/");
      if (
        relativePath === "scripts/parity-check.ts" ||
        relativePath ===
          "tests/integration/cutover/legacy-runtime-audit.test.ts"
      ) {
        continue;
      }

      const contents = await readFile(filePath, "utf8");
      if (archivedRuntimePatterns.some((pattern) => pattern.test(contents))) {
        violations.push(relativePath);
      }
    }

    expect(violations).toEqual([]);
  });
});
