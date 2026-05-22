import fs from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { expectLoginRedirect } from "./assert-login-redirect";

const readLocalEnv = (): Record<string, string> => {
  if (!fs.existsSync(".env.local")) {
    return {};
  }

  return fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .reduce<Record<string, string>>((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return env;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        return env;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^["']|["']$/g, "");

      if (key) {
        env[key] = value;
      }

      return env;
    }, {});
};

const localEnv = readLocalEnv();

const getSupabasePublicEnv = () => ({
  key:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    localEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  url:
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? localEnv.NEXT_PUBLIC_SUPABASE_URL,
});

const canReachSupabaseAuth = async (): Promise<boolean> => {
  const { key, url } = getSupabasePublicEnv();
  if (!key || !url) {
    return false;
  }

  let healthUrl: URL;
  try {
    healthUrl = new URL("auth/v1/health", url.endsWith("/") ? url : `${url}/`);
  } catch {
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1_500);

  try {
    const response = await fetch(healthUrl, {
      headers: { apikey: key },
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
};

async function loginAsSeededDemoUser(page: Page) {
  await page.goto("/login");

  await page.getByLabel(/email address/i).fill("demo@stockviz.local");
  await page
    .getByRole("textbox", { name: /^password$/i })
    .fill("StockVizDemo123!");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
}

test("redirects anonymous analysis requests into the auth flow", async ({
  page,
}) => {
  await page.goto("/analysis/AAPL");

  await expectLoginRedirect(page, "/analysis/AAPL");
  await expect(
    page.getByRole("heading", { name: /welcome back/i }),
  ).toBeVisible();
});

test("lets a signed-in user open analysis from the dashboard search", async ({
  page,
}) => {
  test.skip(
    !(await canReachSupabaseAuth()),
    "Requires reachable Supabase Auth and the seeded local auth users.",
  );

  await loginAsSeededDemoUser(page);

  await page.getByRole("button", { name: /search stocks/i }).click();
  await page
    .getByPlaceholder(/search stocks, tickers, companies/i)
    .fill("AAPL");
  await expect(
    page.getByRole("option", { name: /^AAPL\b/i }).first(),
  ).toBeVisible();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/analysis\/AAPL$/, { timeout: 15_000 });
  await expect(
    page.getByRole("heading", { name: /AAPL analysis/i }),
  ).toBeVisible({ timeout: 30_000 });
});
