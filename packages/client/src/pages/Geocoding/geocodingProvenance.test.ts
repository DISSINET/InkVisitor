import { describe, expect, it } from "vitest";
import { Suggestion } from "./engineTypes";
import { __testing } from "./GeocodingSuggestions";

const { provenanceOf } = __testing;

/**
 * A suggestion groups every match that landed on the same place, so one source
 * can appear many times in it. Writing all of them records a town's airport as
 * evidence for the town.
 */
const suggestion = (matches: Partial<Suggestion["matches"][number]>[]): Suggestion =>
  ({ matches }) as Suggestion;

describe("provenanceOf", () => {
  it("cites each source once, not once per match", () => {
    const result = provenanceOf(
      suggestion([
        { source: "geonames", sourceId: "1", matchType: "fuzzy" },
        { source: "geonames", sourceId: "2", matchType: "fuzzy" },
        { source: "geonames", sourceId: "3", matchType: "exact" },
      ]),
    );
    expect(result).toHaveLength(1);
  });

  it("cites the best match a source made, not the first it returned", () => {
    const result = provenanceOf(
      suggestion([
        { source: "geonames", sourceId: "airport", matchType: "fuzzy" },
        { source: "geonames", sourceId: "the-town", matchType: "exact" },
      ]),
    );
    expect(result[0].sourceId).toBe("the-town");
  });

  it("prefers an alias over a fuzzy hit", () => {
    const result = provenanceOf(
      suggestion([
        { source: "whg", sourceId: "fuzzy-one", matchType: "fuzzy" },
        { source: "whg", sourceId: "attested-name", matchType: "alias" },
      ]),
    );
    expect(result[0].sourceId).toBe("attested-name");
  });

  it("keeps every distinct source", () => {
    const result = provenanceOf(
      suggestion([
        { source: "wikidata", sourceId: "Q1", matchType: "exact" },
        { source: "tgn", sourceId: "T1", matchType: "exact" },
      ]),
    );
    expect(result.map((p) => p.source).sort()).toEqual(["tgn", "wikidata"]);
  });

  it("never cites llm-coords — it is a guess with no record behind it", () => {
    const result = provenanceOf(
      suggestion([{ source: "llm-coords", sourceId: "x", matchType: "hint" }]),
    );
    expect(result).toEqual([]);
  });

  it("skips a match with no identifier rather than writing a blank reference", () => {
    const result = provenanceOf(suggestion([{ source: "wikipedia", matchType: "exact" }]));
    expect(result).toEqual([]);
  });
});
