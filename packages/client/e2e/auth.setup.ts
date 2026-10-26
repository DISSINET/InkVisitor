import { expect, test as setup } from "@playwright/test";
import { OWNER_STATE } from "../playwright.config";

// One signin for the whole run: the signin route allows five attempts per
// five minutes, and every spec reuses this browser state.
setup("sign in as owner", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("email or username").fill("owner");
  await page.getByPlaceholder("password").fill("owner");
  await page.getByRole("button", { name: "Log In" }).click();
  await expect(page.getByText("owner", { exact: true }).first()).toBeVisible();
  await page.context().storageState({ path: OWNER_STATE });
});
