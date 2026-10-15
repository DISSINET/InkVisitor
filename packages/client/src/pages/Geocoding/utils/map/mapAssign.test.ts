import { GeocodingAccuracy } from "@inkvisitor/shared/types/geocoding";
import { describe, expect, it } from "vitest";
import { MANUAL_MENU_LIFT, MapPending, afterAccuracy, menuAnchorFor } from "./mapAssign";

/**
 * Setting a coordinate by hand asks where, then what. Whether the second
 * question is asked at all is a preference, and getting that branch wrong is
 * either a step nobody can dismiss or a kind of place recorded without anyone
 * choosing it.
 */

const picked: MapPending = { lat: 51.1, lon: 17.03, x: 120, y: 240 };

describe("afterAccuracy", () => {
  it("asks the kind of place when the preference is unset", () => {
    const step = afterAccuracy(picked, GeocodingAccuracy.Precise, undefined);
    expect("ask" in step).toBe(true);
  });

  it("asks the kind of place when the preference is on", () => {
    expect("ask" in afterAccuracy(picked, GeocodingAccuracy.Precise, true)).toBe(true);
  });

  it("writes straight through when the project records no kind of place", () => {
    const step = afterAccuracy(picked, GeocodingAccuracy.Region, false);
    expect(step).toEqual({ write: { accuracy: GeocodingAccuracy.Region } });
  });

  it("names no kind of place on that write, so the Location keeps the one it has", () => {
    // undefined and null differ here: undefined keeps, null clears, and a map
    // click is a correction to where a place is rather than to what it is
    const step = afterAccuracy(picked, GeocodingAccuracy.Region, false);
    expect("write" in step && "placeType" in step.write).toBe(false);
  });

  /**
   * A corpus that is all of one kind has an answer that never changes, and
   * naming it once is the difference between recording it on every write and
   * recording it nowhere.
   */
  it("writes the kind named for the whole corpus, without asking", () => {
    const step = afterAccuracy(picked, GeocodingAccuracy.Region, false, "settlement");
    expect(step).toEqual({
      write: { accuracy: GeocodingAccuracy.Region, placeType: "settlement" },
    });
  });

  it("still names no kind where none was chosen for the corpus", () => {
    for (const none of [undefined, null] as const) {
      const step = afterAccuracy(picked, GeocodingAccuracy.Region, false, none);
      expect("write" in step && "placeType" in step.write).toBe(false);
    }
  });

  /**
   * The blanket kind is only ever read while the question is off. With it on,
   * every write already carries an answer chosen for that Location, and writing
   * the blanket one over it would replace a judgement with a default.
   */
  it("ignores the blanket kind while the question is still asked", () => {
    const step = afterAccuracy(picked, GeocodingAccuracy.Precise, true, "settlement");
    expect("ask" in step).toBe(true);
  });

  it("carries the coordinate and the menu's position into the second question", () => {
    const step = afterAccuracy(picked, GeocodingAccuracy.Approximate, true);
    expect("ask" in step && step.ask).toEqual({
      ...picked,
      accuracy: GeocodingAccuracy.Approximate,
    });
  });
});

describe("menuAnchorFor", () => {
  it("places the menu above the fields, in the container's coordinates", () => {
    const anchor = menuAnchorFor({ left: 500, top: 900 }, { left: 350, top: 40 });
    expect(anchor).toEqual({ x: 150, y: 900 - 40 - MANUAL_MENU_LIFT });
  });

  it("falls back to the viewport when the container cannot be measured", () => {
    expect(menuAnchorFor({ left: 500, top: 900 }, undefined)).toEqual({
      x: 500,
      y: 900 - MANUAL_MENU_LIFT,
    });
  });
});
