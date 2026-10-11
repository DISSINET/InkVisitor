import { describe, expect, it } from "vitest";
import {
  BOX_REFUSAL_MESSAGE,
  MIN_BOX_DEGREES,
  boxFromDrag,
  boxLabel,
  boxRefusal,
  sameBox,
} from "./regionBox";

/**
 * The hand-drawn region, and the shapes the engine will not accept as one.
 *
 * These would fail if the refusals were dropped: each names a drag an ordinary
 * pointer produces — a click that did not move, a drag across the antimeridian,
 * a drag off the top of a wrapped world — and asserts that it is refused here
 * rather than sent to be refused with a 422 nobody can act on.
 */

describe("boxFromDrag", () => {
  it("orders the corners, whichever way the drag went", () => {
    const northEast = boxFromDrag({ lat: 49, lon: 14 }, { lat: 52, lon: 18 });
    const southWest = boxFromDrag({ lat: 52, lon: 18 }, { lat: 49, lon: 14 });
    expect(northEast).toEqual([14, 49, 18, 52]);
    expect(southWest).toEqual(northEast);
  });

  it("puts longitude first, which is the order the engine reads", () => {
    expect(boxFromDrag({ lat: 50, lon: 10 }, { lat: 51, lon: 11 })[0]).toBe(10);
  });
});

describe("boxRefusal", () => {
  it("passes an ordinary rectangle", () => {
    expect(boxRefusal([14.5, 49.5, 18.5, 52])).toBeNull();
  });

  it("refuses a drag that did not move", () => {
    expect(boxRefusal([14, 50, 14, 50])).toBe("no-area");
  });

  it("refuses a box too small to hold anything, which a click that slipped makes", () => {
    const nudge = MIN_BOX_DEGREES / 2;
    expect(boxRefusal([14, 50, 14 + nudge, 50 + nudge])).toBe("no-area");
  });

  it("refuses a box with height and no width", () => {
    expect(boxRefusal([14, 49, 14, 52])).toBe("no-area");
  });

  /**
   * `boxFromDrag` orders the corners, so the seam-crossing drag never reaches
   * `boxRefusal` as an east-of-west box — it reaches it as a box running the
   * long way round the world. Without this the refusal is unreachable from the
   * only path that produces one, and the engine is asked about everywhere.
   */
  it("refuses the ordered form of a drag across the seam", () => {
    const dragged = boxFromDrag({ lat: 40, lon: 179 }, { lat: 50, lon: -179 });
    expect(dragged).toEqual([-179, 40, 179, 50]);
    expect(boxRefusal(dragged)).toBe("antimeridian");
  });

  it("passes a wide but ordinary region", () => {
    // Europe's own box is 70 degrees across, so the ceiling has to sit well
    // clear of the regions the engine itself names
    expect(boxRefusal([-25, 34, 45, 72])).toBeNull();
  });

  it("refuses a box crossing the antimeridian", () => {
    // the engine compares longitudes directly, so this box contains nothing at
    // all rather than the Pacific it looks like
    expect(boxRefusal([170, 40, -170, 50])).toBe("antimeridian");
  });

  it("refuses coordinates off the map, which a drag on a wrapped world reaches", () => {
    expect(boxRefusal([14, 49, 200, 52])).toBe("out-of-range");
    expect(boxRefusal([14, 49, 18, 95])).toBe("out-of-range");
  });

  it("refuses a box that is not numbers", () => {
    expect(boxRefusal([NaN, 49, 18, 52])).toBe("out-of-range");
  });

  it("has something to say about every refusal it can return", () => {
    for (const refusal of ["no-area", "antimeridian", "out-of-range"] as const) {
      expect(BOX_REFUSAL_MESSAGE[refusal]).toBeTruthy();
    }
  });
});

describe("sameBox", () => {
  it("reads two absent boxes as the same", () => {
    expect(sameBox(null, undefined)).toBe(true);
  });

  it("separates a box from no box", () => {
    expect(sameBox([1, 2, 3, 4], null)).toBe(false);
  });

  it("compares by area rather than by identity", () => {
    expect(sameBox([1, 2, 3, 4], [1, 2, 3, 4])).toBe(true);
    expect(sameBox([1, 2, 3, 4], [1, 2, 3, 5])).toBe(false);
  });
});

describe("boxLabel", () => {
  it("names the two corners latitude first, the way the rest of the page does", () => {
    expect(boxLabel([14.5, 49.5, 18.5, 52])).toBe("49.50, 14.50 → 52.00, 18.50");
  });
});
