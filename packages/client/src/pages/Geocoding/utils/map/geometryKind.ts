import { GeoJsonGeometry, GeoJsonGeometryType, geometryAnchor, geometryBbox } from "@inkvisitor/shared/types/geometry";
import {
  IcoGeomLine,
  IcoGeomMultiLine,
  IcoGeomMultiPoint,
  IcoGeomMultiPolygon,
  IcoGeomPoint,
  IcoGeomPolygon,
} from "Theme/icons";
import React from "react";

/** What each GeoJSON type is called and drawn as wherever a geometry is tagged. */
export const GEOMETRY_KIND: Record<
  GeoJsonGeometryType,
  { label: string; icon: React.ComponentType }
> = {
  Point: { label: "point", icon: IcoGeomPoint },
  MultiPoint: { label: "several points", icon: IcoGeomMultiPoint },
  LineString: { label: "line", icon: IcoGeomLine },
  MultiLineString: { label: "several lines", icon: IcoGeomMultiLine },
  Polygon: { label: "area", icon: IcoGeomPolygon },
  MultiPolygon: { label: "several areas", icon: IcoGeomMultiPolygon },
};

/** Latitude then longitude, the way the page says it everywhere. */
export const coordinateText = (lat: number, lon: number): string =>
  `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

/** The one position a geometry is reported at, and the box around it where it has one. */
export const describeGeometry = (
  geometry: GeoJsonGeometry,
): { anchor: string; extent: string | null } => {
  const at = geometryAnchor(geometry);
  if (geometry.type === "Point") {
    return { anchor: coordinateText(at.lat, at.lon), extent: null };
  }
  const [minLon, minLat, maxLon, maxLat] = geometryBbox(geometry);
  return {
    anchor: coordinateText(at.lat, at.lon),
    extent: `${coordinateText(minLat, minLon)} → ${coordinateText(maxLat, maxLon)}`,
  };
};
