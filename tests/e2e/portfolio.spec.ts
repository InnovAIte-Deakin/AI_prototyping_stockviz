import { expect, test } from "@playwright/test";
import { expectLoginRedirect } from "./assert-login-redirect";

test("protects the migrated portfolio page from anonymous access", async ({
  page,
}) => {
  await page.goto("/portfolio");

  await expectLoginRedirect(page, "/portfolio");
  await expect(
    page.getByRole("heading", { name: /welcome back/i }),
  ).toBeVisible();
});
