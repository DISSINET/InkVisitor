import { defaultCiteWithinKm, normalizeCitingRoles } from "@inkvisitor/shared/types/geocoding";
import { describe, expect, it } from "vitest";

/**
 * The citing settings of a stored row. A row saved before they existed reads as
 * the engine's own rule and the default distances, without anyone saving it.
 */
describe("normalizeCitingRoles", () => {
  it("reads a row saved before the settings existed as the engine's rule and the default distances", () => {
    expect(normalizeCitingRoles({ geometry: "c-geo" })).toEqual({
      representative: "",
      citeWithinKm: defaultCiteWithinKm(),
    });
    expect(normalizeCitingRoles(undefined).representative).toBe("");
  });

  it("keeps a rule the engine takes, and reads any other as the engine's own", () => {
    expect(normalizeCitingRoles({ representative: "densest" }).representative).toBe("densest");
    expect(normalizeCitingRoles({ representative: "centroid" }).representative).toBe("");
  });

  it("keeps the distances an owner set and fills the rest with the defaults", () => {
    const { citeWithinKm } = normalizeCitingRoles({ citeWithinKm: { religious: 0.8, castle: 2 } });
    expect(citeWithinKm.religious).toBe(0.8);
    expect(citeWithinKm.castle).toBe(2);
    expect(citeWithinKm.settlement).toBe(defaultCiteWithinKm().settlement);
  });

  it("reads a distance that is not a positive number as the default", () => {
    const { citeWithinKm } = normalizeCitingRoles({
      citeWithinKm: { religious: 0, settlement: -3, region: "30", river: Number.NaN },
    });
    const defaults = defaultCiteWithinKm();
    expect(citeWithinKm.religious).toBe(defaults.religious);
    expect(citeWithinKm.settlement).toBe(defaults.settlement);
    expect(citeWithinKm.region).toBe(defaults.region);
    expect(citeWithinKm.river).toBe(defaults.river);
  });
});
