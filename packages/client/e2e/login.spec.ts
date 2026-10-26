import { expect, test } from "@playwright/test";

test.describe("login", () => {
  test.describe("without a session", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("a wrong password shows the server message", async ({ page }) => {
      await page.goto("/login");
      await page.getByPlaceholder("email or username").fill("admin");
      await page.getByPlaceholder("password").fill("nope");
      await page.getByRole("button", { name: "Log In" }).click();
      await expect(page.getByText("wrong password")).toBeVisible();
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test("the stored session lands on the main page with the user name", async ({ page }) => {
    await page.goto("/#territory=T0");
    await expect(page.getByText("owner", { exact: true }).first()).toBeVisible();
    await expect(page.locator("#box-content-territories")).toBeVisible();
  });
});
