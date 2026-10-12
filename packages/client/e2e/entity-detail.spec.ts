import { expect, test } from "@playwright/test";

test("the detail of a seeded person shows its label, id and sections", async ({ page }) => {
  await page.goto("/#territory=T0&detail=p1&selectedDetail=p1");
  const detail = page.locator("#box-content-detail");
  // the row caption is a sibling of the input, not an associated <label>
  const label = detail.getByText("Label", { exact: true }).locator("xpath=..").getByRole("textbox");
  await expect(label).toBeVisible();
  await expect(label).toHaveValue("Minda, the priest");
  await expect(detail.getByText("p1", { exact: true })).toBeVisible();
  await expect(detail.getByText("Relations", { exact: true })).toBeVisible();
  await expect(detail.getByText("Used in:")).toBeVisible();
});
