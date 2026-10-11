import * as maplibregl from "maplibre-gl";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { Suggestion } from "../types/engine";
import { hoverInfoAtPoint, pickMark } from "../utils/map/geocodingMapLayers";
import { MapPending } from "../utils/map/mapAssign";
import { GeocodingLocation } from "./useGeocodingLocations";

/**
 * What the pointer does on the map: a click picks a mark or starts assigning a
 * coordinate, and a move names whatever is under it.
 *
 * Both handlers are registered with the map and read the latest props through
 * refs where a fresh function on every render of the page would otherwise tear
 * them down and rebuild them.
 */

interface UseMapPointer {
  mapRef: MutableRefObject<maplibregl.Map | null>;
  /** True while a rectangle or a shape is being drawn; neither handler acts then. */
  drawingRef: MutableRefObject<boolean>;
  shapeOpenRef: MutableRefObject<boolean>;
  shownSuggestions: Suggestion[];
  selected: GeocodingLocation | undefined;
  onSelectLocation?: (entityId: string) => void;
  onHoverSuggestion?: (index: number | null, at: { left: number; top: number } | null) => void;
  setPending: (pending: MapPending) => void;
}

export interface MapPointer {
  /**
   * The Location the pointer is over, and where the pointer is.
   *
   * Held by the map rather than reported to the page, unlike a hovered
   * suggestion: everything the card says is already here — the Locations it
   * draws are this component's own prop — where a suggestion's card is drawn
   * from a run the map never sees.
   */
  hoveredLocation: { id: string; at: { left: number; top: number } } | null;
}

export const useMapPointer = ({
  mapRef,
  drawingRef,
  shapeOpenRef,
  shownSuggestions,
  selected,
  onSelectLocation,
  onHoverSuggestion: onHoverSuggestionProp,
  setPending,
}: UseMapPointer): MapPointer => {
  const [hoveredLocation, setHoveredLocation] = useState<MapPointer["hoveredLocation"]>(null);
  const hoverRef = useRef<maplibregl.Popup | null>(null);
  useEffect(
    () => () => {
      hoverRef.current?.remove();
    },
    [],
  );

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
      if (drawingRef.current || shapeOpenRef.current) {
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
        // a click on a repeated copy of the world is the same place as on the first
        lon: event.lngLat.wrap().lng,
        x: event.point.x,
        y: event.point.y,
      });
    };
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [onSelectLocation, selected, mapRef, drawingRef, shapeOpenRef, setPending]);

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
      if (drawingRef.current || shapeOpenRef.current) {
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
  }, [mapRef, drawingRef, shapeOpenRef]);

  return { hoveredLocation };
};
