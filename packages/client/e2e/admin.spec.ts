import { expect, test } from "@playwright/test";

test("the users page lists the seeded users", async ({ page }) => {
  await page.goto("/users");
  const users = page.locator("#box-content-users");
  await expect(users.getByText("editor1", { exact: true })).toBeVisible();
  await expect(users.getByText("viewer1", { exact: true })).toBeVisible();
});

test("the global validations modal shows the seeded settings", async ({ page }) => {
  await page.goto("/#territory=T0");
  await page.getByRole("button", { name: "Menu" }).hover();
  await page.getByText("Global validations").click();
  await expect(page.getByText("Superclass missing")).toBeVisible();
  await expect(page.getByText("Missing entity detail")).toBeVisible();
});
