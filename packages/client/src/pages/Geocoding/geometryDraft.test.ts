import { GeoJsonGeometry } from "@inkvisitor/shared/types/geometry";
import { describe, expect, it } from "vitest";
import { DrawnShape, draftToGeometry, geometryToShapes, kindOfGeometry } from "./geometryDraft";

/**
 * Several shapes of one kind become one Multi geometry; a mix is refused rather
 * than saved as something the page would not read back.
 */

const square = [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]];
const triangle = [[10, 10], [14, 10], [12, 14], [10, 10]];

const point = (at: number[]): DrawnShape => ({ mode: "point", coordinates: at });
const line = (...at: number[][]): DrawnShape => ({ mode: "linestring", coordinates: at });
const polygon = (...rings: number[][][]): DrawnShape => ({ mode: "polygon", coordinates: rings });

describe("draftToGeometry", () => {
  it("makes a Point from one point", () => {
    expect(draftToGeometry([point([1, 2])])).toEqual({
      geometry: { type: "Point", coordinates: [1, 2] },
    });
  });

  it("makes a MultiPoint from several points", () => {
    expect(draftToGeometry([point([1, 2]), point([3, 4])])).toEqual({
      geometry: { type: "MultiPoint", coordinates: [[1, 2], [3, 4]] },
    });
  });

  it("makes a LineString from one line and a MultiLineString from several", () => {
    expect(draftToGeometry([line([0, 0], [1, 1])])).toEqual({
      geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] },
    });
    expect(draftToGeometry([line([0, 0], [1, 1]), line([2, 2], [3, 3])])).toEqual({
      geometry: { type: "MultiLineString", coordinates: [[[0, 0], [1, 1]], [[2, 2], [3, 3]]] },
    });
  });

  it("makes a Polygon from one polygon and a MultiPolygon from several", () => {
    expect(draftToGeometry([polygon(square)])).toEqual({
      geometry: { type: "Polygon", coordinates: [square] },
    });
    expect(draftToGeometry([polygon(square), polygon(triangle)])).toEqual({
      geometry: { type: "MultiPolygon", coordinates: [[square], [triangle]] },
    });
  });

  it("refuses nothing drawn", () => {
    expect(draftToGeometry([])).toHaveProperty("error");
  });

  it("refuses a mix of kinds and names them", () => {
    const result = draftToGeometry([point([1, 2]), polygon(square)]);
    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toContain("points");
    expect((result as { error: string }).error).toContain("polygons");
  });

  it("refuses a shape that is not complete", () => {
    expect(draftToGeometry([line([0, 0])])).toHaveProperty("error");
    expect(draftToGeometry([polygon([[0, 0], [1, 0], [0, 0]])])).toHaveProperty("error");
  });

  it("refuses a position outside the earth, which a drag past the map edge can make", () => {
    expect(draftToGeometry([point([190, 0])])).toHaveProperty("error");
    expect(draftToGeometry([point([0, 95])])).toHaveProperty("error");
  });

  it("rounds the drawn precision down to what is stored", () => {
    expect(draftToGeometry([point([1.123456789012, 2.987654321098])])).toEqual({
      geometry: { type: "Point", coordinates: [1.123457, 2.987654] },
    });
  });
});

describe("geometryToShapes", () => {
  it.each<[GeoJsonGeometry]>([
    [{ type: "Point", coordinates: [1, 2] }],
    [{ type: "MultiPoint", coordinates: [[1, 2], [3, 4]] }],
    [{ type: "LineString", coordinates: [[0, 0], [1, 1]] }],
    [{ type: "MultiLineString", coordinates: [[[0, 0], [1, 1]], [[2, 2], [3, 3]]] }],
    [{ type: "Polygon", coordinates: [square as any] }],
    [{ type: "MultiPolygon", coordinates: [[square as any], [triangle as any]] }],
  ])("loads a %s and builds the same geometry back", (geometry) => {
    const shapes = geometryToShapes(geometry);
    expect(draftToGeometry(shapes)).toEqual({ geometry });
  });

  it("splits a multi-geometry into one shape per part", () => {
    expect(geometryToShapes({ type: "MultiPoint", coordinates: [[1, 2], [3, 4], [5, 6]] })).toHaveLength(3);
  });

  it("reports the kind of shape", () => {
    expect(kindOfGeometry({ type: "MultiLineString", coordinates: [[[0, 0], [1, 1]]] })).toBe("linestring");
    expect(kindOfGeometry({ type: "Point", coordinates: [0, 0] })).toBe("point");
  });
});
