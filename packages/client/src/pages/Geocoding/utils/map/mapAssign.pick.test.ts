import { GeoJsonGeometry } from "@inkvisitor/shared/types/geometry";
import { describe, expect, it } from "vitest";
import { MapPending, mayStartPick, pendingNote } from "./mapAssign";

const at = (over: Partial<MapPending> = {}): MapPending => ({ lat: 48.31, lon: 14.9212, x: 0, y: 0, ...over });

describe("mayStartPick", () => {
  it("never starts on a mark, whatever else is true", () => {
    expect(mayStartPick(true, true, true)).toBe(false);
    expect(mayStartPick(true, false, true)).toBe(false);
  });

  it("starts on empty map when a Location is selected, as it always did", () => {
    expect(mayStartPick(false, true, false)).toBe(true);
  });

  it("starts with nothing selected only where a new Location may be made", () => {
    expect(mayStartPick(false, false, true)).toBe(true);
    expect(mayStartPick(false, false, false)).toBe(false);
  });
});

describe("pendingNote", () => {
  it("names the coordinate of a click", () => {
    expect(pendingNote(at(), false)).toBe("48.31000, 14.92120");
  });

  it("names the kind of a drawn shape and where it sits", () => {
    const polygon: GeoJsonGeometry = {
      type: "Polygon",
      coordinates: [[[14, 48], [15, 48], [15, 49], [14, 48]]],
    };
    expect(pendingNote(at({ geometry: polygon }), false)).toBe("Polygon near 48.31000, 14.92120");
  });

  it("names a drawn point by its coordinate, not as a shape", () => {
    const point: GeoJsonGeometry = { type: "Point", coordinates: [14.9212, 48.31] };
    expect(pendingNote(at({ geometry: point }), false)).toBe("48.31000, 14.92120");
  });

  it("names a suggestion by its number and label", () => {
    expect(pendingNote(at({ suggestion: { index: 2, label: "Garsten" } }), false)).toBe("3. Garsten");
  });

  it("says a new Location is being made when nothing is selected", () => {
    expect(pendingNote(at(), true)).toBe("new location · 48.31000, 14.92120");
  });
});
