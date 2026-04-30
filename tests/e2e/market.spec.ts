import { expect, test } from "@playwright/test";
import { expectLoginRedirect } from "./assert-login-redirect";

test("protects the migrated market page from anonymous access", async ({
  page,
}) => {
  await page.goto("/market");

  await expectLoginRedirect(page, "/market");
  await expect(
    page.getByRole("heading", { name: /welcome back/i }),
  ).toBeVisible();
});
