import { defaultPlaceTypes } from "@inkvisitor/shared/types/geocoding";
import { describe, expect, it } from "vitest";
import {
  NO_PLACE_TYPE,
  matchesKinds,
  matchesPlaceType,
  placeTypeOptionsFor,
} from "./useGeocodingBrowse";

/**
 * The corpus does not state what kind of place a Location is; a type appears
 * only once one has been geocoded through this page. So the filter's job on most
 * of the corpus is to say that plainly rather than to silently empty the list.
 */

const kinds = defaultPlaceTypes();
const at = (placeType: string | null, more: string[] = []) => ({
  placeType,
  placeTypes: placeType ? [placeType, ...more] : [],
});

describe("placeTypeOptionsFor", () => {
  it("says nothing has been typed, and offers nothing to choose, on an untyped corpus", () => {
    const options = placeTypeOptionsFor([at(null), at(null)], kinds);
    expect(options).toHaveLength(1);
    expect(options[0].label).toBe("no kinds recorded yet");
  });

  it("offers only the kinds actually present", () => {
    const options = placeTypeOptionsFor([at("fortress"), at("settlement"), at("fortress")], kinds);
    expect(options.map((option) => option.value)).toEqual([
      "any",
      "settlement",
      "fortress",
    ]);
  });

  it("keeps the vocabulary's order, so the list does not reshuffle as places are typed", () => {
    // settlement precedes fortress in the vocabulary whichever order they arrive
    const options = placeTypeOptionsFor([at("fortress"), at("settlement")], kinds);
    expect(options.map((option) => option.value).slice(1)).toEqual(["settlement", "fortress"]);
  });

  it("labels a kind by the name the project gave it", () => {
    const renamed = kinds.map((one) =>
      one.id === "fortress" ? { ...one, name: "hill fort" } : one,
    );
    expect(placeTypeOptionsFor([at("fortress")], renamed)[1].label).toBe("hill fort");
  });

  it("offers a kind a Location carries beyond its first", () => {
    const options = placeTypeOptionsFor([at("settlement", ["river"])], kinds);
    expect(options.map((option) => option.value)).toContain("river");
  });

  it("offers the untyped only when some are untyped", () => {
    expect(placeTypeOptionsFor([at("fortress"), at(null)], kinds).map((o) => o.value)).toContain(
      NO_PLACE_TYPE,
    );
    expect(placeTypeOptionsFor([at("fortress")], kinds).map((o) => o.value)).not.toContain(NO_PLACE_TYPE);
  });
});

describe("matchesPlaceType", () => {
  it("keeps everything under any", () => {
    expect(matchesPlaceType("fortress", "any")).toBe(true);
    expect(matchesPlaceType(null, "any")).toBe(true);
  });

  it("keeps only that kind under a named one", () => {
    expect(matchesPlaceType("fortress", "fortress")).toBe(true);
    expect(matchesPlaceType("settlement", "fortress")).toBe(false);
    expect(matchesPlaceType(null, "fortress")).toBe(false);
  });

  it("keeps only the untyped under the untyped choice", () => {
    // this is the one a session that has to type the corpus first works from
    expect(matchesPlaceType(null, NO_PLACE_TYPE)).toBe(true);
    expect(matchesPlaceType("fortress", NO_PLACE_TYPE)).toBe(false);
  });
});

describe("matchesKinds", () => {
  it("finds a Location under every kind it has, not only the first", () => {
    expect(matchesKinds(["settlement", "river"], "river")).toBe(true);
    expect(matchesKinds(["settlement", "river"], "lake")).toBe(false);
  });

  it("keeps everything under any, and only the kindless under no kind", () => {
    expect(matchesKinds([], "any")).toBe(true);
    expect(matchesKinds([], NO_PLACE_TYPE)).toBe(true);
    expect(matchesKinds(["river"], NO_PLACE_TYPE)).toBe(false);
  });
});
