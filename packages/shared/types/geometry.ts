/**
 * The GeoJSON geometry a geocoded Location carries.
 *
 * One geometry object per Location, stored as the label of a single Value
 * entity. Pure functions only, so the Geocoding page and the migration job read
 * and write exactly the same shape.
 */

/** `[longitude, latitude]` — GeoJSON's order, the reverse of how the Geocoding page says "lat, lon". */
export type GeoPosition = [number, number];

export interface GeoPoint {
  type: "Point";
  coordinates: GeoPosition;
}
export interface GeoMultiPoint {
  type: "MultiPoint";
  coordinates: GeoPosition[];
}
export interface GeoLineString {
  type: "LineString";
  coordinates: GeoPosition[];
}
export interface GeoMultiLineString {
  type: "MultiLineString";
  coordinates: GeoPosition[][];
}
export interface GeoPolygon {
  type: "Polygon";
  coordinates: GeoPosition[][];
}
export interface GeoMultiPolygon {
  type: "MultiPolygon";
  coordinates: GeoPosition[][][];
}

export type GeoJsonGeometry =
  | GeoPoint
  | GeoMultiPoint
  | GeoLineString
  | GeoMultiLineString
  | GeoPolygon
  | GeoMultiPolygon;

export type GeoJsonGeometryType = GeoJsonGeometry["type"];

export const GEOJSON_GEOMETRY_TYPES: GeoJsonGeometryType[] = [
  "Point",
  "MultiPoint",
  "LineString",
  "MultiLineString",
  "Polygon",
  "MultiPolygon",
];

/**
 * Six decimal places is about 0.1 m at the equator — finer than any source here
 * can justify, and far finer than a mouse click. A raw float from a map event
 * carries fifteen, which reads as a precision claim nobody made.
 */
export const GEOMETRY_DECIMALS = 6;

const roundCoordinate = (value: number): number =>
  Number(value.toFixed(GEOMETRY_DECIMALS));

const isPosition = (value: unknown): value is number[] =>
  Array.isArray(value) &&
  (value.length === 2 || value.length === 3) &&
  value.every((part) => typeof part === "number" && Number.isFinite(part)) &&
  Math.abs(value[0]) <= 180 &&
  Math.abs(value[1]) <= 90;

const isPositions = (value: unknown, min: number): value is number[][] =>
  Array.isArray(value) && value.length >= min && value.every(isPosition);

// a ring is closed and has four positions: three corners and the return
const isRing = (value: unknown): value is number[][] => {
  if (!isPositions(value, 4)) {
    return false;
  }
  const first = value[0];
  const last = value[value.length - 1];
  return first[0] === last[0] && first[1] === last[1];
};

const isListOf = <T>(value: unknown, min: number, test: (item: unknown) => item is T): boolean =>
  Array.isArray(value) && value.length >= min && value.every(test);

const isLine = (value: unknown): value is number[][] => isPositions(value, 2);
const isPolygon = (value: unknown): value is number[][][] => isListOf(value, 1, isRing);

/**
 * Whether a value is a geometry this page can store: one of the six types,
 * every position inside the earth's range, lines of two positions or more,
 * rings closed. A GeometryCollection and an empty multi-geometry are refused —
 * the first holds more than one geometry, and the second holds none.
 */
export const isGeoJsonGeometry = (value: unknown): value is GeoJsonGeometry => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const { type, coordinates } = value as { type?: unknown; coordinates?: unknown };
  switch (type) {
    case "Point":
      return isPosition(coordinates);
    case "MultiPoint":
      return isPositions(coordinates, 1);
    case "LineString":
      return isLine(coordinates);
    case "MultiLineString":
      return isListOf(coordinates, 1, isLine);
    case "Polygon":
      return isPolygon(coordinates);
    case "MultiPolygon":
      return isListOf(coordinates, 1, isPolygon);
    default:
      return false;
  }
};

export const pointGeometry = (lon: number, lat: number): GeoPoint => ({
  type: "Point",
  coordinates: [roundCoordinate(lon), roundCoordinate(lat)],
});

const roundPosition = (position: number[]): GeoPosition => [
  roundCoordinate(position[0]),
  roundCoordinate(position[1]),
];

/** The geometry with every position rounded to six decimals and reduced to two numbers. */
export const normalizeGeometry = (geometry: GeoJsonGeometry): GeoJsonGeometry => {
  switch (geometry.type) {
    case "Point":
      return { type: "Point", coordinates: roundPosition(geometry.coordinates) };
    case "MultiPoint":
    case "LineString":
      return { type: geometry.type, coordinates: geometry.coordinates.map(roundPosition) };
    case "MultiLineString":
    case "Polygon":
      return {
        type: geometry.type,
        coordinates: geometry.coordinates.map((line) => line.map(roundPosition)),
      };
    case "MultiPolygon":
      return {
        type: "MultiPolygon",
        coordinates: geometry.coordinates.map((polygon) =>
          polygon.map((ring) => ring.map(roundPosition)),
        ),
      };
  }
};

/** What is stored in the Value entity's label. */
export const serializeGeometry = (geometry: GeoJsonGeometry): string =>
  JSON.stringify(normalizeGeometry(geometry));

/**
 * Reads a stored label. A blank label, text that is not JSON and JSON that is
 * not a storable geometry all read as no geometry, never as a shape drawn
 * somewhere wrong.
 */
export const parseGeometry = (label: string | undefined | null): GeoJsonGeometry | null => {
  if (!label || !label.trim()) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(label);
    return isGeoJsonGeometry(parsed) ? normalizeGeometry(parsed) : null;
  } catch {
    return null;
  }
};

const allPositions = (geometry: GeoJsonGeometry): GeoPosition[] => {
  switch (geometry.type) {
    case "Point":
      return [geometry.coordinates];
    case "MultiPoint":
    case "LineString":
      return geometry.coordinates;
    case "MultiLineString":
    case "Polygon":
      return geometry.coordinates.flat();
    case "MultiPolygon":
      return geometry.coordinates.flat(2);
  }
};

/** `[minLon, minLat, maxLon, maxLat]`. */
export const geometryBbox = (
  geometry: GeoJsonGeometry,
): [number, number, number, number] => {
  const positions = allPositions(geometry);
  return [
    Math.min(...positions.map((at) => at[0])),
    Math.min(...positions.map((at) => at[1])),
    Math.max(...positions.map((at) => at[0])),
    Math.max(...positions.map((at) => at[1])),
  ];
};

/**
 * The single point standing for a geometry wherever one position is needed — a
 * list row, a marker, "show on map". A Point is its own anchor; any other shape
 * takes the centre of its bounding box, which is cheap and always lands inside
 * the extent the shape covers (not necessarily on the shape).
 */
export const geometryAnchor = (geometry: GeoJsonGeometry): { lon: number; lat: number } => {
  if (geometry.type === "Point") {
    return { lon: geometry.coordinates[0], lat: geometry.coordinates[1] };
  }
  const [minLon, minLat, maxLon, maxLat] = geometryBbox(geometry);
  return {
    lon: roundCoordinate((minLon + maxLon) / 2),
    lat: roundCoordinate((minLat + maxLat) / 2),
  };
};

/** Same shape at the stored precision. */
export const geometryEquals = (
  a: GeoJsonGeometry | null | undefined,
  b: GeoJsonGeometry | null | undefined,
): boolean => !!a && !!b && serializeGeometry(a) === serializeGeometry(b);

/** The number of positions, for a one-line description of a shape. */
export const geometryVertexCount = (geometry: GeoJsonGeometry): number =>
  allPositions(geometry).length;
