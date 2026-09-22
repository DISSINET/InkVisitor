import { describe, expect, it } from "vitest";
import theme from "Theme/theme";
import {
  FOCUS_MARK,
  LYR,
  MARK_LAYERS,
  SRC,
  addGeocodingLayers,
  focusPulse,
  setGeocodingMapData,
} from "./geocodingMapLayers";
import { FOCUS_MARK_MS } from "./mapFocus";
import { SUGGESTION_MARK } from "./suggestionRank";

/**
 * A map that records what was added to it, in order, and nothing else.
 *
 * The renderer is not involved: everything asserted here is a claim about the
 * order and the shape of what this page hands it.
 */
const recordingMap = () => {
  const layers: string[] = [];
  const sources: string[] = [];
  const data: Record<string, unknown> = {};
  const map = {
    getSource: (id: string) =>
      sources.includes(id) ? { setData: (value: unknown) => (data[id] = value) } : undefined,
    addSource: (id: string) => sources.push(id),
    getLayer: (id: string) => (layers.includes(id) ? {} : undefined),
    addLayer: (layer: { id: string }) => layers.push(layer.id),
  };
  return { map, layers, sources, data };
};

const anyMap = (map: unknown) => map as Parameters<typeof addGeocodingLayers>[0];

describe("the ring that answers a request to show a point", () => {
  /**
   * The ring points at a mark rather than replacing it, so every mark has to be
   * drawn over it. Layer order is add order, which is why this is a property of
   * where the call sits rather than of anything the layer itself says.
   */
  it("is drawn under every mark on the page", () => {
    const { map, layers } = recordingMap();
    addGeocodingLayers(anyMap(map), theme);
    // stated before the ordering, which a layer that was never added would
    // otherwise satisfy: a missing layer indexes at -1, which is under anything
    expect(layers).toContain(LYR.focusHalo);
    expect(layers).toContain(LYR.focusRing);
    for (const mark of MARK_LAYERS) {
      expect(layers.indexOf(LYR.focusHalo), mark).toBeLessThan(layers.indexOf(mark));
      expect(layers.indexOf(LYR.focusRing), mark).toBeLessThan(layers.indexOf(mark));
    }
  });

  /** Never a target for a click or a hover: it draws an answer, it is not one. */
  it("is not one of the layers a point on the map is resolved against", () => {
    expect(MARK_LAYERS).not.toContain(LYR.focusHalo);
    expect(MARK_LAYERS).not.toContain(LYR.focusRing);
  });

  it("holds the one point asked for, and nothing when the asking has run out", () => {
    const { map, data } = recordingMap();
    addGeocodingLayers(anyMap(map), theme);
    const rest = {
      others: [],
      suggestions: [],
      leader: null,
      selected: { position: null, name: "" },
      pending: null,
      regionBox: null,
    };
    setGeocodingMapData(anyMap(map), { ...rest, focus: [50.1645, 10.0074] });
    expect(data[SRC.focus]).toMatchObject({
      // the renderer orders a coordinate the other way round from this page
      features: [{ geometry: { coordinates: [10.0074, 50.1645] } }],
    });
    setGeocodingMapData(anyMap(map), { ...rest, focus: null });
    expect((data[SRC.focus] as { features: unknown[] }).features).toEqual([]);
  });
});

describe("the breath the ring is drawn with", () => {
  const life = FOCUS_MARK_MS;
  const everyFrame = Array.from({ length: life / 16 }, (_, i) => focusPulse(i * 16, life));

  /**
   * The point of the ring is that a mark inside it stays readable. Breathing
   * inward far enough to touch what it encloses would make the two one mark.
   */
  it("never breathes in far enough to touch the mark it encloses", () => {
    const markEdge = SUGGESTION_MARK.radius + SUGGESTION_MARK.weight / 2;
    for (const frame of everyFrame) {
      expect(frame.radius - (FOCUS_MARK.weight + FOCUS_MARK.backing) / 2).toBeGreaterThan(markEdge);
    }
  });

  it("moves, and comes back to where it started once a breath", () => {
    expect(focusPulse(FOCUS_MARK.period / 4, life).radius).toBeGreaterThan(
      focusPulse(0, life).radius + 1,
    );
    expect(focusPulse((FOCUS_MARK.period * 3) / 4, life).radius).toBeLessThan(
      focusPulse(0, life).radius - 1,
    );
    expect(focusPulse(FOCUS_MARK.period, life).radius).toBeCloseTo(focusPulse(0, life).radius, 6);
  });

  /**
   * The ring's own removal is a timer set for the end of its life, so a fade
   * that had not finished by then would be a mark that blinked out mid-fade.
   */
  it("is solid for most of its life and exactly gone at the end of it", () => {
    expect(focusPulse(0, life).opacity).toBe(1);
    expect(focusPulse(life - FOCUS_MARK.fade, life).opacity).toBe(1);
    expect(focusPulse(life - FOCUS_MARK.fade / 2, life).opacity).toBeCloseTo(0.5, 6);
    expect(focusPulse(life, life).opacity).toBe(0);
  });

  /** A frame that arrives late, after the page has taken the ring down. */
  it("asks for nothing visible past the end of its life", () => {
    expect(focusPulse(life * 2, life).opacity).toBe(0);
  });
});
