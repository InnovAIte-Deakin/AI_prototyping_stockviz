import fs from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const hasSupabaseAuthEnv = Boolean(
  (process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) ||
    fs.existsSync(".env.local"),
);

async function loginAsSeededDemoUser(page: Page) {
  await page.goto("/login");

  await page.getByLabel(/email address/i).fill("demo@stockviz.local");
  await page.getByLabel(/password/i).fill("StockVizDemo123!");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
}

test("redirects anonymous analysis requests into the auth flow", async ({
  page,
}) => {
  await page.goto("/analysis/AAPL");

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: /welcome back/i }),
  ).toBeVisible();
});

test("lets a signed-in user open analysis from the dashboard search", async ({
  page,
}) => {
  test.skip(
    !hasSupabaseAuthEnv,
    "Requires configured Supabase public env and the seeded local auth users.",
  );

  await loginAsSeededDemoUser(page);

  await page
    .getByPlaceholder(/search by ticker or company name/i)
    .fill("AAPL");
  await page.getByRole("button", { name: /analyze symbol/i }).click();

  await expect(page).toHaveURL(/\/analysis\/AAPL$/);
  await expect(
    page.getByRole("heading", { name: /AAPL analysis/i }),
  ).toBeVisible();
});
