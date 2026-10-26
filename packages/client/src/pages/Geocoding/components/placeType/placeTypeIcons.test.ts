import { GEOCODING_PLACE_TYPES, defaultPlaceTypes } from "@inkvisitor/shared/types/geocoding";
import { describe, expect, it } from "vitest";
import {
  PLACE_ICONS,
  PLACE_ICON_KEYS,
  UNKNOWN_PLACE_TYPE,
  kindInfo,
  placeIcon,
  placeTypeInfo,
} from "./placeTypeIcons";

/**
 * Most of the corpus states no kind of place, so the mark for "nobody has said"
 * is the one seen most often. An absent icon there would read as a rendering
 * fault rather than as the fact it is.
 */

describe("placeTypeInfo", () => {
  it("gives every kind in the vocabulary its own mark and words", () => {
    const seen = new Set<string>();
    for (const placeType of GEOCODING_PLACE_TYPES) {
      const info = placeTypeInfo(placeType);
      expect(info).not.toBe(UNKNOWN_PLACE_TYPE);
      expect(info.description.length).toBeGreaterThan(10);
      seen.add(info.label);
    }
    // twelve distinct labels: a repeated one would make two kinds indistinguishable
    expect(seen.size).toBe(GEOCODING_PLACE_TYPES.length);
  });

  it("falls back to the unknown mark for a Location that states nothing", () => {
    expect(placeTypeInfo(null)).toBe(UNKNOWN_PLACE_TYPE);
    expect(placeTypeInfo(undefined)).toBe(UNKNOWN_PLACE_TYPE);
    expect(placeTypeInfo("")).toBe(UNKNOWN_PLACE_TYPE);
  });

  it("falls back to the unknown mark for a kind the engine added since", () => {
    // the vocabulary is the engine's and grows; a wrong mark is read as a fact
    expect(placeTypeInfo("volcano")).toBe(UNKNOWN_PLACE_TYPE);
  });

  it("gives the unknown mark words of its own rather than an empty label", () => {
    expect(UNKNOWN_PLACE_TYPE.label).toBeTruthy();
    expect(UNKNOWN_PLACE_TYPE.description).toBeTruthy();
  });
});

describe("the icon set a project chooses from", () => {
  it("holds enough distinct marks to give every kind its own", () => {
    expect(PLACE_ICON_KEYS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(Object.values(PLACE_ICONS)).size).toBe(PLACE_ICON_KEYS.length);
  });

  it("resolves the icon of every default kind, so the starting list shows no unknown marks", () => {
    for (const kind of defaultPlaceTypes()) {
      expect(PLACE_ICON_KEYS).toContain(kind.icon);
      expect(kindInfo(kind).icon).not.toBe(UNKNOWN_PLACE_TYPE.icon);
    }
  });

  it("falls back to the unknown mark for a key the set does not have", () => {
    expect(placeIcon("not-an-icon")).toBe(UNKNOWN_PLACE_TYPE.icon);
    expect(placeIcon(undefined)).toBe(UNKNOWN_PLACE_TYPE.icon);
  });
});

describe("kindInfo", () => {
  it("names a project's kind by what the project called it, not by its id", () => {
    const kind = { ...defaultPlaceTypes()[0], id: "catholic-church", name: "catholic church" };
    expect(kindInfo(kind).label).toBe("catholic church");
  });

  it("reads no kind as the unknown mark", () => {
    expect(kindInfo(undefined)).toBe(UNKNOWN_PLACE_TYPE);
    expect(kindInfo(null)).toBe(UNKNOWN_PLACE_TYPE);
  });
});
