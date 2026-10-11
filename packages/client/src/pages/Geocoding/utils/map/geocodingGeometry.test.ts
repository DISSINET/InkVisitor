import {
  GeoJsonGeometry,
  geometryAnchor,
  geometryBbox,
  geometryEquals,
  geometryVertexCount,
  isGeoJsonGeometry,
  normalizeGeometry,
  parseGeometry,
  pointGeometry,
  serializeGeometry,
} from "@inkvisitor/shared/types/geometry";
import { describe, expect, it } from "vitest";

/**
 * The geometry a Location carries: what is storable, what reads back as what
 * was written, and the single point that stands for a shape.
 */

const ring = [[0, 0], [10, 0], [10, 6], [0, 0]];

describe("isGeoJsonGeometry", () => {
  it.each<[string, unknown]>([
    ["Point", { type: "Point", coordinates: [12.5, 42.1] }],
    ["Point with altitude", { type: "Point", coordinates: [12.5, 42.1, 300] }],
    ["MultiPoint", { type: "MultiPoint", coordinates: [[1, 2], [3, 4]] }],
    ["LineString", { type: "LineString", coordinates: [[1, 2], [3, 4]] }],
    ["MultiLineString", { type: "MultiLineString", coordinates: [[[1, 2], [3, 4]]] }],
    ["Polygon with a hole", { type: "Polygon", coordinates: [ring, ring] }],
    ["MultiPolygon", { type: "MultiPolygon", coordinates: [[ring], [ring]] }],
  ])("accepts a %s", (_name, value) => {
    expect(isGeoJsonGeometry(value)).toBe(true);
  });

  it.each<[string, unknown]>([
    ["null", null],
    ["a string", "Point"],
    ["an unknown type", { type: "Circle", coordinates: [1, 2] }],
    ["a GeometryCollection", { type: "GeometryCollection", geometries: [] }],
    ["a Point with one number", { type: "Point", coordinates: [1] }],
    ["a Point with four numbers", { type: "Point", coordinates: [1, 2, 3, 4] }],
    ["NaN", { type: "Point", coordinates: [NaN, 1] }],
    ["Infinity", { type: "Point", coordinates: [Infinity, 1] }],
    ["longitude 180.1", { type: "Point", coordinates: [180.1, 0] }],
    ["latitude -90.1", { type: "Point", coordinates: [0, -90.1] }],
    ["a LineString of one position", { type: "LineString", coordinates: [[1, 2]] }],
    ["a ring of three positions", { type: "Polygon", coordinates: [[[0, 0], [1, 0], [0, 0]]] }],
    ["an open ring", { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1]]] }],
    ["a Polygon with no rings", { type: "Polygon", coordinates: [] }],
    ["an empty MultiPolygon", { type: "MultiPolygon", coordinates: [] }],
    ["a MultiPolygon holding a bad ring", { type: "MultiPolygon", coordinates: [[[[0, 0]]]] }],
    ["missing coordinates", { type: "Point" }],
  ])("refuses %s", (_name, value) => {
    expect(isGeoJsonGeometry(value)).toBe(false);
  });

  it("accepts the exact fragment the project uses as its example", () => {
    const fragment = JSON.parse(
      "{\"type\":\"Point\",\"coordinates\":[7.8815769,42.9408553]}",
    ) as unknown;
    expect(isGeoJsonGeometry(fragment)).toBe(true);
  });
});

describe("serializing and parsing", () => {
  it("round-trips every type unchanged", () => {
    const geometries: GeoJsonGeometry[] = [
      { type: "Point", coordinates: [1, 2] },
      { type: "MultiPoint", coordinates: [[1, 2], [3, 4]] },
      { type: "LineString", coordinates: [[1, 2], [3, 4]] },
      { type: "MultiLineString", coordinates: [[[1, 2], [3, 4]], [[5, 6], [7, 8]]] },
      { type: "Polygon", coordinates: [ring] as any },
      { type: "MultiPolygon", coordinates: [[ring], [ring]] as any },
    ];
    for (const geometry of geometries) {
      expect(parseGeometry(serializeGeometry(geometry))).toEqual(geometry);
    }
  });

  it("rounds to six decimals and drops an altitude", () => {
    const stored = serializeGeometry({
      type: "Point",
      coordinates: [7.881576912345, 42.940855312345, 300] as any,
    });
    expect(JSON.parse(stored)).toEqual({ type: "Point", coordinates: [7.881577, 42.940855] });
  });

  it("does not pad a short coordinate", () => {
    expect(JSON.parse(serializeGeometry(pointGeometry(17, 51.1)))).toEqual({
      type: "Point",
      coordinates: [17, 51.1],
    });
  });

  it.each([undefined, null, "", "   ", "not json", "{}", "[1,2]", "17.033"])(
    "reads %j as no geometry",
    (label) => {
      expect(parseGeometry(label as string | null | undefined)).toBeNull();
    },
  );

  it("does not mutate what it normalizes", () => {
    const input: GeoJsonGeometry = { type: "Point", coordinates: [1.23456789, 2.3456789] };
    normalizeGeometry(input);
    expect(input.coordinates).toEqual([1.23456789, 2.3456789]);
  });
});

describe("geometryAnchor", () => {
  it("is the point itself for a Point", () => {
    expect(geometryAnchor(pointGeometry(7.5, 42.25))).toEqual({ lon: 7.5, lat: 42.25 });
  });

  it("is the centre of the bounding box for anything else", () => {
    expect(geometryAnchor({ type: "LineString", coordinates: [[0, 0], [10, 20]] })).toEqual({
      lon: 5,
      lat: 10,
    });
    expect(geometryAnchor({ type: "Polygon", coordinates: [ring as any] })).toEqual({
      lon: 5,
      lat: 3,
    });
  });

  it("spans every part of a multi-geometry", () => {
    expect(
      geometryAnchor({ type: "MultiPoint", coordinates: [[-10, -10], [30, 50]] }),
    ).toEqual({ lon: 10, lat: 20 });
    expect(
      geometryAnchor({
        type: "MultiPolygon",
        coordinates: [[ring as any], [[[20, 20], [30, 20], [30, 30], [20, 20]]]],
      }),
    ).toEqual({ lon: 15, lat: 15 });
  });

  it("keeps the order — longitude first", () => {
    const { lon, lat } = geometryAnchor({ type: "Point", coordinates: [170, 10] });
    expect(lon).toBe(170);
    expect(lat).toBe(10);
  });
});

describe("geometryBbox, geometryEquals and geometryVertexCount", () => {
  it("measures a bounding box as west, south, east, north", () => {
    expect(geometryBbox({ type: "Polygon", coordinates: [ring as any] })).toEqual([0, 0, 10, 6]);
  });

  it("counts every position", () => {
    expect(geometryVertexCount({ type: "MultiPolygon", coordinates: [[ring as any], [ring as any]] })).toBe(8);
  });

  it("treats a difference below the stored precision as equal and a real one as different", () => {
    expect(geometryEquals(pointGeometry(1, 2), pointGeometry(1.00000001, 2))).toBe(true);
    expect(geometryEquals(pointGeometry(1, 2), pointGeometry(1.000001, 2))).toBe(false);
  });

  it("is never equal to nothing", () => {
    expect(geometryEquals(null, null)).toBe(false);
    expect(geometryEquals(pointGeometry(1, 2), undefined)).toBe(false);
  });

  it("tells a Point from a one-point MultiPoint", () => {
    expect(
      geometryEquals(pointGeometry(1, 2), { type: "MultiPoint", coordinates: [[1, 2]] }),
    ).toBe(false);
  });
});
