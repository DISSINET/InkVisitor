import { GeocodingBbox } from "@inkvisitor/shared/types/geocoding";
import * as maplibregl from "maplibre-gl";
import { MutableRefObject, useEffect, useRef } from "react";
import { Suggestion } from "../types/engine";
import { BasemapLayer } from "../utils/map/basemapLayers";
import {
  LYR,
  Position,
  focusPulse,
  setFocusPulse,
  setGeocodingMapData,
  setHoveredSuggestion,
} from "../utils/map/geocodingMapLayers";
import { MapLayerPrefs } from "../utils/map/geocodingMapPrefs";
import { FOCUS_MARK_MS } from "../utils/map/mapFocus";
import { MapPending } from "../utils/map/mapAssign";
import { GeocodingLocation } from "./useGeocodingLocations";

/**
 * What the map draws: the page's own marks, which basemap layers are visible,
 * the breathing ring on a point asked for, and the ring on the mark the reader
 * points at.
 *
 * Every mark is set as data on a source that already exists. The sources are
 * made once per style by `addGeocodingLayers`, which is why each effect here is
 * keyed on `styleEpoch`.
 */

interface UseMapMarks {
  mapRef: MutableRefObject<maplibregl.Map | null>;
  styleEpoch: number;
  basemapLayers: MutableRefObject<BasemapLayer[]>;
  layers: MapLayerPrefs;
  shownOthers: GeocodingLocation[];
  shownSuggestions: Suggestion[];
  leader: number | null;
  /** The suggestion under the pointer, from either side of the page. */
  highlighted: number | null;
  selected: GeocodingLocation | undefined;
  position: Position | null;
  selectedName: string;
  selectedGeometryKey: string;
  shapeOpen: boolean;
  pending: MapPending | null;
  ringed: { at: Position; since: number } | null;
  /** The rectangle being dragged out, which takes precedence over the stored one. */
  drag: GeocodingBbox | null;
  regionBbox: GeocodingBbox | null | undefined;
}

export const useMapMarks = ({
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
  regionBbox,
}: UseMapMarks): void => {
  // The page's own marks. Set as data on sources that already exist, so a change
  // of selection or of suggestions never touches the layers themselves. One
  // effect per source: a rectangle being dragged out must not re-send the
  // Locations of the whole corpus, and a click must not re-send the rectangle.
  const withMap = (apply: (map: maplibregl.Map) => void) => {
    const map = mapRef.current;
    if (map && styleEpoch !== 0) {
      apply(map);
    }
  };

  useEffect(() => {
    withMap((map) => setGeocodingMapData(map, { others: shownOthers }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleEpoch, shownOthers]);

  useEffect(() => {
    withMap((map) => setGeocodingMapData(map, { suggestions: shownSuggestions, leader }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleEpoch, shownSuggestions, leader]);

  useEffect(() => {
    withMap((map) =>
      setGeocodingMapData(map, {
        selected: {
          position,
          name: selectedName,
          id: selected?.entity.id,
          // the shape tool draws the stored shape itself while it is being edited
          geometry: shapeOpen ? null : (selected?.geometry ?? null),
        },
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleEpoch, position, selectedName, selected?.entity.id, selectedGeometryKey, shapeOpen]);

  useEffect(() => {
    withMap((map) =>
      setGeocodingMapData(map, { pending: pending ? [pending.lat, pending.lon] : null }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleEpoch, pending]);

  useEffect(() => {
    withMap((map) => setGeocodingMapData(map, { focus: ringed?.at ?? null }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleEpoch, ringed]);

  // what is being dragged out takes precedence over what is stored, so the
  // rectangle follows the pointer rather than jumping into place on release
  useEffect(() => {
    withMap((map) => setGeocodingMapData(map, { regionBox: drag ?? regionBbox ?? null }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleEpoch, drag, regionBbox]);

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
  }, [styleEpoch, layers, mapRef, basemapLayers]);

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
  }, [ringed, styleEpoch, mapRef]);

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
  }, [highlighted, styleEpoch, shownSuggestions, mapRef]);
};
