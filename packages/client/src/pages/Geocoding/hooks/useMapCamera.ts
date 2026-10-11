import * as maplibregl from "maplibre-gl";
import { MutableRefObject, useEffect, useRef } from "react";
import { geometryBbox, parseGeometry } from "@inkvisitor/shared/types/geometry";
import { Position, boundsOf, lngLat } from "../utils/map/geocodingMapLayers";
import { MapFocus, moveFor } from "../utils/map/mapFocus";
import {
  FIT_PADDING,
  FIT_SUGGESTIONS_MS,
  FLY_SECONDS,
  fromMapZoom,
  toMapZoom,
} from "../utils/map/mapView";
import { flightFor } from "../utils/suggestions/suggestionRank";

/**
 * Where the map looks: the selection, a run's strongest suggestions, and a point
 * the researcher asked to see.
 *
 * Every move goes through the existing map rather than rebuilding it, because
 * rebuilding throws away where the researcher had panned to.
 */

interface UseMapCamera {
  mapRef: MutableRefObject<maplibregl.Map | null>;
  position: Position | null;
  selectedGeometryKey: string;
  /** The strongest few suggestions of the run being judged. */
  leaders: Position[];
  focus: MapFocus | null;
}

export const useMapCamera = ({
  mapRef,
  position,
  selectedGeometryKey,
  leaders,
  focus,
}: UseMapCamera): void => {
  // Recentres when the selection changes, without rebuilding the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !position) {
      return;
    }
    // a line or an area is framed whole; a point is centred
    const selectedGeometry = selectedGeometryKey ? parseGeometry(selectedGeometryKey) : null;
    const shape = selectedGeometry && selectedGeometry.type !== "Point" ? selectedGeometry : null;
    if (shape) {
      const [west, south, east, north] = geometryBbox(shape);
      map.fitBounds(
        [
          [west, south],
          [east, north],
        ],
        { padding: FIT_PADDING, maxZoom: toMapZoom(12), duration: 0 },
      );
      return;
    }
    map.jumpTo({ center: lngLat(position), zoom: Math.max(map.getZoom(), toMapZoom(9)) });
  }, [mapRef, position, selectedGeometryKey]);

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
};
