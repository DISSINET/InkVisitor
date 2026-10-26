import {
  GeocodingAccuracy,
  GeocodingBbox,
  IGeocodingContext,
} from "@inkvisitor/shared/types/geocoding";
import { InterfaceEnums } from "@inkvisitor/shared/enums";
import {
  GeoJsonGeometry,
  geometryAnchor,
  pointGeometry,
  serializeGeometry,
} from "@inkvisitor/shared/types/geometry";
import { UserOptions } from "@inkvisitor/shared/types/response-user";
import { EntityTag } from "components/advanced";
import { useDebounce } from "hooks";
import "maplibre-gl/dist/maplibre-gl.css";
import { useAppSelector } from "redux/hooks";
import { IcoSelection } from "Theme/icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Position,
  lngLat,
} from "../../utils/map/geocodingMapLayers";
import {
  MapLayerPrefs,
  loadMapPrefs,
  saveMapPrefs,
} from "../../utils/map/geocodingMapPrefs";
import {
  SEARCH_DEBOUNCE_MS,
  SEARCH_LIMIT,
  FLY_SECONDS,
  FLY_TO_SUGGESTIONS,
  toMapZoom,
  pickerAnchorIn,
} from "../../utils/map/mapView";
import { MapFooterControls } from "../../components/map/MapFooterControls";
import { MapLayersPanel } from "../../components/map/MapLayersPanel";
import { MapSearchBox } from "../../components/map/MapSearchBox";
import { GeometryDrawPanel } from "../../components/map/GeometryDrawPanel";
import { RecentGeocodes } from "../../components/recent/RecentGeocodes";
import { RecentGeocode } from "../../utils/write/recentGeocodes";
import { useGeometryDraw } from "../../hooks/useGeometryDraw";
import { useMapCamera } from "../../hooks/useMapCamera";
import { useMapMarks } from "../../hooks/useMapMarks";
import { useMapPointer } from "../../hooks/useMapPointer";
import { useMapStyle } from "../../hooks/useMapStyle";
import { useRegionDraw } from "../../hooks/useRegionDraw";
import { AccuracyPicker } from "../../components/placeType/AccuracyPicker";
import { PlaceTypePicker } from "../../components/placeType/PlaceTypePicker";
import { engineSearch } from "../../utils/engine/engine";
import { boxLabel } from "../../utils/map/regionBox";
import { EngineSearchHit, Suggestion } from "../../types/engine";
import {
  StyledDrawClear,
  StyledDrawNote,
  StyledDrawRefusal,
  StyledDrawToggle,
  StyledMapCanvas,
  StyledMapStage,
  StyledMapPanel,
  StyledMarkCard,
  StyledMarkCardAt,
  StyledMarkCardMeta,
} from "./GeocodingMapStyles";
import { MapPending, afterAccuracy, menuAnchorFor } from "../../utils/map/mapAssign";
import { MapFocus } from "../../utils/map/mapFocus";
import { useFocusRing } from "../../hooks/useFocusRing";
import { KindIcon, kindInfo } from "../../components/placeType/placeTypeIcons";
import { findPlaceType, usePlaceTypes } from "../../hooks/placeTypesContext";
import { GeocodingLocation } from "../../hooks/useGeocodingLocations";

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

/** No Locations and no suggestions each resolve to one shared, stable empty array. */
const NO_LOCATIONS: GeocodingLocation[] = [];
const NO_SUGGESTIONS: Suggestion[] = [];
const NO_RECENT: RecentGeocode[] = [];

interface GeocodingMap {
  /** Width of the canvas, which stays put while the panels beside it move. */
  canvasWidth: number;
  /** How much of the canvas the side panels hide on each side. */
  covered: { left: number; right: number };
  selected: GeocodingLocation | undefined;
  /**
   * A point the researcher asked to see, and when they asked. The moment is what
   * makes asking twice for the same point fly twice.
   */
  focus: MapFocus | null;
  /** The places just geocoded in this browser, newest first. */
  recent?: RecentGeocode[];
  onShowRecent?: (lat: number, lon: number) => void;
  /**
   * The geocoded Locations the list is showing. The list's filters are the
   * page's one statement about what is being worked on, so a place the list
   * excludes is not drawn — a map showing more than the list is a second,
   * unexplained answer to the same question.
   */
  geocoded: GeocodingLocation[];
  context: IGeocodingContext;
  userOptions: UserOptions | undefined;
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
    placeType?: string | null,
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
    geometry: GeoJsonGeometry,
    accuracy: GeocodingAccuracy,
    /**
     * What kind of place to record. `undefined` leaves whatever the Location
     * already carries, which is the right answer for a geometry correction.
     */
    placeType?: string | null,
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

export const GeocodingMap: React.FC<GeocodingMap> = ({
  canvasWidth,
  covered,
  selected,
  focus,
  recent,
  onShowRecent,
  geocoded,
  context,
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
  const placeTypes = usePlaceTypes();
  const themeId: InterfaceEnums.Theme = useAppSelector((state) => state.theme);
  const basemap = themeId === "dark" ? "dark" : "light";
  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<EngineSearchHit[]>([]);
  /**
   * A coordinate waiting to be written, and how far through the two questions it
   * is. `accuracy` set means the accuracy is chosen and the kind of place is
   * being asked for.
   */
  const [pending, setPending] = useState<MapPending | null>(null);
  const [manual, setManual] = useState({ lat: "", lon: "" });
  const debouncedTerm = useDebounce(term, SEARCH_DEBOUNCE_MS);
  const containerRef = useRef<HTMLDivElement | null>(null);
  /**
   * Whether the shape tool is open. While it is, a click on the map belongs to
   * the tool and does not start a point assignment.
   */
  const [shapeOpen, setShapeOpen] = useState(false);
  const shapeOpenRef = useRef(false);
  shapeOpenRef.current = shapeOpen;

  /** The point last asked for by name, while its ring is up. */
  const ringed = useFocusRing(focus);

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
    placeType?: string | null,
  ) => {
    if (at.suggestion) {
      onChooseSuggestion(at.suggestion.index, accuracy, placeType);
    } else {
      onAssign(at.geometry ?? pointGeometry(at.lon, at.lat), accuracy, placeType);
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

  /**
   * The selected geometry as its stored text. Deriving a Location builds a new
   * geometry object on every refetch, so effects that move the camera depend on
   * the text, which only changes when the shape does.
   */
  const selectedGeometryKey =
    selected?.isGeocoded && selected.geometry ? serializeGeometry(selected.geometry) : "";

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
  useEffect(() => {
    setPending(null);
    setShapeOpen(false);
  }, [selected?.entity.id]);

  // the shape tool closes once the Location carries a different geometry, which
  // is the write landing; a cancelled or refused write leaves the drawing where
  // it was
  useEffect(() => {
    setShapeOpen(false);
  }, [selectedGeometryKey]);

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

  /* ------------------------------------------------------ what the map draws */

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
  // rebuilt every render on purpose: `useMapCamera` runs a check each render
  // and decides from the coordinates, so a memoised array would hide a change
  const leaders: Position[] = layers.suggestions
    ? suggestions.slice(0, FLY_TO_SUGGESTIONS).map((one): Position => [one.lat, one.lon])
    : [];

  const { mapRef, styleEpoch, basemapLayers } = useMapStyle(containerRef, position, basemap);

  /**
   * Centres every camera move on the uncovered part of the canvas.
   *
   * The padding changes with the centre that keeps the same place under the
   * same pixel, so a panel folding or a separator landing leaves the map where
   * it was. The first padding moves the centre with it instead: the map was
   * just created on a centre meant for what can be seen.
   */
  const padded = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    // negative before the layout has been measured
    if (!map || covered.left < 0 || covered.right < 0) {
      return;
    }
    const current = map.getPadding();
    const padding = { ...current, left: covered.left, right: covered.right };
    if (!padded.current) {
      padded.current = true;
      map.jumpTo({ padding });
      return;
    }
    const { clientWidth, clientHeight } = map.getContainer();
    const x = covered.left + (clientWidth - covered.left - covered.right) / 2;
    const { top = 0, bottom = 0 } = current;
    const y = top + (clientHeight - top - bottom) / 2;
    map.jumpTo({ center: map.unproject([x, y]), padding });
  }, [mapRef, covered.left, covered.right]);
  const {
    drawing,
    setDrawing,
    drawingRef,
    drag,
    drawRefusal,
    setDrawRefusal,
    regionDetailsOpen,
    setRegionDetailsOpen,
  } = useRegionDraw(mapRef, onRegionBox);

  /* ------------------------------------------------------ the map and its hooks */

  // `useMapStyle` adds this page's layers, so the hooks below must stay after it:
  // declared after it, a rebuilt style puts the drawing tool's layers above them
  // rather than beneath
  const draw = useGeometryDraw(mapRef, styleEpoch, shapeOpen);

  useMapMarks({
    mapRef,
    styleEpoch,
    basemapLayers,
    layers,
    shownOthers,
    shownSuggestions,
    leader,
    highlighted,
    selected,
    position,
    selectedName,
    selectedGeometryKey,
    shapeOpen,
    pending,
    ringed,
    drag,
    regionBbox: context.regionBbox,
  });
  useMapCamera({ mapRef, position, selectedGeometryKey, leaders, focus });
  const { hoveredLocation } = useMapPointer({
    mapRef,
    drawingRef,
    shapeOpenRef,
    shownSuggestions,
    selected,
    onSelectLocation,
    onHoverSuggestion: onHoverSuggestionProp,
    setPending,
  });


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



  return (
    <StyledMapPanel data-map-panel>
      {/* the renderer draws into this element and owns everything inside it;
          every mark on it is a layer set from the effects above */}
      <StyledMapStage $width={canvasWidth}>
        <StyledMapCanvas ref={containerRef} data-map-canvas />
      </StyledMapStage>

      <RecentGeocodes
        recent={recent ?? NO_RECENT}
        onShow={(entry) => onShowRecent?.(entry.lat, entry.lon)}
      />

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
            <KindIcon kind={findPlaceType(placeTypes, hoveredCard.location.placeType)} />
            {kindInfo(findPlaceType(placeTypes, hoveredCard.location.placeType)).label}
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
          current={selected?.placeType}
          clearLabel={
            selected?.placeType ? `keep it as ${selected.placeType}` : "record no kind of place"
          }
          onChoose={(placeType) =>
            finish(
              pending,
              pending.accuracy as GeocodingAccuracy,
              placeType as string | null,
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
            $set={!!context.regionBbox}
            aria-pressed={drawing}
            data-hint={
              drawing
                ? "drag a rectangle over the area the query is about, or press again to stop"
                : "draw the region on the map, for an area the engine's own list does not name"
            }
            onMouseEnter={() => setRegionDetailsOpen(true)}
            onMouseLeave={() => setRegionDetailsOpen(false)}
            onFocus={() => setRegionDetailsOpen(true)}
            onBlur={() => setRegionDetailsOpen(false)}
            onClick={() => {
              setDrawRefusal(null);
              setShapeOpen(false);
              setDrawing((armed) => !armed);
            }}
          >
            <IcoSelection />
          </StyledDrawToggle>
          {drawing || drawRefusal || (context.regionBbox && regionDetailsOpen) ? (
            <StyledDrawNote
              onMouseEnter={() => setRegionDetailsOpen(true)}
              onMouseLeave={() => setRegionDetailsOpen(false)}
            >
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
                  data-hint="drop the drawn region and go back to the named one"
                  onClick={() => onRegionBox(null)}
                >
                  clear
                </StyledDrawClear>
              ) : null}
            </StyledDrawNote>
          ) : null}
        </>
      ) : null}

      <GeometryDrawPanel
        open={shapeOpen}
        onToggle={() => {
          // both tools take the drag, so only one is armed at a time
          setDrawing(false);
          setShapeOpen((open) => !open);
        }}
        disabled={!selected}
        draw={draw}
        stored={selected?.geometry ?? null}
        onSave={(geometry: GeoJsonGeometry) => {
          const map = mapRef.current;
          const box = geometryAnchor(geometry);
          // the menu is positioned inside the map, at the shape's anchor
          const at = map?.project([box.lon, box.lat]);
          setPending({
            lat: box.lat,
            lon: box.lon,
            geometry,
            x: at?.x ?? 0,
            y: at?.y ?? 0,
          });
        }}
      />

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
          // rather than to a point nobody clicked. Measured against the
          // canvas, which is what a map click's point is measured in
          const anchor = menuAnchorFor(
            event.currentTarget.getBoundingClientRect(),
            containerRef.current?.getBoundingClientRect(),
          );
          setPending({ lat, lon, ...anchor });
          setManual({ lat: "", lon: "" });
        }}
      />
    </StyledMapPanel>
  );
};
