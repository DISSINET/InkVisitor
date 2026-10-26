import {
  GeoJsonGeometry,
  GeoPosition,
  isGeoJsonGeometry,
  normalizeGeometry,
} from "@inkvisitor/shared/types/geometry";

/**
 * Turning what a researcher drew into the one geometry a Location carries, and
 * a stored geometry back into something that can be edited.
 *
 * The drawing library holds one feature per shape and knows nothing of
 * "multi"; a Location holds exactly one GeoJSON geometry, so several shapes of
 * the same kind become one Multi geometry and shapes of different kinds are
 * refused — GeoJSON has no geometry that holds a point and a polygon together
 * short of a collection, which this page does not store.
 */

/** The three kinds of shape the drawing tool makes. */
export type DrawKind = "point" | "linestring" | "polygon";

/** A drawn shape, reduced to what this module needs of the library's feature. */
export interface DrawnShape {
  mode: DrawKind;
  coordinates: unknown;
}

export type DraftResult = { geometry: GeoJsonGeometry } | { error: string };

const KIND_LABEL: Record<DrawKind, string> = {
  point: "points",
  linestring: "lines",
  polygon: "polygons",
};

/**
 * One geometry from every shape drawn so far, or the reason there is none.
 *
 * Validated against the same rule a stored geometry is read with, so nothing
 * can be written that the page would then refuse to read back.
 */
export const draftToGeometry = (shapes: DrawnShape[]): DraftResult => {
  if (!shapes.length) {
    return { error: "Draw a point, a line or a polygon first." };
  }
  const kinds = new Set(shapes.map((shape) => shape.mode));
  if (kinds.size > 1) {
    return {
      error: `A location has one geometry: ${[...kinds]
        .map((kind) => KIND_LABEL[kind])
        .join(" and ")} cannot be saved together. Remove one kind.`,
    };
  }
  const kind = shapes[0].mode;
  const many = shapes.length > 1;
  let candidate: unknown;
  if (kind === "point") {
    candidate = many
      ? { type: "MultiPoint", coordinates: shapes.map((shape) => shape.coordinates) }
      : { type: "Point", coordinates: shapes[0].coordinates };
  } else if (kind === "linestring") {
    candidate = many
      ? { type: "MultiLineString", coordinates: shapes.map((shape) => shape.coordinates) }
      : { type: "LineString", coordinates: shapes[0].coordinates };
  } else {
    candidate = many
      ? { type: "MultiPolygon", coordinates: shapes.map((shape) => shape.coordinates) }
      : { type: "Polygon", coordinates: shapes[0].coordinates };
  }
  if (!isGeoJsonGeometry(candidate)) {
    return {
      error: "That shape is not complete — a line needs two points and a polygon three corners.",
    };
  }
  return { geometry: normalizeGeometry(candidate) };
};

/**
 * The shapes a stored geometry is made of, one per part, for loading into the
 * drawing tool to be edited.
 */
export const geometryToShapes = (geometry: GeoJsonGeometry): DrawnShape[] => {
  switch (geometry.type) {
    case "Point":
      return [{ mode: "point", coordinates: geometry.coordinates }];
    case "MultiPoint":
      return geometry.coordinates.map((at: GeoPosition) => ({ mode: "point", coordinates: at }));
    case "LineString":
      return [{ mode: "linestring", coordinates: geometry.coordinates }];
    case "MultiLineString":
      return geometry.coordinates.map((line) => ({ mode: "linestring", coordinates: line }));
    case "Polygon":
      return [{ mode: "polygon", coordinates: geometry.coordinates }];
    case "MultiPolygon":
      return geometry.coordinates.map((polygon) => ({ mode: "polygon", coordinates: polygon }));
  }
};

/** The kind of shape a geometry is made of. */
export const kindOfGeometry = (geometry: GeoJsonGeometry): DrawKind =>
  geometry.type === "Point" || geometry.type === "MultiPoint"
    ? "point"
    : geometry.type === "LineString" || geometry.type === "MultiLineString"
      ? "linestring"
      : "polygon";
