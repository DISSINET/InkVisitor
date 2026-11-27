import { IGeocodingContext } from "@inkvisitor/shared/types/geocoding";
import { describe, expect, it } from "vitest";
import { buildSuggestQuery } from "./suggestQuery";

describe("buildSuggestQuery", () => {
  it("carries the name and sends no empty list, which the engine answers with a 422", () => {
    const query = buildSuggestQuery("Roma", {} as IGeocodingContext);
    expect(query.name).toBe("Roma");
    expect(query.region).toBeUndefined();
    expect(query.period).toBeUndefined();
    expect(query.language).toBeUndefined();
    expect(query.place_type).toBeUndefined();
  });

  it("sends no rule for a suggestion's coordinate unless the project chose one, leaving the engine's own", () => {
    expect("representative" in buildSuggestQuery("Roma", {} as IGeocodingContext)).toBe(false);
    expect("representative" in buildSuggestQuery("Roma", {} as IGeocodingContext, "")).toBe(false);
    expect(buildSuggestQuery("Roma", {} as IGeocodingContext, "medoid").representative).toBe("medoid");
  });

  it("sends the list fields as lists", () => {
    const query = buildSuggestQuery("Roma", {
      regions: ["italy"],
      periods: ["1200-1400"],
      languages: ["la", "it"],
      placeTypes: ["settlement"],
    } as IGeocodingContext);
    expect(query.region).toEqual(["italy"]);
    expect(query.period).toEqual(["1200-1400"]);
    expect(query.language).toEqual(["la", "it"]);
    expect(query.place_type).toEqual(["settlement"]);
  });

  it("sends a drawn box instead of a named region, never both", () => {
    const query = buildSuggestQuery("Roma", {
      regions: ["italy"],
      regionBbox: [10, 40, 14, 44],
    } as unknown as IGeocodingContext);
    expect(query.region).toBeUndefined();
    expect(query.regionBbox).toBeDefined();
  });
});
