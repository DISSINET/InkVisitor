import { expect, test } from "@playwright/test";

test("a label search returns the seeded person", async ({ page }) => {
  await page.goto("/#territory=T0");
  const search = page.locator("#box-content-search");
  await search.getByPlaceholder("label or uuid(s)").fill("Minda");
  await expect(search.getByText("Minda, the priest")).toBeVisible();
});
