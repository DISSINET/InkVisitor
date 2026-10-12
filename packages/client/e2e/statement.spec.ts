import { expect, test } from "@playwright/test";

const ORIGINAL = "This sacrifice ceremony will take place at the sanctuary of the Mauw mountain temple.";
const EDITED = `${ORIGINAL} (smoke edit)`;

test("editing the statement text persists across a reload", async ({ page }) => {
  await page.goto("/#territory=t1&statement=s4");
  const text = page.getByPlaceholder("Insert statement text here");
  await expect(text).toHaveValue(ORIGINAL);

  // the editor saves on blur with PUT /entities/<id>
  const saved = page.waitForResponse(
    (res) => res.url().includes("/entities/s4") && res.request().method() === "PUT"
  );
  await text.fill(EDITED);
  await page.keyboard.press("Tab");
  expect((await saved).ok()).toBe(true);

  await page.reload();
  await expect(page.getByPlaceholder("Insert statement text here")).toHaveValue(EDITED);
  await expect(page.locator("#box-content-statements #statements4")).toContainText("(smoke edit)");
});
