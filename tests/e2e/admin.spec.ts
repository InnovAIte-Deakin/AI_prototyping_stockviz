import { expect, test } from "@playwright/test";
import { expectLoginRedirect } from "./assert-login-redirect";

test("protects the migrated admin diagnostics page from anonymous access", async ({
  page,
}) => {
  await page.goto("/admin");

  await expectLoginRedirect(page, "/admin");
  await expect(
    page.getByRole("heading", { name: /welcome back/i }),
  ).toBeVisible();
});
