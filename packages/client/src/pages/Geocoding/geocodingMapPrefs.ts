import { BasemapGroup } from "./basemapLayers";

/**
 * What the map draws, remembered for whoever is at this browser.
 *
 * Kept out of the user record on purpose: it changes what is on the map and
 * nothing else, it is the kind of thing a researcher flips several times while
 * judging one place, and a write to the server for each flip would be a write
 * per glance. Nothing here is a statement about the data, so nothing here is
 * worth carrying between machines.
 */
export interface MapLayerPrefs {
  /** Every geocoded Location the list is showing, not just the one in hand. */
  others: boolean;
  suggestions: boolean;
  /** Names on the page's own marks, drawn always rather than on hover. */
  names: boolean;
  /**
   * The parts of the basemap the researcher lets it draw.
   *
   * Borders, place names, water and relief are not in here: they are what a
   * place is judged against, so they are always drawn and carry no switch.
   */
  basemap: Record<BasemapGroup, boolean>;
}

export const MAP_PREFS_KEY = "geocoding:mapLayers";

export const DEFAULT_MAP_PREFS: MapLayerPrefs = {
  // off by default: the list holds every Location the filters leave, which for a
  // whole territory is a thousand marks with no bearing on the one being judged.
  // Turning them on is a deliberate question about the surroundings
  others: false,
  suggestions: true,
  names: false,
  basemap: {
    // off by default. Sixty-one of the style's layers are roads, and a
    // motorway junction says nothing about where a place was in 1300 — the two
    // switches below start off for the same reason
    transportation: false,
    citiesAndPoi: false,
    // on by default: without it the map is white behind its lines, and woodland
    // against open ground is the one modern surface that still reads as terrain
    land: true,
  },
};

/**
 * Reads the stored preferences, falling back to the defaults per field.
 *
 * Field by field rather than all-or-nothing, so a stored value written before a
 * switch existed keeps the switches it does carry. Anything unreadable — a
 * browser with storage denied, a half-written value, a shape from an older
 * version — resolves to the default, because a map drawn wrong is a smaller
 * problem than a page that will not open.
 */
export const readMapPrefs = (raw: string | null): MapLayerPrefs => {
  if (!raw) {
    return DEFAULT_MAP_PREFS;
  }
  let stored: unknown;
  try {
    stored = JSON.parse(raw);
  } catch {
    return DEFAULT_MAP_PREFS;
  }
  if (!stored || typeof stored !== "object") {
    return DEFAULT_MAP_PREFS;
  }
  const source = stored as Partial<MapLayerPrefs>;
  const bool = (value: unknown, fallback: boolean) =>
    typeof value === "boolean" ? value : fallback;
  const storedBasemap = (source.basemap ?? {}) as Partial<Record<BasemapGroup, unknown>>;
  return {
    others: bool(source.others, DEFAULT_MAP_PREFS.others),
    suggestions: bool(source.suggestions, DEFAULT_MAP_PREFS.suggestions),
    names: bool(source.names, DEFAULT_MAP_PREFS.names),
    basemap: {
      transportation: bool(storedBasemap.transportation, DEFAULT_MAP_PREFS.basemap.transportation),
      citiesAndPoi: bool(storedBasemap.citiesAndPoi, DEFAULT_MAP_PREFS.basemap.citiesAndPoi),
      land: bool(storedBasemap.land, DEFAULT_MAP_PREFS.basemap.land),
    },
  };
};

export const loadMapPrefs = (): MapLayerPrefs => {
  try {
    return readMapPrefs(window.localStorage.getItem(MAP_PREFS_KEY));
  } catch {
    return DEFAULT_MAP_PREFS;
  }
};

export const saveMapPrefs = (prefs: MapLayerPrefs): void => {
  try {
    window.localStorage.setItem(MAP_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // storage denied or full. The map is already drawn the way it was asked
    // for; only remembering it across visits is lost
  }
};
