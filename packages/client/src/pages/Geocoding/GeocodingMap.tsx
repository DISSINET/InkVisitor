import {
  GEOCODING_PLACE_TYPES,
  GeocodingAccuracy,
  GeocodingBbox,
  GeocodingPlaceType,
  IGeocodingContext,
  IGeocodingRoles,
} from "@inkvisitor/shared/types/geocoding";
import { InterfaceEnums } from "@inkvisitor/shared/enums";
import { UserOptions } from "@inkvisitor/shared/types/response-user";
import { Button, Input } from "components";
import { EntityTag } from "components/advanced";
import { useTheme } from "hooks";
import { useDebounce } from "hooks";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useAppSelector } from "redux/hooks";
import { IcoLayers, IcoSearch, IcoSelection } from "Theme/icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BASEMAP_GROUPS,
  BasemapLayer,
  groupedLayersOf,
  neverDrawnLayerIds,
} from "./basemapLayers";
import {
  LYR,
  Position,
  addGeocodingLayers,
  boundsOf,
  hoverInfoAtPoint,
  lngLat,
  pickMark,
  focusPulse,
  setFocusPulse,
  setGeocodingMapData,
  setHoveredSuggestion,
} from "./geocodingMapLayers";
import {
  DEFAULT_MAP_PREFS,
  MapLayerPrefs,
  loadMapPrefs,
  saveMapPrefs,
} from "./geocodingMapPrefs";
import { registerMaplibreWorker } from "./maplibreWorker";
import { AccuracyPicker } from "./AccuracyPicker";
import { PlaceTypePicker } from "./PlaceTypePicker";
import { colourKeysFor, darkenPaintValue } from "./darkBasemap";
import { engineSearch } from "./engine";
import { BOX_REFUSAL_MESSAGE, boxFromDrag, boxLabel, boxRefusal } from "./regionBox";
import { EngineSearchHit, Suggestion } from "./engineTypes";
import {
  StyledDrawClear,
  StyledDrawNote,
  StyledDrawRefusal,
  StyledDrawToggle,
  StyledLayerCount,
  StyledLayerRow,
  StyledLayersHead,
  StyledLayersNote,
  StyledLayersPanel,
  StyledLayersReset,
  StyledLayersToggle,
  StyledManualEntry,
  StyledMapCanvas,
  StyledMapFooter,
  StyledMapHint,
  StyledMapPanel,
  StyledMapSearch,
  StyledSearchHit,
  StyledSearchHitMeta,
  StyledSearchHits,
  StyledMarkCard,
  StyledMarkCardAt,
  StyledMarkCardMeta,
} from "./GeocodingMapStyles";
import { MapPending, afterAccuracy, menuAnchorFor } from "./mapAssign";
import { FOCUS_MARK_MS, MapFocus, moveFor } from "./mapFocus";
import { useFocusRing } from "./useFocusRing";
import { PlaceTypeIcon, placeTypeInfo } from "./placeTypeIcons";
import { flightFor } from "./suggestionRank";
import { GeocodingLocation } from "./useGeocodingLocations";

/**
 * The map.
 *
 * A vector basemap, so what it draws can be turned on and off: the borders and
 * the place names are layers in the style rather than pixels baked into a tile,
 * and a researcher judging whether a suggestion is the right place is judging it
 * against exactly those.
 *
 * Marks are circles rather than pins, which load image assets by URL and break
 * under a bundler. A circle also takes a theme colour, which a bitmap does not.
 *
 * Clicking assigns a coordinate directly and needs no engine at all — which is
 * what keeps the page usable when the engine is unreachable.
 */

const SEARCH_DEBOUNCE_MS = 400;
const SEARCH_LIMIT = 6;
const EUROPE: Position = [48, 12];

/** Long enough to read as travel rather than as a jump, short enough to wait for. */
const FLY_SECONDS = 0.7;

/** How many of the strongest suggestions the map fits when a run finishes. */
const FLY_TO_SUGGESTIONS = 5;

/** Room around a fitted set, so no suggestion sits against an edge. */
const FIT_PADDING = 64;

/** How long fitting the strongest suggestions of a finished run takes to settle. */
const FIT_SUGGESTIONS_MS = 800;

/**
 * The basemap. One style, in both themes.
 *
 * Free and keyless, and built on the OpenMapTiles schema, which is what
 * `basemapLayers` classifies against — a style on another schema would load and
 * draw but leave the layer switches with nothing to switch.
 *
 * The dark theme recolours this rather than loading a dark style of its own:
 * see `darkBasemap`. The two themes then draw the same map, with the same layers
 * under the same switches.
 */
const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

/**
 * Zoom levels here are one lower than the same scale in `mapFocus`.
 *
 * That module states its levels against 256px tiles; this renderer counts
 * against 512px ones. Converting at the boundary keeps those constants stated in
 * the units their own reasoning is written in — "never closer than a street" is
 * a claim about scale, and it is checked by tests that name the number.
 */
const ZOOM_SHIFT = 1;
const toMapZoom = (zoom: number) => zoom - ZOOM_SHIFT;
const fromMapZoom = (zoom: number) => zoom + ZOOM_SHIFT;

/**
 * Where a picker opens for a coordinate picked on the map.
 *
 * The pending point is measured inside the map element and the pickers are
 * placed against the viewport, so the container's own position is the
 * difference between the two.
 */
const pickerAnchorIn = (
  container: HTMLElement | null,
  pending: { x: number; y: number },
): { left: number; top: number; bottom: number } => {
  const box = container?.getBoundingClientRect();
  const left = (box?.left ?? 0) + pending.x;
  const top = (box?.top ?? 0) + pending.y;
  return { left, top, bottom: top };
};

/** No Locations and no suggestions each resolve to one shared, stable empty array. */
const NO_LOCATIONS: GeocodingLocation[] = [];
const NO_SUGGESTIONS: Suggestion[] = [];

interface GeocodingMap {
  selected: GeocodingLocation | undefined;
  /**
   * A point the researcher asked to see, and when they asked. The moment is what
   * makes asking twice for the same point fly twice.
   */
  focus: MapFocus | null;
  /**
   * The geocoded Locations the list is showing. The list's filters are the
   * page's one statement about what is being worked on, so a place the list
   * excludes is not drawn — a map showing more than the list is a second,
   * unexplained answer to the same question.
   */
  geocoded: GeocodingLocation[];
  context: IGeocodingContext;
  userOptions: UserOptions | undefined;
  roles: IGeocodingRoles;
  /**
   * A suggestion accepted from the map, with both questions already answered.
   *
   * The map asks them rather than handing the choice on unanswered: the marker
   * is where the researcher is looking, and a menu that opened in the panel
   * instead would ask about a place at the other end of the screen. What the
   * answers mean — the feedback the engine is owed, the write itself — belongs
   * to whoever holds the run, which is why this reports rather than writes.
   */
  onChooseSuggestion: (
    index: number,
    accuracy: GeocodingAccuracy,
    placeType?: GeocodingPlaceType | null,
  ) => void;
  /**
   * The suggestion under the pointer, from either side of the page.
   *
   * The map rings it. Pointing at a card in the list and pointing at a mark on
   * the map are the same act — asking which of these is which — so both are
   * answered in both places.
   */
  highlighted?: number | null;
  /**
   * The suggestion the engine separated from the rest, if it separated one.
   *
   * Passed in rather than worked out here: it is decided from the run's margin,
   * which the map is not given and has no other use for.
   */
  leader?: number | null;
  /**
   * The researcher clicked one of the other Locations drawn on the map.
   *
   * The map shows what the list shows, so a place on it is a row over there —
   * and a coordinate seen in its surroundings is often what makes the neighbour
   * worth looking at next.
   */
  onSelectLocation?: (entityId: string) => void;
  /**
   * The suggestion the pointer is over, and where on screen it is.
   *
   * The map says which mark; the panel that owns the run draws it. A suggestion
   * card needs the whole response behind it — the band it sits in, the roles it
   * would be written with — none of which the map has any other reason to hold.
   */
  onHoverSuggestion?: (index: number | null, at: { left: number; top: number } | null) => void;
  onAssign: (
    lat: number,
    lon: number,
    accuracy: GeocodingAccuracy,
    /**
     * What kind of place to record. `undefined` leaves whatever the Location
     * already carries, which is the right answer for a coordinate correction.
     */
    placeType?: GeocodingPlaceType | null,
  ) => void;
  engineReachable: boolean;
  /** The candidates currently being judged, drawn so the decision can be spatial. */
  suggestions: Suggestion[];
  /**
   * An area drawn on the map to stand as the query's region, or its removal.
   *
   * Drawn here because the region is a claim about where on the map to look,
   * and the only place that claim can be made honestly is on the map. What it
   * means to the engine — that it replaces the named region entirely, that the
   * two together are refused — belongs to whoever holds the context.
   */
  onRegionBox?: (box: GeocodingBbox | null) => void;
}

/**
 * Moving the map by name: the field and the hits that drop out of it.
 *
 * A separate component rather than inline JSX because the search box is a
 * complete, self-contained control — a field, a debounced list, and one
 * action per row — and naming it lets the effects and the pickers around it
 * read as the rest of what the map does.
 */
interface MapSearchBox {
  term: string;
  onTermChange: (value: string) => void;
  hits: EngineSearchHit[];
  onPick: (hit: EngineSearchHit) => void;
}

const MapSearchBox: React.FC<MapSearchBox> = ({ term, onTermChange, hits, onPick }) => (
  <StyledMapSearch>
    <Input
      value={term}
      onChangeFn={onTermChange}
      placeholder="find a place to move the map…"
      icon={<IcoSearch />}
      changeOnType
      width="full"
      clearable
    />
    {hits.length ? (
      <StyledSearchHits>
        {hits.map((hit) => (
          <StyledSearchHit
            key={`${hit.source}-${hit.sourceId}-${hit.lat}`}
            type="button"
            onClick={() => onPick(hit)}
          >
            {hit.label}
            <StyledSearchHitMeta>
              {hit.lat.toFixed(4)}, {hit.lon.toFixed(4)} · {hit.source}
              {hit.type ? ` · ${hit.type}` : ""}
            </StyledSearchHitMeta>
          </StyledSearchHit>
        ))}
      </StyledSearchHits>
    ) : null}
  </StyledMapSearch>
);

/**
 * The map's own controls, folded away behind one toggle.
 *
 * Everything behind it changes what is drawn and nothing else, so it is not a
 * setting the project shares — the researcher who wants only the place in
 * front of them is not making a decision anybody else has to live with.
 */
interface MapLayersPanel {
  open: boolean;
  onToggleOpen: () => void;
  layers: MapLayerPrefs;
  onChange: (next: MapLayerPrefs) => void;
  othersCount: number;
  suggestionsCount: number;
}

const MapLayersPanel: React.FC<MapLayersPanel> = ({
  open,
  onToggleOpen,
  layers,
  onChange,
  othersCount,
  suggestionsCount,
}) => (
  <>
    <StyledLayersToggle
      type="button"
      $open={open}
      title="what the map draws"
      aria-expanded={open}
      onClick={onToggleOpen}
    >
      <IcoLayers />
    </StyledLayersToggle>

    {open ? (
      <StyledLayersPanel role="group" aria-label="Map layers">
        <StyledLayersHead>what the map draws</StyledLayersHead>
        <StyledLayerRow>
          <input
            type="checkbox"
            checked={layers.others}
            onChange={(event) => onChange({ ...layers, others: event.target.checked })}
          />
          <span>
            other locations
            <StyledLayerCount>
              {othersCount} in the list{othersCount ? "" : " — the filters leave none"}
            </StyledLayerCount>
          </span>
        </StyledLayerRow>
        <StyledLayerRow>
          <input
            type="checkbox"
            checked={layers.suggestions}
            onChange={(event) => onChange({ ...layers, suggestions: event.target.checked })}
          />
          <span>
            suggestions
            <StyledLayerCount>
              {suggestionsCount ? `${suggestionsCount} being judged` : "none on screen"}
            </StyledLayerCount>
          </span>
        </StyledLayerRow>
        <StyledLayerRow>
          <input
            type="checkbox"
            checked={layers.names}
            onChange={(event) => onChange({ ...layers, names: event.target.checked })}
          />
          <span>
            names always shown
            <StyledLayerCount>rather than on hover</StyledLayerCount>
          </span>
        </StyledLayerRow>
        <StyledLayersNote>
          The map draws what the list draws. Narrow the filters on the left to narrow this.
        </StyledLayersNote>

        {/* the basemap's own drawing, as distinct from this page's marks */}
        <StyledLayersHead>what the basemap draws</StyledLayersHead>
        {BASEMAP_GROUPS.map((group) => (
          <StyledLayerRow key={group.id}>
            <input
              type="checkbox"
              checked={layers.basemap[group.id]}
              onChange={(event) =>
                onChange({
                  ...layers,
                  basemap: { ...layers.basemap, [group.id]: event.target.checked },
                })
              }
            />
            <span>
              {group.title}
              <StyledLayerCount>{group.note}</StyledLayerCount>
            </span>
          </StyledLayerRow>
        ))}
        {/* said rather than implied: a reader looking for a borders switch
            should find out here that there is none because there never needs
            to be one, not conclude the panel is missing it */}
        <StyledLayersNote>
          Borders, place names, water and relief are always drawn — they are what a place
          is judged against.
        </StyledLayersNote>
        <StyledLayersReset
          type="button"
          onClick={() => onChange(DEFAULT_MAP_PREFS)}
          disabled={JSON.stringify(layers) === JSON.stringify(DEFAULT_MAP_PREFS)}
        >
          reset to defaults
        </StyledLayersReset>
      </StyledLayersPanel>
    ) : null}
  </>
);

/**
 * Naming the act of setting a coordinate and performing it without a mouse.
 *
 * The sentence naming the act and the fields that perform it are one strip:
 * clicking is a mouse gesture and the pair of fields is the same act without
 * one, so a reader who cannot click finds the alternative where the instruction
 * they cannot follow is written.
 */
interface MapFooterControls {
  selected: GeocodingLocation | undefined;
  manual: { lat: string; lon: string };
  onManualChange: React.Dispatch<React.SetStateAction<{ lat: string; lon: string }>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

const MapFooterControls: React.FC<MapFooterControls> = ({
  selected,
  manual,
  onManualChange,
  onSubmit,
}) => (
  <StyledMapFooter>
    <StyledMapHint>
      {selected
        ? `click the map to set a coordinate for ${selected.entity.labels[0]}, or`
        : "select a location to begin"}
    </StyledMapHint>
    {selected ? (
      <StyledManualEntry onSubmit={onSubmit}>
        <Input
          value={manual.lat}
          onChangeFn={(value) => onManualChange((m) => ({ ...m, lat: value }))}
          placeholder="latitude"
          changeOnType
          width={90}
        />
        <Input
          value={manual.lon}
          onChangeFn={(value) => onManualChange((m) => ({ ...m, lon: value }))}
          placeholder="longitude"
          changeOnType
          width={90}
        />
        <Button label="set" color="primary" onClick={() => undefined} />
      </StyledManualEntry>
    ) : null}
  </StyledMapFooter>
);

export const GeocodingMap: React.FC<GeocodingMap> = ({
  selected,
  focus,
  geocoded,
  context,
  roles,
  onChooseSuggestion,
  highlighted = null,
  leader = null,
  onSelectLocation,
  onHoverSuggestion: onHoverSuggestionProp,
  onAssign,
  engineReachable,
  suggestions,
  onRegionBox,
}) => {
  // the renderer takes plain option objects rather than styled components, so
  // the theme has to be read rather than inherited - the reason the mark colours
  // were hardcoded and then never followed dark mode
  const theme = useTheme();
  const themeId: InterfaceEnums.Theme = useAppSelector((state) => state.theme);
  const basemap = themeId === "dark" ? "dark" : "light";
  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<EngineSearchHit[]>([]);
  /**
   * A coordinate waiting to be written, and how far through the two questions it
   * is. `accuracy` set means the accuracy is chosen and the kind of place is
   * being asked for.
   */
  const [pending, setPending] = useState<MapPending | null>(
    null,
  );
  const [manual, setManual] = useState({ lat: "", lon: "" });
  const debouncedTerm = useDebounce(term, SEARCH_DEBOUNCE_MS);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hoverRef = useRef<maplibregl.Popup | null>(null);
  /**
   * The basemap's own layers, grouped by the switch that owns them.
   *
   * Refilled on every style load, never read back off the live map: the ids
   * belong to the style that carries them, so a swapped style — which is how the
   * dark basemap arrives — invalidates the previous set entirely.
   */
  const basemapLayers = useRef<BasemapLayer[]>([]);
  /**
   * Bumped each time a style finishes loading. Everything this page adds to the
   * map is added in an effect keyed on it, because a style swap discards every
   * source and layer that was sitting on the previous one.
   */
  const [styleEpoch, setStyleEpoch] = useState(0);

  /** The point last asked for by name, while its ring is up. */
  const ringed = useFocusRing(focus);

  /**
   * The Location the pointer is over, and where the pointer is.
   *
   * Held by the map rather than reported to the page, unlike a hovered
   * suggestion: everything the card says is already here — the Locations it
   * draws are this component's own prop — where a suggestion's card is drawn
   * from a run the map never sees.
   */
  const [hoveredLocation, setHoveredLocation] = useState<{
    id: string;
    at: { left: number; top: number };
  } | null>(null);

  /**
   * The hover reporter, held rather than closed over: the listener that calls it
   * is registered once for the map's life, and a fresh function on every render
   * of the page would otherwise tear it down and rebuild it.
   */
  const onHoverSuggestion = useRef(onHoverSuggestionProp);
  useEffect(() => {
    onHoverSuggestion.current = onHoverSuggestionProp;
  }, [onHoverSuggestionProp]);

  /**
   * The hovered Location itself.
   *
   * Looked up rather than stored with the hover, so a card left open across a
   * write shows what the Location now says instead of what it said when the
   * pointer arrived. Null once it leaves the set the map draws — the selection
   * moving to a different territory, say.
   */
  const hoveredCard = useMemo(() => {
    if (!hoveredLocation) {
      return null;
    }
    const location =
      geocoded.find((one) => one.entity.id === hoveredLocation.id) ??
      (selected?.entity.id === hoveredLocation.id ? selected : undefined);
    return location ? { location, at: hoveredLocation.at } : null;
  }, [hoveredLocation, geocoded, selected]);

  /**
   * The end of the two questions, whichever of them ended it.
   *
   * One exit rather than four, because what a finished answer is reported as
   * depends on the pending point and not on which picker closed: a suggestion
   * goes back as an acceptance and a bare coordinate as a write. Four call
   * sites deciding that separately is four chances for one of them to report a
   * suggestion as an anonymous coordinate, which loses the engine its feedback
   * without failing.
   */
  const finish = (
    at: MapPending,
    accuracy: GeocodingAccuracy,
    placeType?: GeocodingPlaceType | null,
  ) => {
    if (at.suggestion) {
      onChooseSuggestion(at.suggestion.index, accuracy, placeType);
    } else {
      onAssign(at.lat, at.lon, accuracy, placeType);
    }
    setPending(null);
  };

  const pickerAnchor = (at: { x: number; y: number }) =>
    pickerAnchorIn(containerRef.current, at);

  /**
   * Where the selected Location already sits, if anywhere.
   *
   * Memoised on the two numbers rather than rebuilt each render. Every effect
   * that moves the camera watches this, and a fresh array on every render is a
   * changed dependency on every render — so the map would jump back to the
   * recorded coordinate whenever anything at all re-rendered the page, taking
   * it away from a reader who had panned to look at a suggestion.
   */
  const position = useMemo<Position | null>(
    () =>
      selected?.isGeocoded && selected.lat !== null && selected.lon !== null
        ? [selected.lat, selected.lon]
        : null,
    [selected?.isGeocoded, selected?.lat, selected?.lon],
  );

  /* the selected Location's own coordinate stays the most prominent thing on
     the map, named with the accuracy it was recorded at */
  const selectedName = selected ? `${selected.entity.labels[0]} · ${selected.accuracy}` : "";

  useEffect(() => {
    if (!engineReachable || debouncedTerm.trim().length < 2) {
      setHits([]);
      return;
    }
    const controller = new AbortController();
    engineSearch(debouncedTerm.trim(), SEARCH_LIMIT, controller.signal)
      .then((response) => setHits(response.hits))
      // an abort is this component's own doing, and an unreachable engine
      // already shows in the header; neither is worth a toast here
      .catch(() => setHits([]));
    return () => controller.abort();
  }, [debouncedTerm, engineReachable]);

  // the selection changing invalidates a half-finished click
  useEffect(() => setPending(null), [selected?.entity.id]);

  // backing out of a popup with Escape is the platform convention, and the
  // menu opens over a map where a stray click is easy to make
  useEffect(() => {
    if (!pending) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPending(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending]);

  const others = useMemo(
    () => geocoded.filter((location) => location.entity.id !== selected?.entity.id),
    [geocoded, selected],
  );

  /**
   * What the map draws. Held here rather than in the page's shared state: it
   * changes what is on the map and nothing else, and a map with a hundred marks
   * on it is a different tool from one with three.
   */
  const [layers, setLayers] = useState<MapLayerPrefs>(loadMapPrefs);
  useEffect(() => saveMapPrefs(layers), [layers]);
  const [showLayers, setShowLayers] = useState(false);

  /* ------------------------------------------------------- drawing a region */

  /**
   * Whether the next drag draws a rectangle instead of moving the map.
   *
   * A mode, and the only one this map has. It disarms itself the moment a box
   * lands: drawing a region is a thing done once for a place the named list
   * does not cover, and a map left in a state where it no longer pans is worse
   * than a second press.
   */
  const [drawing, setDrawing] = useState(false);
  /**
   * Read by the handlers that were registered once for the map's life — the
   * click that assigns a coordinate, and the hover that names what is under the
   * pointer. Neither may act while a rectangle is being dragged out.
   */
  const drawingRef = useRef(false);
  drawingRef.current = drawing;
  /** The rectangle under the pointer, while it is still being dragged. */
  const [drag, setDrag] = useState<GeocodingBbox | null>(null);
  /** Why the last drag was not a region. Cleared by the next one. */
  const [drawRefusal, setDrawRefusal] = useState<string | null>(null);
  /**
   * Where the drag started, held across renders rather than inside the effect.
   *
   * A drag is one gesture and the page re-renders during it — the elapsed
   * counter on a running request ticks four times a second — so a corner kept
   * in the effect's own scope is lost to any re-registration, and the release
   * that follows finds nothing to make a rectangle from.
   */
  const dragFrom = useRef<{ lat: number; lon: number } | null>(null);
  /**
   * The report, held rather than closed over, for the same reason the hover
   * reporter is: it arrives fresh on every render of the page, and an effect
   * depending on it would tear the drag's own listeners down mid-gesture.
   */
  const onRegionBoxRef = useRef(onRegionBox);
  useEffect(() => {
    onRegionBoxRef.current = onRegionBox;
  }, [onRegionBox]);

  /**
   * The drag that makes a rectangle.
   *
   * Panning and box-zoom are switched off for as long as the mode is armed,
   * because both are the same gesture — and a drag that both drew a box and
   * moved the map underneath it would leave the box somewhere nobody put it.
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !drawing) {
      return;
    }
    map.dragPan.disable();
    map.boxZoom.disable();
    map.getCanvas().style.cursor = "crosshair";

    const onDown = (event: maplibregl.MapMouseEvent) => {
      event.preventDefault();
      dragFrom.current = { lat: event.lngLat.lat, lon: event.lngLat.lng };
      setDrawRefusal(null);
      setDrag(boxFromDrag(dragFrom.current, dragFrom.current));
    };
    const onMove = (event: maplibregl.MapMouseEvent) => {
      if (!dragFrom.current) {
        return;
      }
      setDrag(boxFromDrag(dragFrom.current, { lat: event.lngLat.lat, lon: event.lngLat.lng }));
    };
    const onUp = (event: maplibregl.MapMouseEvent) => {
      if (!dragFrom.current) {
        return;
      }
      const box = boxFromDrag(dragFrom.current, {
        lat: event.lngLat.lat,
        lon: event.lngLat.lng,
      });
      dragFrom.current = null;
      setDrag(null);
      // the same refusals the engine answers 422 with, asked here instead: a
      // click that did not move, and a drag across the antimeridian, both come
      // out of an ordinary gesture, and a rectangle nobody can see any more is
      // the worst possible place to explain one
      const refusal = boxRefusal(box);
      if (refusal) {
        setDrawRefusal(BOX_REFUSAL_MESSAGE[refusal]);
        return;
      }
      setDrawRefusal(null);
      setDrawing(false);
      onRegionBoxRef.current?.(box);
    };

    map.on("mousedown", onDown);
    map.on("mousemove", onMove);
    map.on("mouseup", onUp);
    return () => {
      map.off("mousedown", onDown);
      map.off("mousemove", onMove);
      map.off("mouseup", onUp);
      map.dragPan.enable();
      map.boxZoom.enable();
      map.getCanvas().style.cursor = "";
      dragFrom.current = null;
      setDrag(null);
    };
    // only on the mode itself: the report is read off a ref, so nothing here is
    // rebuilt by a render of the page, which happens four times a second while
    // a request is running and would land in the middle of a drag
  }, [drawing]);

  /**
   * A switched-off group draws nothing, which one shared empty array says as
   * well as a fresh `[]` would — and says it without handing the effect below
   * a new reference on every render a switch happens not to touch, which is
   * most of them.
   */
  const shownOthers = useMemo(
    () => (layers.others ? others : NO_LOCATIONS),
    [layers.others, others],
  );
  const shownSuggestions = useMemo(
    () => (layers.suggestions ? suggestions : NO_SUGGESTIONS),
    [layers.suggestions, suggestions],
  );

  /**
   * The run as the click handler sees it.
   *
   * Held rather than closed over: the page builds this array fresh on every
   * render, and a listener keyed on it would be torn down and rebuilt as often.
   */
  const suggestionsRef = useRef(shownSuggestions);
  useEffect(() => {
    suggestionsRef.current = shownSuggestions;
  }, [shownSuggestions]);


  /**
   * The strongest few suggestions of the run being judged, which is what the map
   * shows when one finishes.
   *
   * The leading five rather than the leader alone: a run's answer is a set of
   * candidate places and the question being asked of the map is which of them
   * the surroundings argue for. Arriving on top of the first one shows a place
   * without showing the choice.
   *
   * Five because it is the most a reader compares at once, and because the tail
   * of a long run is often a continent away — fitted in, the strongest five
   * would be a cluster of dots in the middle of an ocean.
   */
  const leaders: Position[] = layers.suggestions
    ? suggestions.slice(0, FLY_TO_SUGGESTIONS).map((one): Position => [one.lat, one.lon])
    : [];

  /* ---------------------------------------------------------------- the map */

  // Created once. Every later change reaches it through the effects below
  // rather than by rebuilding it, because rebuilding throws away where the
  // researcher had panned to.
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    registerMaplibreWorker();
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      center: lngLat(position ?? EUROPE),
      zoom: toMapZoom(position ? 9 : 5),
    });
    // the zoom sits top right, away from the search field on the other side
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("style.load", () => setStyleEpoch((epoch) => epoch + 1));
    // the renderer reports a failed style, tile or glyph through this event and
    // nowhere else: without a listener a basemap that never arrives is silent,
    // and the page looks like one whose marks simply have nothing behind them
    map.on("error", (event) => console.error("[geocoding map]", event.error?.message ?? event));
    mapRef.current = map;
    return () => {
      hoverRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Loads the style again when the theme changes.
   *
   * Everything the theme touches is written into the style once and never read
   * back: the basemap's own colours are inverted in place, and this page's
   * layers are created with theme colours baked into their paint. Neither can be
   * undone by writing over it — the inversion has no inverse to apply, and the
   * layers already exist, so the effect that creates them does nothing.
   *
   * Reloading gives both a clean sheet. `style.load` fires, the layers are
   * created again in the new theme's colours, and the recolour below runs over
   * a basemap that is once more in its own.
   */
  const themedStyle = useRef(basemap);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || themedStyle.current === basemap) {
      return;
    }
    themedStyle.current = basemap;
    map.setStyle(BASEMAP_STYLE, { diff: false });
  }, [basemap]);

  /**
   * Recolours the basemap for the theme.
   *
   * Every layer the style shipped, read back and written again with its
   * lightness inverted — not a different style, so the layers, the switches and
   * the classification are the same in both themes.
   *
   * Runs on every style load, because a style that has just loaded is drawn in
   * its own colours until this has been over it.
   */
  useEffect(() => {
    const map = mapRef.current;
    // keyed on the style load alone, never on the theme. A theme change reloads
    // the style, so the load that follows carries the new theme with it — while
    // running on the change itself would reach a style that is being torn down,
    // and the renderer throws from every paint call until the new one is parsed
    if (!map || styleEpoch === 0 || themedStyle.current !== "dark") {
      return;
    }
    const style = map.getStyle();
    if (!style) {
      return;
    }
    for (const layer of style.layers ?? []) {
      // this page's own marks are drawn from the theme already and must not be
      // inverted a second time
      if (layer.id.startsWith("geocoding-")) {
        continue;
      }
      for (const key of colourKeysFor(layer.type)) {
        const value = map.getPaintProperty(layer.id, key as never);
        if (value === undefined) {
          continue;
        }
        const recoloured = darkenPaintValue(value);
        if (recoloured !== value) {
          // the renderer types a paint value as the union of everything a style
          // may hold; what goes back is what came out, with its colour leaves
          // rewritten and its shape untouched
          map.setPaintProperty(layer.id, key as never, recoloured as never);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleEpoch]);

  /**
   * Classifies the style's own layers by the switch that should own each one,
   * and hides the ones this page never draws.
   *
   * Recorded BEFORE this page adds anything of its own, so the classification
   * describes the style as it shipped rather than the style with this page's
   * marks mixed into it.
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || styleEpoch === 0) {
      return;
    }
    const style = map.getStyle();
    if (!style) {
      return;
    }
    const styleLayers = (style.layers ?? []) as Parameters<typeof groupedLayersOf>[0];
    basemapLayers.current = groupedLayersOf(styleLayers);
    if (basemapLayers.current.length === 0) {
      // a style on another schema loads and draws perfectly well; it just leaves
      // the switches with nothing to switch, which is invisible from the panel
      console.warn(
        "[geocoding map] no layer of the basemap style belongs to a known group - " +
          "the basemap switches will do nothing. The style is probably not built " +
          "on the OpenMapTiles schema.",
      );
    }

    // extruded buildings draw over everything this page puts on the map, and a
    // 3D reading of a map being used flat answers no question asked here
    for (const id of neverDrawnLayerIds(styleLayers)) {
      map.setLayoutProperty(id, "visibility", "none");
    }
  }, [styleEpoch]);

  /**
   * Everything this page draws, added on top of whichever style just loaded.
   *
   * Attempted rather than checked first. `style.load` says a style has parsed,
   * and there is no public way to ask whether one is in flight — a theme flipped
   * while the previous style was still arriving leaves this reaching a style
   * that is being torn down, and the renderer throws rather than waiting.
   * `styledata` is what says the next one has settled; it is raised by the
   * renderer's own bookkeeping rather than by drawing, so it still arrives in a
   * tab that is not being painted.
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || styleEpoch === 0) {
      return;
    }
    try {
      addGeocodingLayers(map, theme);
    } catch {
      const again = () => setStyleEpoch((epoch) => epoch + 1);
      map.once("styledata", again);
      return () => {
        map.off("styledata", again);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleEpoch, theme]);

  /* ------------------------------------------------- what the map is showing */

  // The page's own marks. Set as data on a source that already exists, so a
  // change of selection or of suggestions never touches the layers themselves.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || styleEpoch === 0) {
      return;
    }
    setGeocodingMapData(map, {
      others: shownOthers,
      suggestions: shownSuggestions,
      leader,
      selected: { position, name: selectedName, id: selected?.entity.id },
      pending: pending ? [pending.lat, pending.lon] : null,
      focus: ringed?.at ?? null,
      // what is being dragged out takes precedence over what is stored, so the
      // rectangle follows the pointer rather than jumping into place on release
      regionBox: drag ?? context.regionBbox ?? null,
    });
  }, [
    styleEpoch,
    shownOthers,
    shownSuggestions,
    leader,
    position,
    selectedName,
    selected?.entity.id,
    pending,
    ringed,
    drag,
    context.regionBbox,
  ]);

  /**
   * The basemap's borders and labels, and this page's own names.
   *
   * Recomputed in full for every layer on every run rather than incrementally,
   * which is what lets the switches compose: turning a group off survives a
   * theme change, and a theme change cannot reveal a group that is switched off,
   * because both are decided here from the same state every time.
   *
   * Not gated on the style being fully loaded: that also waits on tiles, and a
   * reader who flips a switch on a slow connection would watch nothing happen.
   * The refs this reads are only filled once a style has loaded, and every call
   * is guarded by `getLayer`.
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    const show = (id: string, on: boolean) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", on ? "visible" : "none");
      }
    };
    for (const layer of basemapLayers.current) {
      show(layer.id, layers.basemap[layer.group]);
    }
    show(LYR.othersName, layers.names);
    show(LYR.suggestionName, layers.names);
  }, [styleEpoch, layers]);

  /* ----------------------------------------------------------- where it looks */

  // Recentres when the selection changes, without rebuilding the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !position) {
      return;
    }
    map.jumpTo({ center: lngLat(position), zoom: Math.max(map.getZoom(), toMapZoom(9)) });
  }, [position]);

  /**
   * Moves to the strongest suggestion once a run finishes.
   *
   * A run ends with a list on the right and a map showing wherever the
   * researcher last was, which for an ungeocoded place is the whole of Europe.
   * Flying to the first answers "where is it saying" before anyone has to read a
   * coordinate. Guarded on the flattened coordinate rather than by a dependency
   * array, because an array of two numbers is a new value on every render and
   * the map would be taken back from someone who had panned away.
   */
  const flown = useRef<string | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    const { key, fly } = flightFor(flown.current, leaders[0] ?? null);
    if (map && fly && leaders.length) {
      map.fitBounds(boundsOf(leaders), {
        padding: FIT_PADDING,
        // never closer than the leader alone would have been, so a run whose
        // strongest five sit on one village does not arrive at street level
        maxZoom: toMapZoom(9),
        duration: FIT_SUGGESTIONS_MS,
      });
    }
    flown.current = key;
  });

  /**
   * Moves to a point the researcher asked for, once per asking.
   *
   * Keyed on when rather than where: asking twice for the same suggestion is a
   * request to go back to it, which a coordinate alone cannot express.
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) {
      return;
    }
    const move = moveFor(focus, position, fromMapZoom(map.getZoom()));
    if ("fit" in move) {
      map.fitBounds(boundsOf(move.fit), {
        padding: move.padding[0],
        maxZoom: toMapZoom(move.maxZoom),
        duration: FLY_SECONDS * 1000,
      });
      return;
    }
    map.flyTo({
      center: lngLat(move.center),
      zoom: toMapZoom(move.zoom),
      duration: FLY_SECONDS * 1000,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.at]);

  /**
   * Breathes the focus ring for as long as one is up.
   *
   * Its age is measured from when it was asked for rather than from when this
   * effect started, so a theme change part-way through — which restarts the
   * effect along with the style — resumes the breath where it was instead of
   * granting the ring a second life.
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ringed || styleEpoch === 0) {
      return;
    }
    let frame = 0;
    const draw = () => {
      const pulse = focusPulse(Date.now() - ringed.since, FOCUS_MARK_MS);
      setFocusPulse(map, pulse.radius, pulse.opacity);
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [ringed, styleEpoch]);

  /**
   * The mark the reader is pointing at, rung.
   *
   * Keyed on the style epoch as well as the index: a style swap discards every
   * source this page owns along with the states set on them, so the ring has to
   * be put back once the new one has been drawn on.
   */
  const rung = useRef<number | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    setHoveredSuggestion(map, highlighted, rung.current);
    rung.current = highlighted;
  }, [highlighted, styleEpoch, shownSuggestions]);

  /* --------------------------------------------------------------- clicking */

  /**
   * One handler, with the marks considered before the pixel.
   *
   * A click on a mark is a click on the place it draws, not on the point under
   * it — see `pickMark`, which states the precedence this depends on.
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    const onClick = (event: maplibregl.MapMouseEvent) => {
      // a drag that drew a rectangle ends in a click, and it is a statement
      // about the region rather than about a coordinate
      if (drawingRef.current) {
        return;
      }
      const hit = pickMark(map, event.point);
      if (hit.kind === "suggestion") {
        const suggestion = suggestionsRef.current[hit.index];
        if (!suggestion) {
          return;
        }
        // the card describing this mark has been answered by the act of
        // choosing it, and leaving it open puts a description of the place
        // underneath the menu asking about that place
        onHoverSuggestion.current?.(null, null);
        // the suggestion's own coordinate, not the pixel that was clicked: the
        // mark is ten pixels across and the place is the point at its centre
        setPending({
          lat: suggestion.lat,
          lon: suggestion.lon,
          x: event.point.x,
          y: event.point.y,
          suggestion: { index: hit.index, label: suggestion.label },
        });
        return;
      }
      // a mark that is not a suggestion is one of the Locations the list is
      // showing, and clicking a place on the map is asking to work on it
      if (hit.kind === "other") {
        onSelectLocation?.(hit.id);
        return;
      }
      if (hit.kind === "mark" || !selected) {
        return;
      }
      // a half-finished click is abandoned by the picker's own backdrop, which
      // covers the map while it is open — so a click here is always a fresh one
      setPending({
        lat: event.lngLat.lat,
        lon: event.lngLat.lng,
        x: event.point.x,
        y: event.point.y,
      });
    };
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [onChooseSuggestion, onSelectLocation, selected]);

  /**
   * The name of whatever is under the pointer, and a pointer that says it can be
   * clicked.
   *
   * A popup rather than a painted label: it is real text in the document, which
   * is what keeps a name readable to anything that is not a pair of eyes on a
   * canvas.
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    const onMove = (event: maplibregl.MapMouseEvent) => {
      // while a rectangle is being drawn the pointer is saying where the corner
      // goes, and naming whatever it passes over would fight the crosshair for
      // the cursor as well as for the reader's attention
      if (drawingRef.current) {
        return;
      }
      const info = hoverInfoAtPoint(map, event.point);
      // every mark is something this page will act on when it is clicked, so
      // every mark says so under the pointer
      map.getCanvas().style.cursor = info.hasMark ? "pointer" : "";
      // a suggestion is shown whole rather than named, by whoever holds the run
      // it belongs to. The map has the mark and the point; the card needs the
      // response behind it
      onHoverSuggestion.current?.(
        info.suggestionIndex,
        info.suggestionIndex === null
          ? null
          : { left: event.originalEvent.clientX, top: event.originalEvent.clientY },
      );
      // a Location this page holds is shown as itself rather than named. Placed
      // from the pointer in viewport coordinates, which is what the card is
      // positioned in
      setHoveredLocation(
        info.locationId
          ? {
              id: info.locationId,
              at: { left: event.originalEvent.clientX, top: event.originalEvent.clientY },
            }
          : null,
      );
      // a name already painted at this point needs no popup repeating it
      if (!info.popupName) {
        hoverRef.current?.remove();
        hoverRef.current = null;
        return;
      }
      const popup =
        hoverRef.current ??
        new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });
      popup.setLngLat(event.lngLat).setText(info.popupName).addTo(map);
      hoverRef.current = popup;
    };
    const onLeave = () => {
      hoverRef.current?.remove();
      hoverRef.current = null;
      map.getCanvas().style.cursor = "";
      onHoverSuggestion.current?.(null, null);
      setHoveredLocation(null);
    };
    map.on("mousemove", onMove);
    map.on("mouseout", onLeave);
    return () => {
      map.off("mousemove", onMove);
      map.off("mouseout", onLeave);
    };
  }, []);


  return (
    <StyledMapPanel data-map-panel>
      {/* the renderer draws into this element and owns everything inside it;
          every mark on it is a layer set from the effects above */}
      <StyledMapCanvas ref={containerRef} data-map-canvas />

      {/* what the mark under the pointer is, so several marks in one town can be
          told apart before one of them is clicked. Placed from the pointer and
          held inside the panel, which is what stops a card near an edge being
          drawn off it */}
      {hoveredCard ? (
        <StyledMarkCard
          $left={hoveredCard.at.left}
          $top={hoveredCard.at.top}
          $up={hoveredCard.at.top > window.innerHeight / 2}
          role="group"
          aria-label="the Location under the pointer"
        >
          <EntityTag
            entity={hoveredCard.location.entity}
            disableDrag
            disableDoubleClick
            disableCopyToClipboard
          />
          <StyledMarkCardMeta>
            <PlaceTypeIcon placeType={hoveredCard.location.placeType} />
            {placeTypeInfo(hoveredCard.location.placeType).label}
            {hoveredCard.location.accuracy ? ` · ${hoveredCard.location.accuracy}` : ""}
          </StyledMarkCardMeta>
          <StyledMarkCardAt>
            {hoveredCard.location.lat?.toFixed(5)}, {hoveredCard.location.lon?.toFixed(5)}
          </StyledMarkCardAt>
        </StyledMarkCard>
      ) : null}

      {engineReachable ? (
        <MapSearchBox
          term={term}
          onTermChange={setTerm}
          hits={hits}
          onPick={(hit) => {
            mapRef.current?.flyTo({
              center: lngLat([hit.lat, hit.lon]),
              zoom: toMapZoom(11),
              duration: FLY_SECONDS * 1000,
            });
            setHits([]);
            setTerm("");
          }}
        />
      ) : null}

      {/* the same two questions the panel asks when a suggestion is accepted,
          asked with the same two controls. A coordinate set by clicking is the
          same kind of answer as one accepted from a card, so it is not a place
          for a menu of this page's own */}
      {pending && !pending.accuracy ? (
        <AccuracyPicker
          anchor={pickerAnchor(pending)}
          current={context.mapClickAccuracy}
          note={
            pending.suggestion
              ? `${pending.suggestion.index + 1}. ${pending.suggestion.label}`
              : `${pending.lat.toFixed(5)}, ${pending.lon.toFixed(5)}`
          }
          onChoose={(accuracy) => {
            const step = afterAccuracy(
              pending,
              accuracy,
              context.recordPlaceType,
              context.defaultPlaceType,
            );
            if ("write" in step) {
              finish(pending, step.write.accuracy, step.write.placeType);
              return;
            }
            setPending(step.ask);
          }}
          onClose={() => setPending(null)}
        />
      ) : null}

      {pending?.accuracy ? (
        <PlaceTypePicker
          anchor={pickerAnchor(pending)}
          roles={roles}
          current={selected?.placeType}
          clearLabel={
            selected?.placeType ? `keep it as ${selected.placeType}` : "record no kind of place"
          }
          onChoose={(placeType) =>
            finish(
              pending,
              pending.accuracy as GeocodingAccuracy,
              placeType as GeocodingPlaceType | null,
            )
          }
          onClose={() => setPending(null)}
        />
      ) : null}

      {/* the region as a shape, drawn where the shape is. A rectangle is the
          region for a place the engine's own list does not name, and the only
          honest place to draw one is the map it will be measured against */}
      {onRegionBox ? (
        <>
          <StyledDrawToggle
            type="button"
            $armed={drawing}
            aria-pressed={drawing}
            title={
              drawing
                ? "drag a rectangle over the area the query is about, or press again to stop"
                : "draw the region on the map, for an area the engine's own list does not name"
            }
            onClick={() => {
              setDrawRefusal(null);
              setDrawing((armed) => !armed);
            }}
          >
            <IcoSelection />
          </StyledDrawToggle>
          {drawing || drawRefusal || context.regionBbox ? (
            <StyledDrawNote>
              {drawRefusal ? (
                <StyledDrawRefusal>{drawRefusal}</StyledDrawRefusal>
              ) : drawing ? (
                "drag over the area the query is about"
              ) : (
                `custom region · ${boxLabel(context.regionBbox as GeocodingBbox)}`
              )}
              {context.regionBbox && !drawing ? (
                <StyledDrawClear
                  type="button"
                  title="drop the drawn region and go back to the named one"
                  onClick={() => onRegionBox(null)}
                >
                  clear
                </StyledDrawClear>
              ) : null}
            </StyledDrawNote>
          ) : null}
        </>
      ) : null}

      <MapLayersPanel
        open={showLayers}
        onToggleOpen={() => setShowLayers((open) => !open)}
        layers={layers}
        onChange={setLayers}
        othersCount={others.length}
        suggestionsCount={suggestions.length}
      />

      {/* naming the act and performing it, side by side: clicking is a mouse
          gesture and the pair of fields is the same act without one, so the
          sentence and the fields belong in the same strip */}
      <MapFooterControls
        selected={selected}
        manual={manual}
        onManualChange={setManual}
        onSubmit={(event) => {
          event.preventDefault();
          const lat = Number(manual.lat);
          const lon = Number(manual.lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            return;
          }
          // the same two questions the map click asks, anchored to the form
          // rather than to a point nobody clicked. Measured against the map
          // panel, which is what the menu is positioned inside - the strip
          // the form now sits in is not that element
          const anchor = menuAnchorFor(
            event.currentTarget.getBoundingClientRect(),
            event.currentTarget.closest("[data-map-panel]")?.getBoundingClientRect(),
          );
          setPending({ lat, lon, ...anchor });
          setManual({ lat: "", lon: "" });
        }}
      />
    </StyledMapPanel>
  );
};
