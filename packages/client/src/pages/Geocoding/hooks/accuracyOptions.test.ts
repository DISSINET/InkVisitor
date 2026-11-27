import { describe, expect, it } from "vitest";
import { Accuracies } from "./accuraciesContext";
import { accuracyOptionsFor, ANY } from "./useGeocodingBrowse";

const accuracies: Accuracies = {
  entries: [
    { conceptId: "c-street", label: "to the street", detail: "" },
    { conceptId: "c-town", label: "to the town", detail: "" },
  ],
  whenAgree: "c-street",
  whenScattered: "c-town",
  labelOf: (accuracy) => accuracy ?? "",
};

describe("accuracyOptionsFor", () => {
  it("offers the project's accuracies in its order, and the ones no Location carries too", () => {
    expect(accuracyOptionsFor([], accuracies)).toEqual([
      { value: ANY, label: "any" },
      { value: "c-street", label: "to the street" },
      { value: "c-town", label: "to the town" },
    ]);
  });

  it("offers an accuracy the project no longer lists where a Location still carries it", () => {
    const options = accuracyOptionsFor(
      [
        { accuracy: "c-old", accuracyLabel: "roughly (not in the accuracy list)" },
        { accuracy: "c-town", accuracyLabel: "to the town" },
        { accuracy: null, accuracyLabel: "" },
      ],
      accuracies,
    );
    expect(options.map((option) => option.value)).toEqual([ANY, "c-street", "c-town", "c-old"]);
    expect(options[3].label).toBe("roughly (not in the accuracy list)");
  });

  it("offers the accuracy filtered by, so its chip can name it, where nothing else does", () => {
    const named = { ...accuracies, labelOf: (accuracy: string | null | undefined) => `named ${accuracy}` };
    const options = accuracyOptionsFor([], named, "c-removed");
    expect(options.at(-1)).toEqual({ value: "c-removed", label: "named c-removed" });
    // a listed one is offered once
    expect(accuracyOptionsFor([], named, "c-town")).toHaveLength(3);
  });
});
