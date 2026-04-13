import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignore archived legacy app and backend.
    "legacy/**",
    // Finnhub doc snapshot + saved asset tree (not application source).
    "docs/Finnhub_Documentation.html",
    "docs/Finnhub_Documentation_files/**",
  ]),
]);

export default eslintConfig;
