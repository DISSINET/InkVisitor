import { describe, expect, it } from "vitest";
import { NO_PLACE_TYPE, matchesPlaceType, placeTypeOptionsFor } from "./useGeocodingBrowse";

/**
 * The corpus does not state what kind of place a Location is; a type appears
 * only once one has been geocoded through this page. So the filter's job on most
 * of the corpus is to say that plainly rather than to silently empty the list.
 */

const at = (placeType: string | null) => ({ placeType });

describe("placeTypeOptionsFor", () => {
  it("says nothing has been typed, and offers nothing to choose, on an untyped corpus", () => {
    const options = placeTypeOptionsFor([at(null), at(null)]);
    expect(options).toHaveLength(1);
    expect(options[0].label).toBe("no kinds recorded yet");
  });

  it("offers only the kinds actually present", () => {
    const options = placeTypeOptionsFor([at("fortress"), at("settlement"), at("fortress")]);
    expect(options.map((option) => option.value)).toEqual([
      "any",
      "settlement",
      "fortress",
    ]);
  });

  it("keeps the vocabulary's order, so the list does not reshuffle as places are typed", () => {
    // settlement precedes fortress in the vocabulary whichever order they arrive
    const options = placeTypeOptionsFor([at("fortress"), at("settlement")]);
    expect(options.map((option) => option.value).slice(1)).toEqual(["settlement", "fortress"]);
  });

  it("offers the untyped only when some are untyped", () => {
    expect(placeTypeOptionsFor([at("fortress"), at(null)]).map((o) => o.value)).toContain(
      NO_PLACE_TYPE,
    );
    expect(placeTypeOptionsFor([at("fortress")]).map((o) => o.value)).not.toContain(NO_PLACE_TYPE);
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
