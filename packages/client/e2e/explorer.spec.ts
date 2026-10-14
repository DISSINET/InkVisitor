import { expect, test } from "@playwright/test";

test("running a label query lists the seeded person", async ({ page }) => {
  await page.goto("/explorer");
  // all classes with no filter is an empty request the explorer never runs, and
  // the label filter is a search criterion, so it is set before the run
  await page.getByPlaceholder("Filter by entity label").fill("Minda");
  await expect(page.getByText("Run the search to see matching entities. (Enter)")).toBeVisible();
  await page.getByRole("button", { name: "run search" }).click();
  const rows = page.locator(".qt-row");
  await expect(rows.first()).toBeVisible();
  await expect(page.locator(".qt-row", { hasText: "Minda, the priest" })).toBeVisible();
});
