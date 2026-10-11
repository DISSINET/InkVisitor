import { describe, expect, it } from "vitest";
import {
  FIT_MAX_ZOOM,
  FOCUS_MIN_ZOOM,
  MapFocus,
  moveFor,
  nextFocus,
  popupAnchorFor,
} from "./mapFocus";

/**
 * The control that shows a suggestion on the map has to work twice on the same
 * suggestion — a researcher comparing two places moves between them, and coming
 * back is the ordinary case rather than the odd one.
 */

describe("nextFocus", () => {
  it("carries the point asked for", () => {
    expect(nextFocus(null, 51.1079, 17.0384)).toMatchObject({ lat: 51.1079, lon: 17.0384 });
  });

  it("is a new asking every time, for the same point", () => {
    const first = nextFocus(null, 51.1079, 17.0384);
    const second = nextFocus(first, 51.1079, 17.0384);
    expect(second.at).not.toBe(first.at);
  });

  it("cannot collide however fast the control is pressed", () => {
    // two clicks inside one millisecond give Date.now() twice over, and the
    // second would move nothing
    let focus: MapFocus | null = null;
    const seen = new Set<number>();
    for (let i = 0; i < 500; i += 1) {
      focus = nextFocus(focus, 1, 2);
      seen.add(focus.at);
    }
    expect(seen.size).toBe(500);
  });

  it("keeps counting across different points", () => {
    const first = nextFocus(null, 1, 2);
    const second = nextFocus(first, 3, 4);
    const third = nextFocus(second, 1, 2);
    expect(new Set([first.at, second.at, third.at]).size).toBe(3);
  });

  it("starts from nothing without a previous asking", () => {
    expect(nextFocus(null, 1, 2).at).toBe(1);
  });
});

/**
 * Showing a suggestion answers "where is that", which is a question about its
 * surroundings rather than about its coordinate.
 */
describe("moveFor", () => {
  const wroclaw = { lat: 51.1079, lon: 17.0384 };
  const lisbon: [number, number] = [38.7223, -9.1393];

  it("fits the suggestion and the coordinate the Location already has", () => {
    const move = moveFor(wroclaw, lisbon, 6);
    expect("fit" in move && move.fit).toEqual([[51.1079, 17.0384], lisbon]);
  });

  it("stops short of street level when the two are close together", () => {
    // two suggestions a hundred metres apart claim no precision worth zooming to
    const move = moveFor(wroclaw, [51.108, 17.0385], 6);
    expect("fit" in move && move.maxZoom).toBe(FIT_MAX_ZOOM);
  });

  it("leaves room around a fitted pair, so neither sits against an edge", () => {
    const move = moveFor(wroclaw, lisbon, 6);
    expect("fit" in move && move.padding.every((side) => side > 0)).toBe(true);
  });

  it("centres on the suggestion where the Location has no coordinate to compare", () => {
    const move = moveFor(wroclaw, null, 6);
    expect("center" in move && move.center).toEqual([51.1079, 17.0384]);
  });

  it("moves closer but never further out, so a chosen zoom survives", () => {
    // a researcher zoomed in to read a coastline has said what they want to see
    const far = moveFor(wroclaw, null, 6);
    expect("center" in far && far.zoom).toBe(FOCUS_MIN_ZOOM);
    const close = moveFor(wroclaw, null, 16);
    expect("center" in close && close.zoom).toBe(16);
  });
});

/**
 * A popup that opens upward from a control inside a scrolling list has to be
 * placed against the viewport, not the list. Placed inside it, the accuracy menu
 * lost 37 of its 50 pixels above the container and showed only its worst option.
 */
describe("popupAnchorFor", () => {
  it("opens upward from the control that opened it", () => {
    expect(popupAnchorFor({ left: 120, top: 800 }, 1000)).toEqual({ left: 120, bottom: 200 });
  });

  it("leaves room above a control near the bottom of the window", () => {
    const anchor = popupAnchorFor({ left: 0, top: 980 }, 1000);
    expect(anchor.bottom).toBe(20);
  });

  it("gives a control at the top of the window the whole height above nothing", () => {
    // the menu opens upward, so a control at the top has nowhere to go and the
    // arithmetic must say so rather than placing it off screen
    expect(popupAnchorFor({ left: 0, top: 0 }, 1000).bottom).toBe(1000);
  });

  it("keeps the control's own left edge, so the two line up", () => {
    expect(popupAnchorFor({ left: 437, top: 100 }, 1000).left).toBe(437);
  });
});
