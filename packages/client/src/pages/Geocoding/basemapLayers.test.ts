import { describe, expect, it } from "vitest";
import libertyLayers from "./__fixtures__/libertyLayers.json";
import {
  ALWAYS_DRAWN_SOURCE_LAYERS,
  BASEMAP_GROUPS,
  BasemapGroup,
  FLAT_BUILDING_LAYER_ID,
  flatBuildingLayerFor,
  groupedLayersOf,
  neverDrawnLayerIds,
} from "./basemapLayers";

/**
 * The fixture is every layer of the OpenFreeMap Liberty style as it was served,
 * trimmed to the three fields the grouping reads. Tested against the real style
 * rather than an invented one because the value of this code is precisely that
 * it survives what a style actually contains — a fixture written to match the
 * implementation would pass while the live style broke it.
 */
const layers = libertyLayers as {
  id: string;
  type: string;
  "source-layer"?: string;
  filter?: unknown;
}[];

const idsIn = (group: BasemapGroup) =>
  groupedLayersOf(layers)
    .filter((layer) => layer.group === group)
    .map((layer) => layer.id);

describe("groupedLayersOf", () => {
  it("puts roads, railways, paths, airports and their names under transport", () => {
    const ids = idsIn("transportation");
    // 61 transportation + 6 transportation_name + 3 aeroway + 1 aerodrome_label
    expect(ids).toHaveLength(71);
    expect(ids).toEqual(
      expect.arrayContaining([
        "road_motorway",
        "tunnel_major_rail",
        "bridge_path_pedestrian",
        "highway-name-major",
        "aeroway_runway",
        "airport",
      ]),
    );
  });

  it("puts building footprints under buildings and nothing else there", () => {
    expect(idsIn("buildings")).toEqual(["building"]);
  });

  it("puts points of interest under their own group", () => {
    const ids = idsIn("poi");
    expect(ids).toEqual(expect.arrayContaining(["poi_r1", "poi_transit"]));
    expect(ids).not.toContain("building");
  });

  it("splits the one landuse source layer by class: housing is built-up ground, a cemetery is land use", () => {
    expect(idsIn("builtUp")).toEqual(["landuse_residential"]);
    expect(idsIn("land")).not.toContain("landuse_residential");
    expect(idsIn("land")).toEqual(expect.arrayContaining(["landuse_cemetery", "landuse_school"]));
  });

  it("leaves a landuse layer it cannot read the class of in land use", () => {
    const unfiltered = [{ id: "landuse_x", type: "fill", "source-layer": "landuse" }];
    expect(groupedLayersOf(unfiltered)).toEqual([{ id: "landuse_x", group: "land" }]);
  });

  it("puts land cover, land use and parks under land", () => {
    const ids = idsIn("land");
    expect(ids).toEqual(
      expect.arrayContaining([
        "park",
        "park_outline",
        "landcover_wood",
        "landcover_ice",
        "landuse_cemetery",
      ]),
    );
  });

  /**
   * The switches exist to quiet the map, never to remove what the page is for.
   * A regrouping that swept one of these into a switch would let a researcher
   * turn off the border, river or name they are judging the place against, and
   * the map would look intact while answering a different question.
   */
  it("leaves borders, place names, water and relief outside every switch", () => {
    const grouped = new Set(groupedLayersOf(layers).map((layer) => layer.id));
    const untouchable = layers.filter(
      (layer) =>
        ALWAYS_DRAWN_SOURCE_LAYERS.includes(layer["source-layer"] ?? "") ||
        layer.type === "raster" ||
        layer.type === "background",
    );
    expect(untouchable.length).toBeGreaterThan(15);
    for (const layer of untouchable) {
      expect(grouped.has(layer.id), `${layer.id} must not be switchable`).toBe(false);
    }
  });

  it("names every group the panel offers, and no others", () => {
    const used = new Set(groupedLayersOf(layers).map((layer) => layer.group));
    expect([...used].sort()).toEqual(BASEMAP_GROUPS.map((group) => group.id).sort());
  });

  it("puts each layer in at most one group", () => {
    const ids = groupedLayersOf(layers).map((layer) => layer.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /**
   * Unrecognised means visible. A style carrying something this does not know
   * about draws it, rather than hiding part of a map for a reason no switch
   * explains.
   */
  it("ignores a source layer it does not know", () => {
    const unknown = [{ id: "contours", type: "line", "source-layer": "contour" }];
    expect(groupedLayersOf(unknown)).toEqual([]);
  });

  it("ignores a layer with no source layer at all", () => {
    expect(groupedLayersOf([{ id: "background", type: "background" }])).toEqual([]);
  });
});

describe("neverDrawnLayerIds", () => {
  it("finds the style's extruded buildings", () => {
    expect(neverDrawnLayerIds(layers)).toEqual(["building-3d"]);
  });

  it("leaves the flat building fill alone, which the buildings switch owns", () => {
    expect(neverDrawnLayerIds(layers)).not.toContain("building");
    expect(idsIn("buildings")).toContain("building");
  });

  /**
   * The regression this guards: `building-3d` shares the `building` source
   * layer with the flat footprint the buildings switch owns, so a grouping that
   * read only the source layer would put the extrusion under that switch too.
   * Turning the switch on would then set the very layer `neverDrawnLayerIds`
   * hides back to visible.
   */
  it("never lets a layer neverDrawnLayerIds hides turn up in a group", () => {
    const hidden = new Set(neverDrawnLayerIds(layers));
    const grouped = groupedLayersOf(layers);
    for (const layer of grouped) {
      expect(hidden.has(layer.id), `${layer.id} must not be both grouped and never-drawn`).toBe(
        false,
      );
    }
  });
});

describe("flatBuildingLayerFor", () => {
  const style = [
    { id: "water", type: "fill", source: "openmaptiles", "source-layer": "water" },
    {
      id: "building",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "building",
      maxzoom: 14,
      paint: { "fill-color": "hsl(35,8%,85%)" },
    },
    { id: "building-3d", type: "fill-extrusion", "source-layer": "building", maxzoom: undefined },
  ];

  it("continues the flat fill from the zoom it stops at, under the extrusion", () => {
    const added = flatBuildingLayerFor(style);
    expect(added?.layer).toMatchObject({
      id: FLAT_BUILDING_LAYER_ID,
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 14,
      paint: { "fill-color": "hsl(35,8%,85%)" },
    });
    expect(added?.beforeId).toBe("building-3d");
  });

  it("is grouped with the flat fill it continues, so the buildings switch owns it", () => {
    const added = flatBuildingLayerFor(style);
    const withIt = [...style, { ...added!.layer, id: FLAT_BUILDING_LAYER_ID }] as {
      id: string;
      type: string;
      "source-layer"?: string;
    }[];
    expect(groupedLayersOf(withIt).find((l) => l.id === FLAT_BUILDING_LAYER_ID)?.group).toBe(
      "buildings",
    );
  });

  it("adds nothing twice, and nothing to a style with no bounded flat fill", () => {
    const added = flatBuildingLayerFor(style)!;
    expect(
      flatBuildingLayerFor([...style, { id: FLAT_BUILDING_LAYER_ID, type: "fill" }]),
    ).toBeNull();
    expect(added).not.toBeNull();
    expect(flatBuildingLayerFor([{ id: "building", type: "fill", "source-layer": "building" }])).toBeNull();
    expect(flatBuildingLayerFor([])).toBeNull();
  });
});
