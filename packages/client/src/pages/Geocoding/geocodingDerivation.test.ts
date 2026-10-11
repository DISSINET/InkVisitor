import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IProp } from "@inkvisitor/shared/types";
import { GeocodingAccuracy, IGeocodingRoles } from "@inkvisitor/shared/types/geocoding";
import { CProp } from "constructors";
import { describe, expect, it } from "vitest";
import { collectGeoValueIds, deriveGeocoding } from "./geocodingDerivation";

/**
 * Covers invariant I1: a Location is geocoded only when geo:geometry and
 * geo:accuracy are both present AND the geometry value resolves to an existing
 * entity whose label is one valid GeoJSON geometry.
 *
 * The cases that matter are the ones where props exist and the answer is still
 * "not geocoded" — a test that only proved a well-formed Location reads as
 * geocoded would pass against a function that never checked anything.
 */

const roles: IGeocodingRoles = {
  geometry: "concept-geometry",
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

const point = (lon: number, lat: number) => JSON.stringify({ type: "Point", coordinates: [lon, lat] });

const wellFormed = location([
  prop("concept-geometry", "v-geo"),
  prop("concept-accuracy", "value-precise"),
]);

const values = {
  "v-geo": entity("v-geo", point(17.033, 51.107)),
};

describe("deriveGeocoding", () => {
  it("reads a well-formed Location", () => {
    const result = deriveGeocoding(wellFormed, roles, values);
    expect(result.isGeocoded).toBe(true);
    expect(result.geometry).toEqual({ type: "Point", coordinates: [17.033, 51.107] });
    expect(result.lon).toBe(17.033);
    expect(result.lat).toBe(51.107);
    expect(result.accuracy).toBe(GeocodingAccuracy.Precise);
    expect(result.problem).toBeNull();
  });

  it("does not confuse the axes — GeoJSON is [longitude, latitude]", () => {
    // the failure this guards would put the whole corpus in the Gulf of Guinea
    // while every individual number still looked plausible
    const result = deriveGeocoding(wellFormed, roles, values);
    expect(result.lon).toBe(17.033);
    expect(result.lat).toBe(51.107);
  });

  it("anchors a polygon at the centre of its bounding box", () => {
    const polygon = JSON.stringify({
      type: "Polygon",
      coordinates: [[[10, 40], [20, 40], [20, 50], [10, 40]]],
    });
    const result = deriveGeocoding(wellFormed, roles, { "v-geo": entity("v-geo", polygon) });
    expect(result.isGeocoded).toBe(true);
    expect(result.geometry?.type).toBe("Polygon");
    expect(result.lon).toBe(15);
    expect(result.lat).toBe(45);
  });

  it("reads every one of the six geometry types", () => {
    const labels = [
      { type: "Point", coordinates: [1, 2] },
      { type: "MultiPoint", coordinates: [[1, 2], [3, 4]] },
      { type: "LineString", coordinates: [[1, 2], [3, 4]] },
      { type: "MultiLineString", coordinates: [[[1, 2], [3, 4]]] },
      { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
      { type: "MultiPolygon", coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 0]]]] },
    ];
    for (const label of labels) {
      const result = deriveGeocoding(wellFormed, roles, {
        "v-geo": entity("v-geo", JSON.stringify(label)),
      });
      expect(result.isGeocoded, label.type).toBe(true);
      expect(result.geometry?.type).toBe(label.type);
    }
  });

  it("is not geocoded when the value entity no longer exists", () => {
    const result = deriveGeocoding(wellFormed, roles, {});
    expect(result.isGeocoded).toBe(false);
    expect(result.problem).toContain("geometry");
  });

  it.each([
    ["a blank label", "   "],
    ["text that is not JSON", "somewhere near the river"],
    ["the legacy bare number", "17.033"],
    ["a GeometryCollection", JSON.stringify({ type: "GeometryCollection", geometries: [] })],
    ["a Feature rather than a geometry", JSON.stringify({ type: "Feature", geometry: null })],
    ["a latitude outside the earth's range", point(17, 151.1)],
    ["a longitude outside the earth's range", point(181, 51)],
    ["a line of one position", JSON.stringify({ type: "LineString", coordinates: [[1, 2]] })],
    [
      "a ring that does not close",
      JSON.stringify({ type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1]]] }),
    ],
    ["an empty MultiPoint", JSON.stringify({ type: "MultiPoint", coordinates: [] })],
    ["a position of strings", JSON.stringify({ type: "Point", coordinates: ["1", "2"] })],
  ])("is not geocoded for %s", (_name, label) => {
    const result = deriveGeocoding(wellFormed, roles, { "v-geo": entity("v-geo", label) });
    expect(result.isGeocoded).toBe(false);
    expect(result.geometry).toBeNull();
    expect(result.problem).toContain("cannot be read");
  });

  it("accepts a legitimate zero and a negative coordinate", () => {
    const result = deriveGeocoding(wellFormed, roles, {
      "v-geo": entity("v-geo", point(0, -33.9)),
    });
    expect(result.isGeocoded).toBe(true);
    expect(result.lon).toBe(0);
    expect(result.lat).toBe(-33.9);
  });

  it("is not geocoded when accuracy is missing, even with a geometry", () => {
    const result = deriveGeocoding(location([prop("concept-geometry", "v-geo")]), roles, values);
    expect(result.isGeocoded).toBe(false);
    expect(result.problem).toContain("accuracy");
  });

  it("is not geocoded when accuracy points at an unconfigured Concept", () => {
    const result = deriveGeocoding(
      location([
        prop("concept-geometry", "v-geo"),
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

  it("reads place type independently of whether the geometry is usable", () => {
    const result = deriveGeocoding(
      location([prop("concept-type", "value-settlement")]),
      roles,
      {},
    );
    expect(result.placeType).toBe("settlement");
    expect(result.isGeocoded).toBe(false);
  });

  it("reads nothing and reports nothing when the roles are unassigned", () => {
    const unconfigured = { ...roles, geometry: "", accuracy: "" };
    const result = deriveGeocoding(wellFormed, unconfigured, values);
    expect(result.isGeocoded).toBe(false);
    expect(result.problem).toBeNull();
  });

  it("ignores props that still use the retired longitude and latitude Concepts", () => {
    const legacy = location([
      prop("old-x", "v-lon"),
      prop("old-y", "v-lat"),
      prop("concept-accuracy", "value-precise"),
    ]);
    const result = deriveGeocoding(legacy, roles, {});
    expect(result.isGeocoded).toBe(false);
    expect(result.problem).toContain("geometry");
  });
});

describe("collectGeoValueIds", () => {
  it("gathers every configured role's value id", () => {
    expect(collectGeoValueIds([wellFormed], roles).sort()).toEqual(
      ["v-geo", "value-precise"].sort(),
    );
  });

  it("deduplicates across Locations, so a shared Concept is fetched once", () => {
    const ids = collectGeoValueIds([wellFormed, wellFormed], roles);
    expect(ids.filter((id) => id === "value-precise")).toHaveLength(1);
  });

  it("ignores roles that are not assigned", () => {
    expect(collectGeoValueIds([wellFormed], { ...roles, geometry: "" })).not.toContain("v-geo");
  });

  it("returns nothing for Locations with no geocoding props", () => {
    expect(collectGeoValueIds([location([])], roles)).toEqual([]);
  });
});
