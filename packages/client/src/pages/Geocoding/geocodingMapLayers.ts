import * as maplibregl from "maplibre-gl";
import { ThemeType } from "Theme/theme";
import { GeocodingLocation } from "./useGeocodingLocations";
import { Suggestion } from "./engineTypes";
import { OFF_REGION_FILL, SUGGESTION_MARK, scoreShare, scoreStep } from "./suggestionRank";

/**
 * The sources and layers this page adds on top of the basemap, and the GeoJSON
 * that feeds them.
 *
 * Separated from the component because everything here is a pure translation
 * from the page's data to what the renderer draws, and because the click
 * handler needs the layer ids without reaching into the component.
 */

export const SRC = {
  regionBox: "geocoding-region-box",
  others: "geocoding-others",
  suggestions: "geocoding-suggestions",
  pending: "geocoding-pending",
  selected: "geocoding-selected",
  focus: "geocoding-focus",
} as const;

export const LYR = {
  regionBoxFill: "geocoding-region-box-fill",
  regionBoxLine: "geocoding-region-box-line",
  others: "geocoding-others-circle",
  othersName: "geocoding-others-name",
  suggestions: "geocoding-suggestions-circle",
  suggestionRank: "geocoding-suggestions-rank",
  suggestionName: "geocoding-suggestions-name",
  pendingRing: "geocoding-pending-ring",
  pendingDot: "geocoding-pending-dot",
  selected: "geocoding-selected-circle",
  selectedName: "geocoding-selected-name",
  focusHalo: "geocoding-focus-halo",
  focusRing: "geocoding-focus-ring",
} as const;

/**
 * Every layer that carries a mark, considered together wherever a point on the
 * map has to be resolved to whatever it draws — never to the pixel under it,
 * which is what `pickMark` and `hoverInfoAtPoint` both query against.
 */
export const MARK_LAYERS: string[] = [
  LYR.suggestions,
  LYR.selected,
  LYR.others,
  LYR.pendingRing,
  LYR.pendingDot,
];

/**
 * The layers that draw a name, in the same order as the marks they name.
 *
 * Asked at a point to find out whether the name a hover would show is already
 * on the map there: a label the reader can see does not need repeating in a
 * popup over the mark it belongs to.
 */
export const NAME_LAYERS: string[] = [LYR.suggestionName, LYR.selectedName, LYR.othersName];

/** MapLibre wants [lon, lat]; everything else on this page says lat first. */
export type Position = [number, number];

/** MapLibre orders a coordinate the other way round from the rest of this page. */
export const lngLat = (position: Position): Position => [position[1], position[0]];

/**
 * A viewport that frames every one of a set of points, in this page's own
 * lat-first order.
 *
 * Shared by the two effects that fit rather than centre — the strongest
 * suggestions of a finished run, and a point asked for alongside the
 * Location's own coordinate — so both build the same kind of bounds from the
 * same kind of list.
 */
export const boundsOf = (points: Position[]): maplibregl.LngLatBounds => {
  const bounds = new maplibregl.LngLatBounds();
  for (const at of points) {
    bounds.extend(lngLat(at));
  }
  return bounds;
};

/**
 * `id` is what a feature state attaches to — the renderer keys them by it and
 * silently ignores a state set against a feature that has none.
 */
const point = (
  lat: number,
  lon: number,
  properties: Record<string, unknown>,
  id?: number,
) => ({
  type: "Feature" as const,
  id,
  geometry: { type: "Point" as const, coordinates: [lon, lat] },
  properties,
});

const collection = (features: ReturnType<typeof point>[]) => ({
  type: "FeatureCollection" as const,
  features,
});

export const othersData = (locations: GeocodingLocation[]) =>
  collection(
    locations
      .filter((location) => location.lat !== null && location.lon !== null)
      .map((location) =>
        point(location.lat as number, location.lon as number, {
          // carried so a click on the mark can say which Location it drew: the
          // renderer hands back the feature's properties and nothing else
          id: location.entity.id,
          name: location.entity.labels[0] ?? "",
        }),
      ),
  );

export const suggestionsData = (suggestions: Suggestion[], leader: number | null = null) => {
  // the ramp is measured against this run's own best answer, which is the only
  // comparison the engine's score supports — so it is taken once here rather
  // than per mark
  const top = Math.max(0, ...suggestions.map((one) => one.score));
  return collection(
    suggestions.map((suggestion, index) =>
      point(
        suggestion.lat,
        suggestion.lon,
        {
          index,
          // the rank is what the number is for, so it is drawn as the reader
          // counts rather than as the array indexes
          rank: String(index + 1),
          name: `${index + 1}. ${suggestion.label}${suggestion.offRegion ? " · off-region" : ""}`,
          offRegion: suggestion.offRegion ? 1 : 0,
          // the ramp step its card is drawn from, so one suggestion is one
          // colour whichever of its two drawings is being looked at
          step: scoreStep(scoreShare(suggestion.score, top)),
          lead: index === leader ? 1 : 0,
        },
        // its place in the run, which is what the page points at when the same
        // suggestion is under the pointer in the list
        index,
      ),
    ),
  );
};

/** How much wider a hovered mark's ring is drawn, in pixels. */
const HOVER_RING_GROWTH = 2;

/**
 * The ring that answers a "show this on the map", in pixels.
 *
 * The radius is the middle of its breath. At its narrowest it still encloses a
 * suggestion mark and that mark's own ring with daylight around them, so the
 * two never read as one thicker mark.
 */
export const FOCUS_MARK = {
  radius: 24,
  weight: 2,
  backing: 3,
  /** How far either side of the radius the ring breathes. */
  swing: 4,
  /** One breath, in milliseconds. */
  period: 1600,
  /** How long it takes to go, at the end of its life. */
  fade: 700,
};

/** The backing is drawn under ink rather than beside it, so it never competes. */
const FOCUS_BACKING_OPACITY = 0.9;

/**
 * How the ring is drawn at a given age.
 *
 * A ring that is merely present is read once and then stops being seen; one
 * that moves keeps saying "here" while a reader's eye is somewhere else on the
 * map. It breathes rather than pinging outward and vanishing, because there is
 * no instant in its life when the answer to "which one did I ask about" should
 * be off the screen.
 *
 * Read from a clock rather than counted in frames: a throttled tab drops
 * frames, and a pulse driven by a frame count would slow down instead, so the
 * ring would still be breathing after the page had stopped showing it.
 */
export const focusPulse = (elapsed: number, life: number) => ({
  radius:
    FOCUS_MARK.radius + FOCUS_MARK.swing * Math.sin((2 * Math.PI * elapsed) / FOCUS_MARK.period),
  // full until the fade begins, and exactly nothing at the end of its life, so
  // the ring leaves rather than being taken away between two frames
  opacity: Math.max(0, Math.min(1, (life - elapsed) / FOCUS_MARK.fade)),
});

export const pointData = (position: Position | null, properties: Record<string, unknown> = {}) =>
  collection(position ? [point(position[0], position[1], properties)] : []);

/**
 * The one font stack both basemap styles serve from their glyph endpoint.
 *
 * A `text-font` the endpoint does not have draws no text at all, silently, so
 * this is the face the styles' own labels use rather than a preference.
 */
const LABEL_FONT = ["Noto Sans Regular"];

/**
 * Adds this page's own sources and layers on top of whichever style just
 * loaded.
 *
 * Guarded rather than unconditional: this runs again for every style load,
 * including the double invocation React's strict mode gives every effect, and
 * a source or layer id that already exists is an exception rather than a
 * no-op — thrown halfway through, it would leave the map carrying some of
 * what this page draws and none of the rest.
 */
export const addGeocodingLayers = (map: maplibregl.Map, theme: ThemeType): void => {
  // read out here rather than inside the expression: the renderer wants plain
  // values and the theme's own array is typed as a tuple of unknown width
  const ramp = theme.color["scoreScale"] as string[];
  for (const id of Object.values(SRC)) {
    if (!map.getSource(id)) {
      map.addSource(id, { type: "geojson", data: pointData(null) });
    }
  }
  const addLayer = (layer: maplibregl.AddLayerObject) => {
    if (!map.getLayer(layer.id)) {
      map.addLayer(layer);
    }
  };

  // The region the query is asking about, under everything: it is the ground the
  // marks are being judged against, and drawn over them it would tint the
  // answers it is there to frame.
  addLayer({
    id: LYR.regionBoxFill,
    type: "fill",
    source: SRC.regionBox,
    paint: {
      "fill-color": theme.color["primary"] as string,
      "fill-opacity": 0.06,
    },
  });
  addLayer({
    id: LYR.regionBoxLine,
    type: "line",
    source: SRC.regionBox,
    paint: {
      "line-color": theme.color["primary"] as string,
      "line-width": 1.5,
      // dashed, because the box is a claim about where to look rather than a
      // boundary anybody drew on the ground
      "line-dasharray": [3, 2],
    },
  });

  // Added before every mark so the ring sits under them: it points at what is
  // already drawn there, and drawn over the top it would hide it.
  addLayer({
    id: LYR.focusHalo,
    type: "circle",
    source: SRC.focus,
    paint: {
      "circle-radius": FOCUS_MARK.radius,
      "circle-opacity": 0,
      // the ground colour, laid under the ring and showing as a fringe either
      // side of it, so the ring reads on a dark forest and on a pale sea alike.
      // The basemap under a coordinate is not known here, and both themes put
      // land in the middle of their range
      "circle-stroke-width": FOCUS_MARK.weight + FOCUS_MARK.backing,
      "circle-stroke-color": theme.color["white"] as string,
      "circle-stroke-opacity": FOCUS_BACKING_OPACITY,
    },
  });
  addLayer({
    id: LYR.focusRing,
    type: "circle",
    source: SRC.focus,
    paint: {
      "circle-radius": FOCUS_MARK.radius,
      "circle-opacity": 0,
      "circle-stroke-width": FOCUS_MARK.weight,
      // ink rather than one of the meaning-carrying colours: this ring answers
      // "which one did I ask for", and gold, blue and green are all already
      // spoken for by claims about the suggestion itself
      "circle-stroke-color": theme.color["black"] as string,
    },
  });
  addLayer({
    id: LYR.others,
    type: "circle",
    source: SRC.others,
    paint: {
      "circle-radius": 3,
      "circle-color": theme.color["greyer"] as string,
      "circle-opacity": 0.5,
      "circle-stroke-width": 1,
      "circle-stroke-color": theme.color["greyer"] as string,
    },
  });
  addLayer({
    id: LYR.selected,
    type: "circle",
    source: SRC.selected,
    paint: {
      "circle-radius": 9,
      "circle-color": theme.color["success"] as string,
      "circle-opacity": 0.35,
      "circle-stroke-width": 3,
      "circle-stroke-color": theme.color["success"] as string,
    },
  });
  addLayer({
    id: LYR.pendingRing,
    type: "circle",
    source: SRC.pending,
    paint: {
      "circle-radius": 11,
      "circle-opacity": 0,
      "circle-stroke-width": 2,
      "circle-stroke-color": theme.color["primary"] as string,
    },
  });
  addLayer({
    id: LYR.pendingDot,
    type: "circle",
    source: SRC.pending,
    paint: {
      "circle-radius": 2,
      "circle-color": theme.color["primary"] as string,
      "circle-stroke-width": 2,
      "circle-stroke-color": theme.color["primary"] as string,
    },
  });
  addLayer({
    id: LYR.suggestions,
    type: "circle",
    source: SRC.suggestions,
    paint: {
      "circle-radius": SUGGESTION_MARK.radius,
      "circle-color": theme.color["black"] as string,
      "circle-opacity": [
        "case",
        ["==", ["get", "offRegion"], 1],
        OFF_REGION_FILL,
        SUGGESTION_MARK.fillOpacity,
      ],
      // the ring carries everything a mark says beyond where it is: its score,
      // whether it is the clear winner, and whether the pointer is on it. The
      // fill is spoken for by off-region and the middle by the rank, so the ring
      // is the channel left — and three claims that are never made at once fit
      // in one, read in the order a reader would want them
      "circle-stroke-width": [
        "case",
        ["boolean", ["feature-state", "hovered"], false],
        SUGGESTION_MARK.weight + HOVER_RING_GROWTH,
        SUGGESTION_MARK.weight,
      ],
      "circle-stroke-color": [
        "case",
        ["boolean", ["feature-state", "hovered"], false],
        theme.color["success"] as string,
        ["==", ["get", "lead"], 1],
        theme.color["warning"] as string,
        [
          "match",
          ["get", "step"],
          0,
          ramp[0],
          1,
          ramp[1],
          2,
          ramp[2],
          3,
          ramp[3],
          ramp[4],
        ],
      ],
    },
  });
  addLayer({
    id: LYR.suggestionRank,
    type: "symbol",
    source: SRC.suggestions,
    layout: {
      "text-field": ["get", "rank"],
      "text-font": LABEL_FONT,
      "text-size": 11,
      // Better-ranked numbers win a collision, because the rank is what the
      // number is for: dropping "1" so that "17" can be read would invert the
      // thing being said. Symbols are placed in ascending sort key, and the
      // first one placed is the one that keeps its space.
      "symbol-sort-key": ["get", "index"],
    },
    paint: {
      // the number follows the fill it sits on. An off-region mark is drawn
      // nearly empty, so a white number on it is a white number on the
      // basemap — the same pairing the suggestion list's rank badge uses
      "text-color": [
        "case",
        ["==", ["get", "offRegion"], 1],
        theme.color["black"] as string,
        theme.color["white"] as string,
      ],
    },
  });
  addLayer({
    id: LYR.othersName,
    type: "symbol",
    source: SRC.others,
    layout: {
      "text-field": ["get", "name"],
      "text-font": LABEL_FONT,
      "text-size": 11,
      "text-offset": [0, -0.9],
      "text-anchor": "bottom",
    },
    paint: {
      "text-color": theme.color["black"] as string,
      "text-halo-color": theme.color["white"] as string,
      "text-halo-width": 1.2,
    },
  });
  addLayer({
    id: LYR.suggestionName,
    type: "symbol",
    source: SRC.suggestions,
    layout: {
      "text-field": ["get", "name"],
      "text-font": LABEL_FONT,
      "text-size": 11,
      "text-offset": [0, -1.4],
      "text-anchor": "bottom",
      "symbol-sort-key": ["get", "index"],
    },
    paint: {
      "text-color": theme.color["black"] as string,
      "text-halo-color": theme.color["white"] as string,
      "text-halo-width": 1.2,
    },
  });
  addLayer({
    id: LYR.selectedName,
    type: "symbol",
    source: SRC.selected,
    layout: {
      "text-field": ["get", "name"],
      "text-font": LABEL_FONT,
      "text-size": 11,
      "text-offset": [0, -1.3],
      "text-anchor": "bottom",
    },
    paint: {
      "text-color": theme.color["black"] as string,
      "text-halo-color": theme.color["white"] as string,
      "text-halo-width": 1.2,
    },
  });
};

/**
 * A bbox as the one rectangle that draws it.
 *
 * Five corners rather than four: a GeoJSON ring closes by repeating its first
 * point, and a ring that does not close draws as a line with a gap in it.
 */
export const boxData = (box: [number, number, number, number] | null) => ({
  type: "FeatureCollection" as const,
  features: box
    ? [
        {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "Polygon" as const,
            coordinates: [
              [
                [box[0], box[1]],
                [box[2], box[1]],
                [box[2], box[3]],
                [box[0], box[3]],
                [box[0], box[1]],
              ],
            ],
          },
        },
      ]
    : [],
});

/** What the map draws, translated into the sources this page owns. */
export interface GeocodingMapData {
  others: GeocodingLocation[];
  suggestions: Suggestion[];
  /**
   * The one suggestion the engine separated from the rest, if it separated one.
   *
   * Its mark is rung in gold, the same claim the card's own edge makes. Null
   * where the leader is merely the best of a crowd, which is the state gold is
   * withheld to make visible.
   */
  leader: number | null;
  selected: { position: Position | null; name: string; id?: string };
  pending: Position | null;
  /**
   * The point last asked for by name, ringed until the asking is replaced or
   * the page stops showing it.
   */
  focus: Position | null;
  /**
   * The area the query is asking about, where one was drawn rather than named.
   *
   * A named region has a box too and is not drawn: the engine resolves it
   * server-side and its rectangle is a crude model of a place the researcher
   * chose by name, so drawing it would put a shape on the map that nobody drew
   * and that disagrees with the name above it.
   */
  regionBox: [number, number, number, number] | null;
}

/**
 * Sets the page's own marks as data on sources that already exist, so a
 * change of selection or of suggestions never touches the layers themselves.
 */
export const setGeocodingMapData = (map: maplibregl.Map, data: GeocodingMapData): void => {
  const set = (
    id: string,
    source: ReturnType<typeof pointData> | ReturnType<typeof boxData>,
  ) =>
    (map.getSource(id) as maplibregl.GeoJSONSource | undefined)?.setData(
      source as Parameters<maplibregl.GeoJSONSource["setData"]>[0],
    );
  set(SRC.others, othersData(data.others));
  set(SRC.suggestions, suggestionsData(data.suggestions, data.leader));
  set(
    SRC.selected,
    pointData(data.selected.position, { name: data.selected.name, id: data.selected.id ?? "" }),
  );
  set(SRC.pending, pointData(data.pending));
  set(SRC.focus, pointData(data.focus));
  set(SRC.regionBox, boxData(data.regionBox));
};

/**
 * Draws the focus ring at one moment of its breath.
 *
 * A paint property rather than the source data: the point does not move, only
 * how it is drawn, and handing the renderer a fresh collection sixty times a
 * second to say the same coordinate would be work for nothing.
 *
 * Silent where the layers are not there and where the renderer refuses. A theme
 * change swaps the whole style, and a paint property set while that is in
 * flight throws rather than waiting; the frame after it lands draws on the new
 * style, so a dropped frame costs nothing.
 */
export const setFocusPulse = (
  map: maplibregl.Map,
  radius: number,
  opacity: number,
): void => {
  try {
    if (!map.getLayer(LYR.focusHalo) || !map.getLayer(LYR.focusRing)) {
      return;
    }
    map.setPaintProperty(LYR.focusHalo, "circle-radius", radius);
    map.setPaintProperty(LYR.focusRing, "circle-radius", radius);
    map.setPaintProperty(
      LYR.focusHalo,
      "circle-stroke-opacity",
      opacity * FOCUS_BACKING_OPACITY,
    );
    map.setPaintProperty(LYR.focusRing, "circle-stroke-opacity", opacity);
  } catch {
    // a style is being swapped in; the next frame draws on the one that arrives
  }
};

/**
 * Rings the suggestion the reader is pointing at, wherever they are pointing
 * at it from.
 *
 * A feature state rather than a property, because a property lives in the
 * source data and changing one means handing the renderer the whole collection
 * again on every pointer move. The previous mark is cleared by index rather
 * than by asking the renderer what it currently holds, which it will not say.
 *
 * Silent where the source is not on the map, and where the renderer refuses:
 * a theme change swaps the whole style, and a feature state asked for while
 * that is in flight throws rather than waiting. Nothing is lost by dropping it
 * — the ring is re-applied for the style that arrives, and a pointer that has
 * moved on by then was never pointing at this mark.
 */
export const setHoveredSuggestion = (
  map: maplibregl.Map,
  index: number | null,
  previous: number | null,
): void => {
  if (!map.getSource(SRC.suggestions)) {
    return;
  }
  try {
    if (previous !== null && previous !== index) {
      map.setFeatureState({ source: SRC.suggestions, id: previous }, { hovered: false });
    }
    if (index !== null) {
      map.setFeatureState({ source: SRC.suggestions, id: index }, { hovered: true });
    }
  } catch {
    // the style is mid-swap; the ring arrives with the one that lands
  }
};

export type MarkHit =
  | { kind: "suggestion"; index: number }
  | { kind: "other"; id: string }
  /** A mark was hit, but not one that leads anywhere on its own — the pending point itself. */
  | { kind: "mark" }
  | { kind: "none" };

/**
 * Which of this page's own marks, if any, sits under a point.
 *
 * The renderer fires its map-level click for every click including those that
 * land on a mark, and a layer handler cannot suppress it — so the precedence
 * between "chose a suggestion", "chose another Location" and "clicked open
 * ground" has to be decided from one query rather than delegated to per-layer
 * handlers.
 */
export const pickMark = (map: maplibregl.Map, at: maplibregl.PointLike): MarkHit => {
  const drawn = MARK_LAYERS.filter((id) => map.getLayer(id));
  const hits = map.queryRenderedFeatures(at, { layers: drawn });
  const suggestion = hits.find(
    (hit: maplibregl.MapGeoJSONFeature) => hit.layer.id === LYR.suggestions,
  );
  if (suggestion) {
    return { kind: "suggestion", index: Number(suggestion.properties?.index) };
  }
  const other = hits.find((hit: maplibregl.MapGeoJSONFeature) => hit.layer.id === LYR.others);
  if (other?.properties?.id) {
    return { kind: "other", id: String(other.properties.id) };
  }
  return hits.length ? { kind: "mark" } : { kind: "none" };
};

/** Whether a point sits on a mark, and what a hover over it should show. */
export interface MarkHoverInfo {
  hasMark: boolean;
  popupName: string | null;
  /**
   * The suggestion under the point, by its place in the run.
   *
   * A suggestion is the one mark this page can say more about than its name —
   * the whole card belongs to it — so it is reported separately from the name
   * every other mark gets.
   */
  suggestionIndex: number | null;
  /**
   * The Location under the point, by entity id.
   *
   * Reported alongside the name rather than instead of it: a Location the page
   * holds can be shown as itself — its tag, its kind of place, its accuracy —
   * where a mark that is only a coordinate has nothing but a name to show.
   */
  locationId: string | null;
}

/**
 * The name of whatever is under a point, unless the map has already painted
 * it there.
 *
 * Asked of the renderer rather than assumed from the names switch, because
 * the switch says a layer is drawn and collision decides whether this
 * particular label survived.
 */
export const hoverInfoAtPoint = (map: maplibregl.Map, at: maplibregl.PointLike): MarkHoverInfo => {
  const drawn = MARK_LAYERS.filter((id) => map.getLayer(id));
  const hits = map.queryRenderedFeatures(at, { layers: drawn });
  const hit = hits[0];
  const suggestionIndex =
    hit?.layer.id === LYR.suggestions && hit.properties?.index !== undefined
      ? Number(hit.properties.index)
      : null;
  // searched across the hits rather than taken from the topmost, because the
  // selected mark is drawn over the others and two Locations can share a
  // coordinate; the id is empty on a mark that carries none.
  //
  // Yielded to a suggestion, the same precedence a click follows: a run's
  // marks land on the Locations they are candidates for, and two cards drawn
  // over one mark describe it twice.
  const located =
    suggestionIndex === null
      ? hits.find(
          (one: maplibregl.MapGeoJSONFeature) =>
            (one.layer.id === LYR.selected || one.layer.id === LYR.others) && one.properties?.id,
        )
      : undefined;
  const locationId = located ? String(located.properties.id) : null;
  const name = hit?.properties?.name;
  if (!name) {
    return { hasMark: !!hit, popupName: null, suggestionIndex, locationId };
  }
  // a suggestion shows its whole card, and so does a Location this page holds;
  // the name popup is for a mark that is neither
  if (suggestionIndex !== null || locationId) {
    return { hasMark: true, popupName: null, suggestionIndex, locationId };
  }
  const labelled =
    map.queryRenderedFeatures(at, {
      layers: NAME_LAYERS.filter((id) => map.getLayer(id)),
    }).length > 0;
  return {
    hasMark: true,
    popupName: labelled ? null : String(name),
    suggestionIndex,
    locationId,
  };
};
