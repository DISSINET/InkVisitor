import { GeoJsonGeometry } from "@inkvisitor/shared/types/geometry";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  TerraDraw,
  TerraDrawLineStringMode,
  TerraDrawPointMode,
  TerraDrawPolygonMode,
  TerraDrawSelectMode,
  type GeoJSONStoreFeatures,
} from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import {
  DrawKind,
  DrawnShape,
  DraftResult,
  draftToGeometry,
  geometryToShapes,
} from "../utils/map/geometryDraft";

/**
 * Drawing a geometry on the map, so a researcher is not limited to the points
 * the suggesters offer.
 *
 * The drawing tool owns its own sources and layers on the map and loses them
 * whenever the basemap style is swapped, so the instance is rebuilt on every
 * style load and the shapes drawn so far are put back from a copy held here.
 */

export type DrawTool = DrawKind | "select";

const SHAPE_KINDS: DrawKind[] = ["point", "linestring", "polygon"];

const GEOMETRY_OF: Record<DrawKind, string> = {
  point: "Point",
  linestring: "LineString",
  polygon: "Polygon",
};

/**
 * The finished shapes in a feature set, without the tool's own guides.
 *
 * A shape is a feature whose geometry is the kind its mode draws: the closing
 * points of a polygon being drawn, its snapping and coordinate points and a
 * selection's handles are all Points carrying a shape's mode, so only the
 * geometry type tells a finished point from a guide. A shape still being drawn
 * has no final geometry yet either.
 */
export const shapesOf = (features: GeoJSONStoreFeatures[]): DrawnShape[] =>
  features
    .filter((feature) => {
      const mode = feature.properties?.mode as DrawKind | undefined;
      return (
        !!mode &&
        SHAPE_KINDS.includes(mode) &&
        feature.geometry?.type === GEOMETRY_OF[mode] &&
        !feature.properties?.currentlyDrawing &&
        !feature.properties?.closingPoint &&
        !feature.properties?.snappingPoint &&
        !feature.properties?.coordinatePoint
      );
    })
    .map((feature) => ({
      mode: feature.properties.mode as DrawKind,
      coordinates: (feature.geometry as { coordinates: unknown }).coordinates,
    }));

const asFeature = (shape: DrawnShape): GeoJSONStoreFeatures =>
  ({
    type: "Feature",
    geometry: {
      type: shape.mode === "point" ? "Point" : shape.mode === "linestring" ? "LineString" : "Polygon",
      coordinates: shape.coordinates,
    },
    properties: { mode: shape.mode },
  }) as GeoJSONStoreFeatures;

/** Editing handles: move a shape, move and add corners, delete a corner. */
const EDITABLE = {
  feature: {
    draggable: true,
    coordinates: { midpoints: true, draggable: true, deletable: true },
  },
};

export interface UseGeometryDraw {
  /** The tool that is armed, or null while the toolbar is open with nothing armed. */
  tool: DrawTool | null;
  setTool: (tool: DrawTool | null) => void;
  /** How many finished shapes there are. */
  count: number;
  /** The one geometry the shapes make, or why they do not make one. */
  build: () => DraftResult;
  /** Removes every shape. */
  clear: () => void;
  /**
   * Replaces whatever is drawn with a stored geometry, ready to be edited.
   * False where the drawing tool refuses the shape — a polygon with holes.
   */
  load: (geometry: GeoJsonGeometry) => boolean;
}

export const useGeometryDraw = (
  mapRef: React.MutableRefObject<MapLibreMap | null>,
  styleEpoch: number,
  active: boolean,
): UseGeometryDraw => {
  const drawRef = useRef<TerraDraw | null>(null);
  /** The shapes between style loads, and until the instance has started. */
  const kept = useRef<DrawnShape[]>([]);
  const [tool, setToolState] = useState<DrawTool | null>(null);
  const toolRef = useRef<DrawTool | null>(null);
  const [count, setCount] = useState(0);

  const sync = useCallback(() => {
    const draw = drawRef.current;
    if (!draw) {
      return;
    }
    kept.current = shapesOf(draw.getSnapshot());
    setCount(kept.current.length);
  }, []);

  const applyTool = useCallback((next: DrawTool | null) => {
    toolRef.current = next;
    setToolState(next);
    const draw = drawRef.current;
    if (draw?.enabled) {
      // "static" is the library's own mode that responds to nothing
      draw.setMode(next ?? "static");
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    // the drawing tool adds its layers to the style, so it waits for one
    if (!map || !active || styleEpoch === 0) {
      return;
    }
    let draw: TerraDraw | undefined;
    try {
      draw = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map }),
        modes: [
          new TerraDrawPointMode(),
          new TerraDrawLineStringMode(),
          new TerraDrawPolygonMode(),
          new TerraDrawSelectMode({
            flags: {
              point: { feature: { draggable: true } },
              linestring: EDITABLE,
              polygon: EDITABLE,
            },
          }),
        ],
      });
      draw.start();
    } catch (error) {
      // the map is mid-swap; the next style load tries again. A half-started
      // instance has already attached its listeners, so it is stopped
      console.error("[geocoding draw]", error);
      try {
        draw?.stop();
      } catch {
        /* nothing was registered to remove */
      }
      return;
    }
    drawRef.current = draw;
    if (kept.current.length) {
      draw.addFeatures(kept.current.map(asFeature));
    }
    draw.on("change", sync);
    draw.on("finish", sync);
    draw.setMode(toolRef.current ?? "static");
    sync();

    return () => {
      kept.current = shapesOf(draw.getSnapshot());
      drawRef.current = null;
      try {
        draw.stop();
      } catch {
        // stopping against a style that is already gone has nothing left to remove
      }
      // a stop in the middle of a drag leaves panning off, and the next instance
      // would record that as the state to restore
      try {
        map.dragPan.enable();
        map.dragRotate.enable();
      } catch {
        // the map has already been removed
      }
    };
  }, [mapRef, styleEpoch, active, sync]);

  // closing the toolbar discards what was drawn, so the next opening starts clean
  useEffect(() => {
    if (!active) {
      return;
    }
    return () => {
      kept.current = [];
      toolRef.current = null;
      setToolState(null);
      setCount(0);
    };
  }, [active]);

  const build = useCallback(
    () => draftToGeometry(drawRef.current ? shapesOf(drawRef.current.getSnapshot()) : kept.current),
    [],
  );

  const clear = useCallback(() => {
    kept.current = [];
    drawRef.current?.clear();
    setCount(0);
  }, []);

  const load = useCallback(
    (geometry: GeoJsonGeometry): boolean => {
      const shapes = geometryToShapes(geometry);
      const draw = drawRef.current;
      draw?.clear();
      kept.current = [];
      setCount(0);
      if (draw) {
        const checked = draw.addFeatures(shapes.map(asFeature));
        if (checked.some((result) => !result.valid)) {
          draw.clear();
          return false;
        }
        sync();
      } else {
        kept.current = shapes;
        setCount(shapes.length);
      }
      applyTool("select");
      return true;
    },
    [applyTool, sync],
  );

  return { tool, setTool: applyTool, count, build, clear, load };
};
