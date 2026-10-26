import type { GeoJSONStoreFeatures } from "terra-draw";
import { describe, expect, it } from "vitest";
import { shapesOf } from "./useGeometryDraw";

/**
 * The only code that reads the drawing library's store. The fixtures follow the
 * shapes the library itself puts in a snapshot: a finished feature carries the
 * mode that drew it, and every guide is a Point carrying the same mode.
 */

const feature = (
  geometry: { type: string; coordinates: unknown },
  properties: Record<string, unknown>,
): GeoJSONStoreFeatures => ({ type: "Feature", geometry, properties }) as GeoJSONStoreFeatures;

const polygonRing = [[0, 0], [4, 0], [4, 4], [0, 0]];

describe("shapesOf", () => {
  it("keeps a finished point, line and polygon", () => {
    const shapes = shapesOf([
      feature({ type: "Point", coordinates: [1, 2] }, { mode: "point" }),
      feature({ type: "LineString", coordinates: [[0, 0], [1, 1]] }, { mode: "linestring" }),
      feature({ type: "Polygon", coordinates: [polygonRing] }, { mode: "polygon" }),
    ]);
    expect(shapes.map((shape) => shape.mode)).toEqual(["point", "linestring", "polygon"]);
  });

  it("drops the closing point of a polygon that is being drawn", () => {
    // a Point with the polygon mode and no currentlyDrawing flag: only its
    // geometry type says it is a guide
    const shapes = shapesOf([
      feature({ type: "Polygon", coordinates: [polygonRing] }, { mode: "polygon" }),
      feature({ type: "Point", coordinates: [0, 0] }, { mode: "polygon", closingPoint: true }),
      feature({ type: "Point", coordinates: [1, 1] }, { mode: "polygon" }),
    ]);
    expect(shapes).toHaveLength(1);
    expect(shapes[0].mode).toBe("polygon");
  });

  it("drops a line's closing point and a snapping or coordinate guide", () => {
    expect(
      shapesOf([
        feature({ type: "Point", coordinates: [0, 0] }, { mode: "linestring", closingPoint: true }),
        feature({ type: "Point", coordinates: [0, 0] }, { mode: "linestring", snappingPoint: true }),
        feature({ type: "Point", coordinates: [0, 0] }, { mode: "polygon", coordinatePoint: true }),
      ]),
    ).toEqual([]);
  });

  it("drops a shape still being drawn", () => {
    expect(
      shapesOf([
        feature(
          { type: "LineString", coordinates: [[0, 0], [1, 1]] },
          { mode: "linestring", currentlyDrawing: true },
        ),
      ]),
    ).toEqual([]);
  });

  it("drops the handles a selection puts on a shape", () => {
    expect(
      shapesOf([
        feature({ type: "Point", coordinates: [0, 0] }, { mode: "select", selectionPoint: true }),
        feature({ type: "Point", coordinates: [0, 0] }, { mode: "select", midPoint: true }),
      ]),
    ).toEqual([]);
  });

  it("drops a feature whose mode is not one of the three", () => {
    expect(shapesOf([feature({ type: "Point", coordinates: [1, 2] }, { mode: "marker" })])).toEqual([]);
    expect(shapesOf([feature({ type: "Point", coordinates: [1, 2] }, {})])).toEqual([]);
  });
});
