import { GeoJsonGeometry, geometryAnchor, geometryBbox } from "@inkvisitor/shared/types/geometry";
import { useTheme } from "hooks";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import React, { useEffect, useRef } from "react";
import { BASEMAP_STYLE } from "../../utils/map/basemapStyle";
import { registerMaplibreWorker } from "../../utils/map/maplibreWorker";
import { StyledMiniMap } from "./CoordinateTagStyles";

/**
 * A small map that shows where a geometry is.
 *
 * Fixed at about the scale of a country: the question it answers is "which part
 * of the world is this in", which a coordinate pair does not tell anyone at a
 * glance, so the view is never closer than that however small the geometry — a
 * town is a mark inside its country, not a street plan. A geometry larger than a
 * country sets the scale instead and is fitted whole.
 *
 * The same basemap as the page's map. Not interactive and not themed: it is a
 * thumbnail of a place, and it is built when the card opens and removed when it
 * closes, so only one is ever alive.
 */
const COUNTRY_ZOOM = 4.6;
const FIT_PADDING = 16;

interface MiniGeoMap {
  geometry: GeoJsonGeometry;
}

export const MiniGeoMap: React.FC<MiniGeoMap> = ({ geometry }) => {
  const container = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();
  const ink = theme.color["primary"] as string;
  const ground = theme.color["white"] as string;

  useEffect(() => {
    if (!container.current) {
      return;
    }
    registerMaplibreWorker();
    const at = geometryAnchor(geometry);
    const map = new maplibregl.Map({
      container: container.current,
      style: BASEMAP_STYLE,
      center: [at.lon, at.lat],
      zoom: COUNTRY_ZOOM,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
    });
    map.on("load", () => {
      map.addSource("shape", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry },
      });
      map.addLayer({
        id: "shape-fill",
        type: "fill",
        source: "shape",
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: { "fill-color": ink, "fill-opacity": 0.3 },
      });
      map.addLayer({
        id: "shape-line",
        type: "line",
        source: "shape",
        paint: { "line-color": ink, "line-width": 2 },
      });
      // a shape much smaller than the view is a speck, so the place is also
      // marked by a point at its anchor
      map.addSource("anchor", {
        type: "geojson",
        data: { type: "Point", coordinates: [at.lon, at.lat] },
      });
      map.addLayer({
        id: "anchor-dot",
        type: "circle",
        source: "anchor",
        paint: {
          "circle-radius": 5,
          "circle-color": ink,
          "circle-stroke-color": ground,
          "circle-stroke-width": 2,
        },
      });
      if (geometry.type !== "Point") {
        const [minLon, minLat, maxLon, maxLat] = geometryBbox(geometry);
        const fitted = map.cameraForBounds(
          [
            [minLon, minLat],
            [maxLon, maxLat],
          ],
          { padding: FIT_PADDING },
        );
        if (fitted?.center && fitted.zoom !== undefined && fitted.zoom < COUNTRY_ZOOM) {
          map.jumpTo({ center: fitted.center, zoom: fitted.zoom });
        }
      }
    });
    return () => map.remove();
  }, [geometry, ink, ground]);

  return <StyledMiniMap ref={container} />;
};
