import { expect, test } from "@playwright/test";

test("running a label query lists the seeded person", async ({ page }) => {
  await page.goto("/explorer");
  // all classes with no filter is an empty request the explorer never runs, and
  // the label filter is a search criterion, so it is set before the run
  await page.getByPlaceholder("Filter by entity label").fill("Minda");
  await expect(page.getByText("Run the search to see matching entities. (Enter)")).toBeVisible();
  await page.getByRole("button", { name: "search", exact: true }).click();
  const rows = page.locator(".qt-row");
  await expect(rows.first()).toBeVisible();
  await expect(page.locator(".qt-row", { hasText: "Minda, the priest" })).toBeVisible();
});

const API = "http://127.0.0.1:3301/api/v1";
const API_HEADERS = { "x-inkvisitor-client": "1", Origin: "http://127.0.0.1:8301" };

test("replacing a relation in a batch asks for a confirmation and saves", async ({ page }) => {
  // seeded Concepts: c2 "priest", c3 "occupation"
  const label = `batch replace ${Date.now()}`;
  const personId = `e2e-${Date.now()}`;
  const created = await page.request.post(`${API}/entities`, {
    headers: API_HEADERS,
    data: {
      id: personId,
      class: "P",
      labels: [label],
      detail: "",
      status: "1",
      language: "eng",
      notes: [],
      props: [],
      references: [],
      data: { logicalType: "1" },
    },
  });
  expect(created.ok()).toBeTruthy();
  const relation = await page.request.post(`${API}/relations`, {
    headers: API_HEADERS,
    data: { type: "CLA", entityIds: [personId, "c2"], order: 1 },
  });
  expect(relation.ok()).toBeTruthy();

  await page.goto("/explorer");
  await page.getByPlaceholder("Filter by entity label").fill(label);
  await page.getByRole("button", { name: "search", exact: true }).click();
  const rows = page.locator(".qt-row");
  await expect(rows).toHaveCount(1);
  await rows.first().locator('[class*="StyledCheckbox"]').first().click();

  // the batch dropdown sits right before the apply button, after the row checkboxes
  const applyButton = page.getByRole("button", { name: "apply", exact: true });
  await applyButton.locator("xpath=preceding-sibling::*[1]").getByRole("combobox").click();
  await page.locator('[role=listbox] [class*="StyledOption"]', { hasText: "replace relation" }).click();
  await applyButton.click();

  await expect(page.getByText("Replace relation (1 entities)")).toBeVisible();
  await page.getByRole("combobox").filter({ has: page.getByPlaceholder("select relation type") }).click();
  await page.locator('[role=listbox] [class*="StyledOption"]', { hasText: "Classification" }).click();
  for (const [placeholder, target] of [
    ["select current target", "priest"],
    ["select new target", "occupation"],
  ]) {
    await page.getByPlaceholder(placeholder).fill(target);
    await page.locator('[class*="StyledSuggestionRow"] [class*="StyledSuggestionLineActions"] button').first().click();
  }
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await expect(page.getByText("on 1 of 1 selected entity")).toBeVisible();
  await page.getByRole("button", { name: "Replace", exact: true }).click();
  await expect(page.getByText("Replaced on 1 of 1 entities")).toBeVisible();

  const after = await page.request.get(`${API}/entities/${personId}/relations?filters[relationType]=CLA`, {
    headers: API_HEADERS,
  });
  const relations = await after.json();
  expect(relations).toHaveLength(1);
  expect(relations[0].entityIds).toEqual([personId, "c3"]);
});
