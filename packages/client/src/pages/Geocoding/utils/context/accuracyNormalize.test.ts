import { normalizeAccuracyRoles } from "@inkvisitor/shared/types/geocoding";
import { describe, expect, it } from "vitest";

/**
 * A project's accuracies as a stored settings row stands for them: the list the
 * owner keeps, or, in a row written before there was a list, the four words.
 */
describe("normalizeAccuracyRoles", () => {
  it("reads the list as stored, with its marks", () => {
    expect(
      normalizeAccuracyRoles({
        accuracies: ["c-near", "c-far"],
        accuracyWhenAgree: "c-near",
        accuracyWhenScattered: "c-far",
      }),
    ).toEqual({ accuracies: ["c-near", "c-far"], accuracyWhenAgree: "c-near", accuracyWhenScattered: "c-far" });
  });

  it("keeps an emptied list empty, even where the row still holds the four words", () => {
    const read = normalizeAccuracyRoles({
      accuracies: [],
      accuracyValues: { precise: "c-precise", approximate: "c-approximate" },
    });
    expect(read.accuracies).toEqual([]);
  });

  it("turns the four words into the list in their order, precise and approximate marked", () => {
    expect(
      normalizeAccuracyRoles({
        accuracyValues: {
          unknown: "c-unknown",
          approximate: "c-approximate",
          precise: "c-precise",
          region: "c-region",
        },
      }),
    ).toEqual({
      accuracies: ["c-precise", "c-approximate", "c-region", "c-unknown"],
      accuracyWhenAgree: "c-precise",
      accuracyWhenScattered: "c-approximate",
    });
  });

  it("keeps a Concept the four words shared once", () => {
    const read = normalizeAccuracyRoles({
      accuracyValues: { precise: "c-one", approximate: "c-one", region: "c-region" },
    });
    expect(read.accuracies).toEqual(["c-one", "c-region"]);
  });

  it("drops a mark on a Concept the list does not hold, and a blank row", () => {
    expect(
      normalizeAccuracyRoles({
        accuracies: ["c-near", ""],
        accuracyWhenAgree: "c-gone",
        accuracyWhenScattered: "c-near",
      }),
    ).toEqual({ accuracies: ["c-near"], accuracyWhenAgree: "", accuracyWhenScattered: "c-near" });
  });

  it("reads nothing at all as no accuracies", () => {
    expect(normalizeAccuracyRoles(undefined)).toEqual({
      accuracies: [],
      accuracyWhenAgree: "",
      accuracyWhenScattered: "",
    });
  });
});
