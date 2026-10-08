import { describe, expect, it } from "vitest";
import { entityIdsToAnchor } from "./anchorUtils";

describe("entityIdsToAnchor", () => {
  it("returns every picked id when the match carries no anchors", () => {
    expect(entityIdsToAnchor(["G", "C"], [])).toEqual(["G", "C"]);
  });

  it("skips ids the match already carries", () => {
    expect(entityIdsToAnchor(["G", "C"], ["G"])).toEqual(["C"]);
  });

  it("returns nothing when the match carries all of them", () => {
    expect(entityIdsToAnchor(["G", "C"], ["C", "G"])).toEqual([]);
  });

  it("ignores anchors on the match that were not picked", () => {
    expect(entityIdsToAnchor(["G"], ["A", "B"])).toEqual(["G"]);
  });

  it("preserves the picked order, which decides nesting order", () => {
    expect(entityIdsToAnchor(["A", "B", "C"], ["B"])).toEqual(["A", "C"]);
  });

  it("returns nothing when nothing is picked", () => {
    expect(entityIdsToAnchor([], ["G"])).toEqual([]);
  });
});
