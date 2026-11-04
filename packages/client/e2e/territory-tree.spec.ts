import { expect, test } from "@playwright/test";

test("the tree lists the seeded territories and selecting one lists its statements", async ({ page }) => {
  await page.goto("/#territory=T0");
  const tree = page.locator("#box-content-territories");
  await expect(tree.locator("#territoryT0")).toContainText("root");
  await expect(tree.locator("#territoryt1")).toContainText("priest Minda and their stories");

  // the arrow icon selects the territory; the label only copies it
  await tree.locator("#territoryt1 > *").first().click();
  await expect(page).toHaveURL(/territory=t1/);
  const statements = page.locator("#box-content-statements");
  await expect(statements.locator("#statements1")).toContainText("Minda, the priest of the great Cat lord");
  await expect(statements.locator("#statements4")).toContainText("Mauw mountain temple");
});
