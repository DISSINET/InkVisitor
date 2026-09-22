/**
 * Which of a vector basemap's own layers each switch in the panel controls.
 *
 * Read from the OpenMapTiles schema — every layer names the source layer it
 * draws from — and never from the style's own layer names. `transportation` and
 * `landcover` belong to the schema and are shared by every style built on it;
 * `road_motorway_link_casing` belongs to one style and is exactly the kind of
 * name a restyle changes.
 *
 * A style on another schema still loads and draws. It simply leaves these groups
 * empty, which is why the map warns rather than failing.
 */

/** The parts of the basemap a researcher can switch off. */
export type BasemapGroup = "transportation" | "citiesAndPoi" | "land";

export const BASEMAP_GROUPS: { id: BasemapGroup; title: string; note: string }[] = [
  {
    id: "transportation",
    title: "transport",
    note: "roads, railways, paths, airports and their names",
  },
  {
    id: "citiesAndPoi",
    title: "built-up detail",
    note: "buildings, parks and points of interest",
  },
  { id: "land", title: "land cover & use", note: "woodland, grass, sand, ice, built-up areas" },
];

const GROUP_SOURCE_LAYERS: Record<BasemapGroup, string[]> = {
  transportation: ["transportation", "transportation_name", "aeroway", "aerodrome_label"],
  citiesAndPoi: ["park", "building", "poi"],
  land: ["landuse", "landcover"],
};

/**
 * What the basemap always draws, with no switch offered.
 *
 * These are the things the page is for. Deciding whether a suggested place is
 * the right one is deciding it against a border, a river, a name and the shape
 * of the ground — so none of them is a preference, and a switch that could
 * remove them would only ever be a way to break the page quietly.
 *
 * Listed rather than inferred so that a reader can see what the switches
 * deliberately do not reach: `place`, `boundary`, `water`, `waterway`,
 * `water_name`, and the shaded relief, which is a raster layer with no source
 * layer at all.
 */
export const ALWAYS_DRAWN_SOURCE_LAYERS = [
  "place",
  "boundary",
  "water",
  "waterway",
  "water_name",
];

export interface BasemapLayer {
  id: string;
  group: BasemapGroup;
}

const groupOf = (sourceLayer: string | undefined): BasemapGroup | null => {
  if (!sourceLayer) {
    return null;
  }
  for (const group of Object.keys(GROUP_SOURCE_LAYERS) as BasemapGroup[]) {
    if (GROUP_SOURCE_LAYERS[group].includes(sourceLayer)) {
      return group;
    }
  }
  return null;
};

/**
 * Every basemap layer a switch controls, paired with its switch.
 *
 * A layer belonging to no group is simply absent, which is what leaves the
 * always-drawn set and anything unrecognised alone. Unrecognised means visible:
 * a style carrying something this does not know about shows it, rather than
 * hiding parts of a map for a reason nobody can see.
 *
 * A fill-extrusion layer is excluded before the source-layer lookup runs, even
 * where its source layer belongs to a group: OpenMapTiles draws its 3D
 * buildings from the same `building` source layer as the flat footprints, so
 * `groupOf` alone would put the extrusion under the same switch as the
 * footprint it is drawn from. Grouping it would let switching that group on
 * put back exactly what `neverDrawnLayerIds` hides.
 */
export const groupedLayersOf = (
  layers: { id: string; type: string; "source-layer"?: string }[],
): BasemapLayer[] =>
  layers
    .filter((layer) => layer.type !== "fill-extrusion")
    .map((layer) => ({ id: layer.id, group: groupOf(layer["source-layer"]) }))
    .filter((entry): entry is BasemapLayer => entry.group !== null);

/**
 * Layers this page never draws, whatever the switches say.
 *
 * Extruded buildings are a 3D reading of a map that is being used flat, to
 * compare a point against a border and a name. They also draw over everything
 * this page puts on the map, which is the part that makes them a refusal rather
 * than a preference. `groupedLayersOf` excludes the same layers by the same
 * type check, so a switch can never set one back to visible.
 */
export const neverDrawnLayerIds = (layers: { id: string; type: string }[]): string[] =>
  layers.filter((layer) => layer.type === "fill-extrusion").map((layer) => layer.id);
