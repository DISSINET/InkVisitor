import { GeocodingBbox } from "@inkvisitor/shared/types/geocoding";
import * as maplibregl from "maplibre-gl";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { BOX_REFUSAL_MESSAGE, boxFromDrag, boxRefusal } from "../utils/map/regionBox";

/**
 * Drawing a rectangle on the map to stand as the query's region.
 *
 * Owns the mode, the rectangle under the pointer and the reason a drag was
 * refused. What the rectangle means to the engine belongs to whoever holds the
 * context, which is why a finished box is reported rather than stored here.
 */

export interface UseRegionDraw {
  drawing: boolean;
  setDrawing: (armed: boolean | ((armed: boolean) => boolean)) => void;
  /** Read by handlers registered once for the map's life. */
  drawingRef: MutableRefObject<boolean>;
  /** The rectangle under the pointer, while it is still being dragged. */
  drag: GeocodingBbox | null;
  /** Why the last drag was not a region. Cleared by the next one. */
  drawRefusal: string | null;
  setDrawRefusal: (message: string | null) => void;
  regionDetailsOpen: boolean;
  setRegionDetailsOpen: (open: boolean) => void;
}

export const useRegionDraw = (
  mapRef: MutableRefObject<maplibregl.Map | null>,
  onRegionBox: ((box: GeocodingBbox | null) => void) | undefined,
): UseRegionDraw => {
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
   * Whether the pointer or keyboard focus is on the region control or its
   * note. The drawn region's coordinates are shown only then, since the button
   * already says a region is set.
   */
  const [regionDetailsOpen, setRegionDetailsOpen] = useState(false);
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
  }, [drawing, mapRef]);

  return {
    drawing,
    setDrawing,
    drawingRef,
    drag,
    drawRefusal,
    setDrawRefusal,
    regionDetailsOpen,
    setRegionDetailsOpen,
  };
};
