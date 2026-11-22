import { describe, expect, it } from "vitest";
import { selectedInResult } from "./useExplorerControls";

describe("selectedInResult", () => {
  it("keeps the selected ids of the result, in the result's order", () => {
    expect(selectedInResult(["a", "b", "c"], new Set(["c", "x", "a"]))).toEqual(["a", "c"]);
  });

  it("is empty when no selected id is part of the result", () => {
    expect(selectedInResult(["a"], new Set(["x"]))).toEqual([]);
    expect(selectedInResult([], new Set(["a"]))).toEqual([]);
  });
});
