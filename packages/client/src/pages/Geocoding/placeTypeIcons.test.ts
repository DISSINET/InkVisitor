import { GEOCODING_PLACE_TYPES } from "@inkvisitor/shared/types/geocoding";
import { describe, expect, it } from "vitest";
import { UNKNOWN_PLACE_TYPE, placeTypeChoices, placeTypeInfo } from "./placeTypeIcons";

/**
 * Most of the corpus states no kind of place, so the mark for "nobody has said"
 * is the one seen most often. An absent icon there would read as a rendering
 * fault rather than as the fact it is.
 */

describe("placeTypeInfo", () => {
  it("gives every kind in the vocabulary its own mark and words", () => {
    const seen = new Set<string>();
    for (const placeType of GEOCODING_PLACE_TYPES) {
      const info = placeTypeInfo(placeType);
      expect(info).not.toBe(UNKNOWN_PLACE_TYPE);
      expect(info.description.length).toBeGreaterThan(10);
      seen.add(info.label);
    }
    // twelve distinct labels: a repeated one would make two kinds indistinguishable
    expect(seen.size).toBe(GEOCODING_PLACE_TYPES.length);
  });

  it("falls back to the unknown mark for a Location that states nothing", () => {
    expect(placeTypeInfo(null)).toBe(UNKNOWN_PLACE_TYPE);
    expect(placeTypeInfo(undefined)).toBe(UNKNOWN_PLACE_TYPE);
    expect(placeTypeInfo("")).toBe(UNKNOWN_PLACE_TYPE);
  });

  it("falls back to the unknown mark for a kind the engine added since", () => {
    // the vocabulary is the engine's and grows; a wrong mark is read as a fact
    expect(placeTypeInfo("volcano")).toBe(UNKNOWN_PLACE_TYPE);
  });

  it("gives the unknown mark words of its own rather than an empty label", () => {
    expect(UNKNOWN_PLACE_TYPE.label).toBeTruthy();
    expect(UNKNOWN_PLACE_TYPE.description).toBeTruthy();
  });
});

describe("placeTypeChoices", () => {
  it("offers the whole vocabulary in its own order", () => {
    expect(placeTypeChoices().map((choice) => choice.value)).toEqual([...GEOCODING_PLACE_TYPES]);
  });
});
