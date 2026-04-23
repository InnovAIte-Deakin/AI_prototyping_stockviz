import { expect, test } from "@playwright/test";

test("renders the public login page and validates required fields", async ({
  page,
}) => {
  await page.goto("/login");

  await expect(
    page.getByRole("heading", { name: /welcome back/i }),
  ).toBeVisible();

  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(
    page.getByText("Please fill out all required fields"),
  ).toBeVisible();
});
