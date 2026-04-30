import { expect, type Page } from "@playwright/test";

export async function expectLoginRedirect(page: Page, next: string) {
  await expect(page).toHaveURL((url) => {
    return url.pathname === "/login" && url.searchParams.get("next") === next;
  });
}
