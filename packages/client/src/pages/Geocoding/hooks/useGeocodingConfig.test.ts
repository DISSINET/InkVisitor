import { GeocodingAccuracy, IGeocodingContext } from "@inkvisitor/shared/types/geocoding";
import { describe, expect, it } from "vitest";
import { layerGeocodingContext, unionSources } from "./useGeocodingConfig";

/**
 * Covers invariant I12: settings resolve per field across the three layers, so a
 * partial user override never blanks a project-wide assignment.
 *
 * These would still pass if the merge were a plain spread, except for the
 * blank-value cases — which is precisely the bug they exist to catch, since a
 * user who clears one dropdown must not thereby unset every other field.
 */
describe("layerGeocodingContext", () => {
  const base: IGeocodingContext = {
    region: "silesia",
    period: "1200-1400",
    language: "de",
    autoSearch: true,
    mapClickAccuracy: GeocodingAccuracy.Approximate,
  };

  it("takes a later layer's value over an earlier one", () => {
    expect(layerGeocodingContext(base, { region: "occitania" }).region).toBe("occitania");
  });

  it("keeps earlier fields the later layer does not mention", () => {
    const merged = layerGeocodingContext(base, { region: "occitania" });
    expect(merged.period).toBe("1200-1400");
    expect(merged.language).toBe("de");
    expect(merged.mapClickAccuracy).toBe(GeocodingAccuracy.Approximate);
  });

  it("treats an empty string as unset rather than as a value", () => {
    expect(layerGeocodingContext(base, { region: "" }).region).toBe("silesia");
  });

  it("treats undefined and null as unset", () => {
    expect(layerGeocodingContext(base, { period: undefined }).period).toBe("1200-1400");
    expect(
      layerGeocodingContext(base, { language: null as unknown as string }).language,
    ).toBe("de");
  });

  it("does not lose a false boolean, which is a real value and not a blank", () => {
    expect(layerGeocodingContext(base, { autoSearch: false }).autoSearch).toBe(false);
  });

  it("applies layers left to right, so the last one wins", () => {
    const merged = layerGeocodingContext(
      base,
      { region: "france" },
      { region: "normandy" },
    );
    expect(merged.region).toBe("normandy");
  });

  it("ignores a missing layer entirely", () => {
    expect(layerGeocodingContext(base, undefined, { region: "france" })).toEqual({
      ...base,
      region: "france",
    });
  });
});

/**
 * A list-valued field, and the layering rule that decides what clearing one
 * means.
 *
 * These would fail if an empty list were treated as a value: the panel clears a
 * field by writing nothing to it, and the project's answer is meant to come
 * back through the hole.
 */
describe("layerGeocodingContext, over a field that holds a list", () => {
  it("takes a later layer's list over an earlier one", () => {
    expect(
      layerGeocodingContext<IGeocodingContext>({ languages: ["de"] }, { languages: ["la", "grc"] })
        .languages,
    ).toEqual(["la", "grc"]);
  });

  it("treats an empty list as unset, which is how a cleared field falls back", () => {
    expect(
      layerGeocodingContext<IGeocodingContext>({ languages: ["de"] }, { languages: [] }).languages,
    ).toEqual(["de"]);
  });
});

/**
 * The one context field whose layers union.
 *
 * These would fail if `disabledSources` layered like every other list field:
 * the researcher's list would replace the project's, so a personal preference
 * would silently switch a project-refused gazetteer back on — and the project's
 * reason for refusing it, a licence or a corpus it has nothing to do with, is
 * not a preference's to overrule.
 */
describe("unionSources", () => {
  it("keeps both layers' refusals", () => {
    expect(unionSources(["llm-coords"], ["chgis"])).toEqual(["chgis", "llm-coords"]);
  });

  it("does not let a personal list switch a project refusal back on", () => {
    // the personal layer says nothing about llm-coords, and saying nothing has
    // never been how a field is cleared here
    expect(unionSources(["llm-coords"], [])).toEqual(["llm-coords"]);
    expect(unionSources(["llm-coords"], ["chgis"])).toContain("llm-coords");
  });

  it("counts one refusal once, however many layers make it", () => {
    expect(unionSources(["gov"], ["gov"])).toEqual(["gov"]);
  });

  it("gives one form for one set, so two orderings do not read as a change", () => {
    expect(unionSources(["gov", "chgis"])).toEqual(unionSources(["chgis", "gov"]));
  });

  it("passes a missing layer through", () => {
    expect(unionSources(undefined, ["gov"])).toEqual(["gov"]);
    expect(unionSources(undefined, undefined)).toEqual([]);
  });
});
