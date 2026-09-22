import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IProp } from "@inkvisitor/shared/types";
import { GeocodingAccuracy, IGeocodingRoles } from "@inkvisitor/shared/types/geocoding";
import { CProp } from "constructors";
import { describe, expect, it } from "vitest";
import { collectGeoValueIds, deriveGeocoding } from "./geocodingDerivation";

/**
 * Covers invariant I1: a Location is geocoded only when geo:x, geo:y and
 * geo:accuracy are all present AND each value resolves to an existing entity
 * with a non-empty label.
 *
 * The cases that matter are the ones where props exist and the answer is still
 * "not geocoded" — a test that only proved a well-formed Location reads as
 * geocoded would pass against a function that never checked anything.
 */

const roles: IGeocodingRoles = {
  x: "concept-x",
  y: "concept-y",
  accuracy: "concept-accuracy",
  type: "concept-type",
  accuracyValues: {
    [GeocodingAccuracy.Precise]: "value-precise",
    [GeocodingAccuracy.Approximate]: "value-approximate",
  },
  placeTypes: { settlement: "value-settlement" },
  resources: {},
};

// built through the app's own constructor rather than a hand-rolled literal, so
// a change to the prop shape reaches these fixtures
const prop = (typeId: string, valueId: string): IProp => {
  const built = CProp();
  built.type.entityId = typeId;
  built.value.entityId = valueId;
  return built;
};

const location = (props: IProp[]): IEntity =>
  ({ id: "L1", class: EntityEnums.Class.Location, labels: ["Breslau"], props }) as IEntity;

const entity = (id: string, label: string): IEntity => ({ id, labels: [label] }) as IEntity;

const wellFormed = location([
  prop("concept-x", "v-lon"),
  prop("concept-y", "v-lat"),
  prop("concept-accuracy", "value-precise"),
]);

const values = {
  "v-lon": entity("v-lon", "17.033"),
  "v-lat": entity("v-lat", "51.107"),
};

describe("deriveGeocoding", () => {
  it("reads a well-formed Location", () => {
    const result = deriveGeocoding(wellFormed, roles, values);
    expect(result.isGeocoded).toBe(true);
    expect(result.lon).toBe(17.033);
    expect(result.lat).toBe(51.107);
    expect(result.accuracy).toBe(GeocodingAccuracy.Precise);
    expect(result.problem).toBeNull();
  });

  it("does not confuse the axes — x is longitude, y is latitude", () => {
    // the failure this guards would put the whole corpus in the Gulf of Guinea
    // while every individual number still looked plausible
    const result = deriveGeocoding(wellFormed, roles, values);
    expect(result.lon).toBe(17.033);
    expect(result.lat).toBe(51.107);
  });

  it("is not geocoded when a value entity no longer exists", () => {
    const result = deriveGeocoding(wellFormed, roles, { "v-lat": values["v-lat"] });
    expect(result.isGeocoded).toBe(false);
    expect(result.problem).toContain("longitude");
  });

  it("is not geocoded when a value entity has a blank label", () => {
    const result = deriveGeocoding(wellFormed, roles, {
      ...values,
      "v-lon": entity("v-lon", "   "),
    });
    expect(result.isGeocoded).toBe(false);
  });

  it("is not geocoded when a coordinate is not a number", () => {
    const result = deriveGeocoding(wellFormed, roles, {
      ...values,
      "v-lat": entity("v-lat", "somewhere near the river"),
    });
    expect(result.isGeocoded).toBe(false);
  });

  it("rejects a latitude outside the earth's range", () => {
    const result = deriveGeocoding(wellFormed, roles, {
      ...values,
      "v-lat": entity("v-lat", "151.107"),
    });
    expect(result.isGeocoded).toBe(false);
  });

  it("accepts a legitimate zero and a negative coordinate", () => {
    const result = deriveGeocoding(wellFormed, roles, {
      "v-lon": entity("v-lon", "0"),
      "v-lat": entity("v-lat", "-33.9"),
    });
    expect(result.isGeocoded).toBe(true);
    expect(result.lon).toBe(0);
    expect(result.lat).toBe(-33.9);
  });

  it("is not geocoded when accuracy is missing, even with both coordinates", () => {
    const result = deriveGeocoding(
      location([prop("concept-x", "v-lon"), prop("concept-y", "v-lat")]),
      roles,
      values,
    );
    expect(result.isGeocoded).toBe(false);
    expect(result.problem).toContain("accuracy");
  });

  it("is not geocoded when accuracy points at an unconfigured Concept", () => {
    const result = deriveGeocoding(
      location([
        prop("concept-x", "v-lon"),
        prop("concept-y", "v-lat"),
        prop("concept-accuracy", "some-other-concept"),
      ]),
      roles,
      values,
    );
    expect(result.isGeocoded).toBe(false);
    expect(result.problem).toContain("configured");
  });

  it("reports no problem for a Location that was never geocoded at all", () => {
    // an empty cell in the list is expected here; a warning would be noise on
    // most of the corpus
    const result = deriveGeocoding(location([]), roles, {});
    expect(result.isGeocoded).toBe(false);
    expect(result.problem).toBeNull();
  });

  it("reads place type independently of whether the coordinate is usable", () => {
    const result = deriveGeocoding(
      location([prop("concept-type", "value-settlement")]),
      roles,
      {},
    );
    expect(result.placeType).toBe("settlement");
    expect(result.isGeocoded).toBe(false);
  });

  it("reads nothing and reports nothing when the roles are unassigned", () => {
    const unconfigured = { ...roles, x: "", y: "", accuracy: "" };
    const result = deriveGeocoding(wellFormed, unconfigured, values);
    expect(result.isGeocoded).toBe(false);
    expect(result.problem).toBeNull();
  });
});

describe("collectGeoValueIds", () => {
  it("gathers every configured role's value id", () => {
    expect(collectGeoValueIds([wellFormed], roles).sort()).toEqual(
      ["v-lat", "v-lon", "value-precise"].sort(),
    );
  });

  it("deduplicates across Locations, so a shared Concept is fetched once", () => {
    const ids = collectGeoValueIds([wellFormed, wellFormed], roles);
    expect(ids.filter((id) => id === "value-precise")).toHaveLength(1);
  });

  it("ignores roles that are not assigned", () => {
    expect(collectGeoValueIds([wellFormed], { ...roles, x: "" })).not.toContain("v-lon");
  });

  it("returns nothing for Locations with no geocoding props", () => {
    expect(collectGeoValueIds([location([])], roles)).toEqual([]);
  });
});
