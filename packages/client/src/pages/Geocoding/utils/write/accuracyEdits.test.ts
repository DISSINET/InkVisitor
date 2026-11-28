import { describe, expect, it } from "vitest";
import {
  AccuracyList,
  accuraciesToSave,
  addAccuracy,
  markAccuracy,
  moveAccuracy,
  removeAccuracy,
  repeatedAccuracy,
  setAccuracyConcept,
} from "./accuracyEdits";

const list: AccuracyList = {
  accuracies: ["c-precise", "c-approximate", "c-region"],
  accuracyWhenAgree: "c-precise",
  accuracyWhenScattered: "c-approximate",
};

describe("the accuracy list's edits", () => {
  it("adds an empty row at the end, which is not stored", () => {
    const added = addAccuracy(list);
    expect(added.accuracies).toEqual([...list.accuracies, ""]);
    expect(accuraciesToSave(added).accuracies).toEqual(list.accuracies);
  });

  it("moves a mark with nothing: a Concept replaced in its row takes its mark away with it", () => {
    const next = setAccuracyConcept(list, 0, "c-exact");
    expect(next.accuracies[0]).toBe("c-exact");
    expect(next.accuracyWhenAgree).toBe("");
    expect(next.accuracyWhenScattered).toBe("c-approximate");
  });

  it("removes a row and the mark it carried", () => {
    const next = removeAccuracy(list, 1);
    expect(next.accuracies).toEqual(["c-precise", "c-region"]);
    expect(next.accuracyWhenScattered).toBe("");
  });

  it("moves a row up or down, and leaves one at the edge where it is", () => {
    expect(moveAccuracy(list, 2, -1).accuracies).toEqual(["c-precise", "c-region", "c-approximate"]);
    expect(moveAccuracy(list, 0, -1)).toBe(list);
    expect(moveAccuracy(list, 2, 1)).toBe(list);
  });

  it("marks one accuracy per case, the mark moving rather than doubling", () => {
    const next = markAccuracy(list, "accuracyWhenAgree", "c-region");
    expect(next.accuracyWhenAgree).toBe("c-region");
    expect(markAccuracy(next, "accuracyWhenAgree", "").accuracyWhenAgree).toBe("");
  });

  it("names a Concept listed twice, and none where every Concept is listed once", () => {
    expect(repeatedAccuracy(list)).toBeUndefined();
    expect(repeatedAccuracy({ ...list, accuracies: ["c-a", "", "c-b", "", "c-a"] })).toBe("c-a");
  });
});
