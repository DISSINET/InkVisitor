import { describe, expect, it } from "vitest";
import { defaultCiteWithinKm } from "@inkvisitor/shared/types/geocoding";
import { Suggestion } from "../../types/engine";
import {
  citingDistanceKm,
  haversineKm,
  provenanceOf,
  representativeIndexOf,
  standingsOf,
} from "./suggestionProvenance";

/**
 * A suggestion groups every match the engine found within its grouping radius,
 * and its coordinate is one of them. A record at the edge of the group did not
 * say the place is where the coordinate is, so it is not cited for it.
 *
 * One degree of latitude is 111.2 km, so 0.001° is about 110 m.
 */
type MatchSeed = Partial<Suggestion["matches"][number]>;
const suggestion = (
  matches: MatchSeed[],
  representativeIndex: number | undefined = 0,
): Suggestion => {
  const lead = matches[representativeIndex ?? 0];
  return {
    lat: lead.lat ?? 50,
    lon: lead.lon ?? 15,
    matches: matches.map((match) => ({ lat: 50, lon: 15, matchType: "exact", ...match })),
    representativeIndex,
  } as Suggestion;
};
const at = (km: number) => 50 + km / 111.195;
const NEAR = 1.5;

describe("provenanceOf, by distance from the written coordinate", () => {
  // the example the citing rule was asked for: C1 and C2 on one spot, C3 very
  // close, C4 inside the group but further out
  const c1toC4 = suggestion([
    { source: "wikidata", sourceId: "C1", lat: at(0) },
    { source: "geonames", sourceId: "C2", lat: at(0) },
    { source: "tgn", sourceId: "C3", lat: at(0.3) },
    { source: "whg", sourceId: "C4", lat: at(5) },
  ]);

  it("cites the gazetteers whose records lie within the distance, and not the one further out", () => {
    expect(provenanceOf(c1toC4, NEAR).map((claim) => claim.sourceId)).toEqual(["C1", "C2", "C3"]);
  });

  it("cites the further one too once the distance reaches it", () => {
    expect(provenanceOf(c1toC4, 6).map((claim) => claim.sourceId)).toContain("C4");
  });

  it("always cites the record the coordinate is taken from, whatever its match type", () => {
    const fuzzyLead = suggestion([
      { source: "nominatim", sourceId: "lead", matchType: "fuzzy" },
      { source: "nominatim", sourceId: "exact-but-elsewhere", matchType: "exact", lat: at(0.5) },
    ]);
    expect(provenanceOf(fuzzyLead, NEAR)).toEqual([{ source: "nominatim", sourceId: "lead" }]);
  });

  it("cites a gazetteer with the record within the distance, not its better-matched one further out", () => {
    const townAndAbbey = suggestion([
      { source: "wikidata", sourceId: "abbey" },
      { source: "geonames", sourceId: "the-town", matchType: "exact", lat: at(2) },
      { source: "geonames", sourceId: "abbey-alias", matchType: "alias", lat: at(0.4) },
    ]);
    expect(provenanceOf(townAndAbbey, NEAR)).toContainEqual({
      source: "geonames",
      sourceId: "abbey-alias",
    });
  });

  it("among a gazetteer's records within the distance, cites the best-matched, then the nearer", () => {
    const records = suggestion([
      { source: "wikidata", sourceId: "lead" },
      { source: "whg", sourceId: "fuzzy-near", matchType: "fuzzy", lat: at(0.1) },
      { source: "whg", sourceId: "alias-far", matchType: "alias", lat: at(1) },
      { source: "whg", sourceId: "alias-near", matchType: "alias", lat: at(0.5) },
    ]);
    expect(provenanceOf(records, NEAR)).toContainEqual({ source: "whg", sourceId: "alias-near" });
  });

  it("cites each gazetteer once, however many of its records lie within", () => {
    const many = suggestion([
      { source: "wikidata", sourceId: "Q1" },
      { source: "geonames", sourceId: "1", lat: at(0.1) },
      { source: "geonames", sourceId: "2", lat: at(0.2) },
      { source: "geonames", sourceId: "3", lat: at(0.3) },
    ]);
    expect(provenanceOf(many, NEAR).map((claim) => claim.source)).toEqual(["wikidata", "geonames"]);
  });

  it("cites no gazetteer the project gave no Resource, the coordinate's own included", () => {
    const resources = { geonames: "r-geonames" };
    expect(provenanceOf(c1toC4, NEAR, resources)).toEqual([{ source: "geonames", sourceId: "C2" }]);
    const standings = standingsOf(c1toC4, NEAR, resources);
    expect(standings.find((one) => one.representative)).toMatchObject({ cited: false, unassigned: true });
  });

  it("cites nothing for a record whose distance cannot be measured", () => {
    const broken = suggestion([
      { source: "wikidata", sourceId: "Q1" },
      { source: "tgn", sourceId: "T1", lat: Number.NaN },
    ]);
    expect(provenanceOf(broken, NEAR)).toEqual([{ source: "wikidata", sourceId: "Q1" }]);
  });

  it("never cites llm-coords, even as the coordinate's own match", () => {
    const guess = suggestion([
      { source: "llm-coords", sourceId: "x", matchType: "hint" },
      { source: "wikidata", sourceId: "Q1", lat: at(0.2) },
    ]);
    expect(provenanceOf(guess, NEAR)).toEqual([{ source: "wikidata", sourceId: "Q1" }]);
  });

  it("skips a match with no identifier rather than writing a blank reference", () => {
    expect(provenanceOf(suggestion([{ source: "wikipedia" }]), NEAR)).toEqual([]);
  });
});

describe("representativeIndexOf", () => {
  it("reads the engine's own index", () => {
    const two = suggestion([{ source: "a", lat: at(1) }, { source: "b" }], 1);
    expect(representativeIndexOf(two)).toBe(1);
  });

  it("finds the match at the suggestion's coordinate where an engine before 0.8.0 gives no index", () => {
    const old = {
      ...suggestion([{ source: "a", lat: at(1) }, { source: "b", lat: at(0) }], 1),
      representativeIndex: undefined,
    };
    expect(representativeIndexOf(old)).toBe(1);
  });
});

describe("standingsOf", () => {
  it("puts the coordinate's own record first and the rest nearest first, marking those beyond", () => {
    const standings = standingsOf(
      suggestion(
        [
          { source: "far", sourceId: "f", lat: at(4) },
          { source: "lead", sourceId: "l", lat: at(0) },
          { source: "near", sourceId: "n", lat: at(0.5) },
        ],
        1,
      ),
      NEAR,
    );
    expect(standings.map((one) => [one.match.source, one.representative, one.beyond])).toEqual([
      ["lead", true, false],
      ["near", false, false],
      ["far", false, true],
    ]);
  });
});

describe("citingDistanceKm", () => {
  const distances = defaultCiteWithinKm();

  it("takes the distance of the location type the search resolved to", () => {
    expect(citingDistanceKm(distances, ["religious"])).toBe(1.5);
  });

  it("takes the largest of several, as the engine groups by the largest radius", () => {
    expect(citingDistanceKm(distances, ["religious", "settlement"])).toBe(5);
  });

  it("takes the distance for none, or any, where the search resolved to no type or to any", () => {
    expect(citingDistanceKm({ ...distances, "": 3 }, [])).toBe(3);
    expect(citingDistanceKm({ ...distances, "": 3 }, undefined)).toBe(3);
    expect(citingDistanceKm({ ...distances, "": 3 }, ["any"])).toBe(3);
  });
});

describe("haversineKm", () => {
  it("measures a degree of latitude as the engine does", () => {
    expect(haversineKm(50, 15, 51, 15)).toBeCloseTo(111.195, 2);
  });
});
