import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": rootDir,
    },
  },
  test: {
    clearMocks: true,
    environment: "node",
    exclude: ["node_modules/**", ".next/**", "tests/e2e/**"],
    globals: false,
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    restoreMocks: true,
  },
});
