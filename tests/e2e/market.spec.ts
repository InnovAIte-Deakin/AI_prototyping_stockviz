import { expect, test } from "@playwright/test";

test("protects the migrated market page from anonymous access", async ({
  page,
}) => {
  await page.goto("/market");

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: /welcome back/i }),
  ).toBeVisible();
});
