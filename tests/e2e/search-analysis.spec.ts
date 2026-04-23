import { expect, test } from "@playwright/test";

test("redirects anonymous analysis requests into the auth flow", async ({
  page,
}) => {
  await page.goto("/analysis/AAPL");

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: /welcome back/i }),
  ).toBeVisible();
});
