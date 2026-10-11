import * as maplibregl from "maplibre-gl";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { BASEMAP_STYLE } from "../utils/map/basemapStyle";
import {
  BasemapLayer,
  flatBuildingLayerFor,
  groupedLayersOf,
  neverDrawnLayerIds,
} from "../utils/map/basemapLayers";
import { colourKeysFor, darkenPaintValue } from "../utils/map/darkBasemap";
import { Position, addGeocodingLayers, lngLat } from "../utils/map/geocodingMapLayers";
import { registerMaplibreWorker } from "../utils/map/maplibreWorker";
import { EUROPE, toMapZoom } from "../utils/map/mapView";
import { useTheme } from "hooks";

/**
 * The renderer itself: creating the map, and keeping its style in step with the
 * theme.
 *
 * Everything else the map does is added by other hooks in effects keyed on
 * `styleEpoch`, because a style swap discards every source and layer that was
 * sitting on the previous one.
 */

export interface UseMapStyle {
  mapRef: MutableRefObject<maplibregl.Map | null>;
  /**
   * Bumped each time a style finishes loading. Everything this page adds to the
   * map is added in an effect keyed on it.
   */
  styleEpoch: number;
  /**
   * The basemap's own layers, grouped by the switch that owns them.
   *
   * Refilled on every style load, never read back off the live map: the ids
   * belong to the style that carries them, so a swapped style — which is how the
   * dark basemap arrives — invalidates the previous set entirely.
   */
  basemapLayers: MutableRefObject<BasemapLayer[]>;
}

export const useMapStyle = (
  containerRef: MutableRefObject<HTMLDivElement | null>,
  position: Position | null,
  basemap: "light" | "dark",
): UseMapStyle => {
  // the renderer takes plain option objects rather than styled components, so
  // the theme has to be read rather than inherited - the reason the mark colours
  // were hardcoded and then never followed dark mode
  const theme = useTheme();
  const mapRef = useRef<maplibregl.Map | null>(null);
  const basemapLayers = useRef<BasemapLayer[]>([]);
  const [styleEpoch, setStyleEpoch] = useState(0);

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
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.on("style.load", () => setStyleEpoch((epoch) => epoch + 1));
    // the renderer reports a failed style, tile or glyph through this event and
    // nowhere else: without a listener a basemap that never arrives is silent,
    // and the page looks like one whose marks simply have nothing behind them
    map.on("error", (event) => console.error("[geocoding map]", event.error?.message ?? event));
    mapRef.current = map;
    return () => {
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
    let styleLayers = (style.layers ?? []) as Parameters<typeof groupedLayersOf>[0];
    // the style draws buildings flat only up to the zoom its extrusions start at
    const flatBuilding = flatBuildingLayerFor(style.layers ?? []);
    if (flatBuilding) {
      map.addLayer(flatBuilding.layer as never, flatBuilding.beforeId);
      styleLayers = (map.getStyle()?.layers ?? styleLayers) as typeof styleLayers;
    }
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

  return { mapRef, styleEpoch, basemapLayers };
};
