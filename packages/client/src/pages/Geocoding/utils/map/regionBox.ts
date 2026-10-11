import { GeocodingBbox } from "@inkvisitor/shared/types/geocoding";

/**
 * The hand-drawn region box, and what the engine will accept as one.
 *
 * The rules are the engine's own 422s restated on this side, because a box is
 * produced by a drag and a drag produces the refused shapes readily: releasing
 * without moving gives a box of no area, and a map that wraps lets one drag
 * from one side of the antimeridian to the other. Caught here, a bad drag is
 * simply not a region; sent, it is an error message about a rectangle nobody
 * can see any more.
 */

/**
 * The smallest box worth calling an area, in degrees.
 *
 * The engine refuses only exactly zero width or height. This is stricter on
 * purpose: a box a thousandth of a degree across is a click that moved, and
 * accepting it would set a region containing nothing and then blame the
 * gazetteers for finding nothing in it.
 */
export const MIN_BOX_DEGREES = 0.01;

/**
 * The widest a drawn region may be, in degrees of longitude.
 *
 * Half the globe, and it is the antimeridian check in disguise. `boxFromDrag`
 * orders the corners, so a drag from one side of the seam to the other does not
 * arrive as a box running east-to-west — it arrives as one running the long way
 * round the world, which passes every other test and asks the engine about
 * everywhere. No region anybody draws by hand is wider than this; the widest
 * the engine names is about 77°.
 */
export const MAX_BOX_WIDTH_DEGREES = 180;

export type BoxRefusal = "no-area" | "antimeridian" | "out-of-range";

/** Why the engine would refuse this box, or null where it would not. */
export const boxRefusal = (box: GeocodingBbox): BoxRefusal | null => {
  const [minLon, minLat, maxLon, maxLat] = box;
  if (![minLon, minLat, maxLon, maxLat].every((value) => Number.isFinite(value))) {
    return "out-of-range";
  }
  if (minLon < -180 || maxLon > 180 || minLat < -90 || maxLat > 90) {
    return "out-of-range";
  }
  // the engine compares longitudes directly, so a box whose west edge is east
  // of its east edge reports every coordinate on earth as outside it. The
  // ordered form of that same drag is a box spanning most of the world, which
  // the engine would accept and answer uselessly
  if (minLon > maxLon || maxLon - minLon > MAX_BOX_WIDTH_DEGREES) {
    return "antimeridian";
  }
  if (maxLon - minLon < MIN_BOX_DEGREES || maxLat - minLat < MIN_BOX_DEGREES) {
    return "no-area";
  }
  return null;
};

export const BOX_REFUSAL_MESSAGE: Record<BoxRefusal, string> = {
  "no-area": "that box has no area — drag across the area you mean",
  antimeridian: "a box cannot cross the antimeridian — draw it on one side",
  "out-of-range": "that box falls off the map",
};

/**
 * A box from the two corners of a drag, in either order.
 *
 * The drag says which two points; which of them is the north-west corner is
 * arithmetic, and asking the researcher to drag in one particular direction
 * would be a rule with nothing behind it.
 */
export const boxFromDrag = (
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
): GeocodingBbox => [
  Math.min(from.lon, to.lon),
  Math.min(from.lat, to.lat),
  Math.max(from.lon, to.lon),
  Math.max(from.lat, to.lat),
];

/** The box as one short line, for a control that has to name what it holds. */
export const boxLabel = (box: GeocodingBbox): string =>
  `${box[1].toFixed(2)}, ${box[0].toFixed(2)} → ${box[3].toFixed(2)}, ${box[2].toFixed(2)}`;

/**
 * Whether two boxes describe the same area.
 *
 * No box and no box are the same claim however each is spelled: the field is
 * absent on a context that never had one and null on one whose box was cleared,
 * and reading those two apart would report a region change that never happened.
 */
export const sameBox = (a: GeocodingBbox | null | undefined, b: GeocodingBbox | null | undefined) => {
  if (!a || !b) {
    return !a && !b;
  }
  return a.every((value, index) => value === b[index]);
};
