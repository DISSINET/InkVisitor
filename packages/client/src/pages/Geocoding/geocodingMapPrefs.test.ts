import { describe, expect, it } from "vitest";
import { DEFAULT_MAP_PREFS, readMapPrefs } from "./geocodingMapPrefs";

describe("readMapPrefs", () => {
  it("falls back to the defaults where nothing is stored", () => {
    expect(readMapPrefs(null)).toEqual(DEFAULT_MAP_PREFS);
  });

  it("falls back to the defaults rather than throwing on unreadable storage", () => {
    expect(readMapPrefs("{not json")).toEqual(DEFAULT_MAP_PREFS);
    expect(readMapPrefs("null")).toEqual(DEFAULT_MAP_PREFS);
    expect(readMapPrefs('"a string"')).toEqual(DEFAULT_MAP_PREFS);
    expect(readMapPrefs("[]")).toEqual(DEFAULT_MAP_PREFS);
  });

  it("keeps a stored value that differs from the default", () => {
    const stored = JSON.stringify({
      ...DEFAULT_MAP_PREFS,
      others: true,
      basemap: { transportation: true, citiesAndPoi: true, land: false },
    });
    const prefs = readMapPrefs(stored);
    expect(prefs.others).toBe(true);
    expect(prefs.basemap.transportation).toBe(true);
    expect(prefs.basemap.land).toBe(false);
  });

  /**
   * The reason this reads field by field rather than trusting the parsed object.
   * A value written before a switch existed carries none of that switch's state,
   * and taking the object whole would leave the new switch `undefined` — which
   * reads as off, silently turning something off nobody turned off.
   */
  it("fills in a switch the stored value predates, keeping the ones it carries", () => {
    const older = JSON.stringify({ others: true, suggestions: false, names: true });
    const prefs = readMapPrefs(older);
    expect(prefs.others).toBe(true);
    expect(prefs.suggestions).toBe(false);
    expect(prefs.names).toBe(true);
    expect(prefs.basemap).toEqual(DEFAULT_MAP_PREFS.basemap);
  });

  it("fills in one missing basemap group without discarding its siblings", () => {
    const partial = JSON.stringify({
      ...DEFAULT_MAP_PREFS,
      basemap: { transportation: true, land: false },
    });
    const prefs = readMapPrefs(partial);
    expect(prefs.basemap.transportation).toBe(true);
    expect(prefs.basemap.land).toBe(false);
    expect(prefs.basemap.citiesAndPoi).toBe(DEFAULT_MAP_PREFS.basemap.citiesAndPoi);
  });

  /**
   * A shape written by the previous scheme, which had `borders` and a `labels`
   * object. Those are now always drawn and carry no switch, so the stored value
   * has nothing to say about the switches that exist — and must not leave them
   * unset.
   */
  it("ignores a stored shape from the previous scheme rather than half-applying it", () => {
    const old = JSON.stringify({
      others: true,
      borders: false,
      labels: { regions: false, settlements: false, detail: true },
    });
    const prefs = readMapPrefs(old);
    expect(prefs.others).toBe(true);
    expect(prefs.basemap).toEqual(DEFAULT_MAP_PREFS.basemap);
  });

  it("ignores a value of the wrong type rather than drawing from it", () => {
    const wrong = JSON.stringify({ names: 1, basemap: { land: "yes", transportation: null } });
    const prefs = readMapPrefs(wrong);
    expect(prefs.names).toBe(DEFAULT_MAP_PREFS.names);
    expect(prefs.basemap.land).toBe(DEFAULT_MAP_PREFS.basemap.land);
    expect(prefs.basemap.transportation).toBe(DEFAULT_MAP_PREFS.basemap.transportation);
  });

  it("starts with a quiet basemap: no transport, no built-up detail, land kept", () => {
    expect(DEFAULT_MAP_PREFS.basemap.transportation).toBe(false);
    expect(DEFAULT_MAP_PREFS.basemap.citiesAndPoi).toBe(false);
    expect(DEFAULT_MAP_PREFS.basemap.land).toBe(true);
  });
});
