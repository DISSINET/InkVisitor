import { IConceptTree, IResponseClassifiedUnder } from "@inkvisitor/shared/types";
import { IGeocodingPlaceType, defaultPlaceTypes } from "@inkvisitor/shared/types/geocoding";
import { describe, expect, it } from "vitest";
import {
  TypeConcept,
  childrenOf,
  deriveTypeEntries,
  entryApplies,
  expandPlaceTypes,
  nodeIdOf,
} from "./placeTypeHierarchy";

/**
 * The example a researcher gave: a path is a road, a pavement or a street, a
 * road is a highway or a regional road, and the highway goes on down to a toll
 * motorway, five levels in all. An alley is a street, and a lane is a synonym
 * of an alley.
 */
const root = (
  id: string,
  conceptId: string,
  over: Partial<IGeocodingPlaceType> = {}
): IGeocodingPlaceType => ({
  ...defaultPlaceTypes()[8],
  id,
  name: id,
  conceptId,
  icon: "road",
  engineType: "road",
  favorite: true,
  inactive: [],
  ...over,
});

const pathTree: IConceptTree = {
  nodes: [
    { id: "path", parents: [] },
    { id: "road", parents: ["path"] },
    { id: "street", parents: ["path"] },
    { id: "pavement", parents: ["path"] },
    { id: "highway", parents: ["road"] },
    { id: "regional", parents: ["road"] },
    { id: "alley", parents: ["street"] },
    { id: "motorway", parents: ["highway"] },
    { id: "toll motorway", parents: ["motorway"] },
  ],
  aliases: { lane: "alley" },
};

const concepts: Record<string, TypeConcept> = Object.fromEntries(
  [
    "path",
    "road",
    "street",
    "pavement",
    "highway",
    "regional",
    "alley",
    "motorway",
    "toll motorway",
    "settlement",
    "city",
    "walled city",
  ].map((id) => [id, { label: id, detail: `about ${id}` }])
);

const paths = root("ways", "path");

describe("expandPlaceTypes", () => {
  it("lists a location type and every subclass below it, depth first, each level by label", () => {
    const nodes = expandPlaceTypes([paths], { path: pathTree }, concepts);
    expect(nodes.map((node) => [node.name, node.depth])).toEqual([
      ["path", 0],
      ["pavement", 1],
      ["road", 1],
      ["highway", 2],
      ["motorway", 3],
      ["toll motorway", 4],
      ["regional", 2],
      ["street", 1],
      ["alley", 2],
    ]);
  });

  it("keeps the root's own id and gives every subclass an id from the root and its Concept", () => {
    const nodes = expandPlaceTypes([paths], { path: pathTree }, concepts);
    expect(nodes[0].id).toBe("ways");
    const highway = nodes.find((node) => node.conceptId === "highway")!;
    expect(highway.id).toBe(nodeIdOf("ways", "highway"));
    expect(highway.parentIds).toEqual([nodeIdOf("ways", "road")]);
    expect(nodes.find((node) => node.conceptId === "road")!.parentIds).toEqual(["ways"]);
  });

  it("gives a subclass the mark and gazetteer location type of its root, and no star of its own", () => {
    const nodes = expandPlaceTypes([paths], { path: pathTree }, concepts);
    const motorway = nodes.find((node) => node.conceptId === "motorway")!;
    expect(motorway).toMatchObject({
      icon: "road",
      engineType: "road",
      favorite: false,
      rootId: "ways",
    });
    expect(nodes[0].favorite).toBe(true);
  });

  it("takes the description from the Concept's detail", () => {
    const nodes = expandPlaceTypes([paths], { path: pathTree }, concepts);
    expect(nodes.find((node) => node.conceptId === "regional")!.description).toBe("about regional");
    expect(nodes[0].description).toBe("about path");
  });

  it("marks the Concepts the project deactivated, at any level, root included", () => {
    const nodes = expandPlaceTypes(
      [{ ...paths, inactive: ["road", "path"] }],
      { path: pathTree },
      concepts
    );
    const active = Object.fromEntries(nodes.map((node) => [node.conceptId, node.active]));
    expect(active).toMatchObject({ path: false, road: false, highway: true, street: true });
  });

  it("lists a subclass of two superclasses once, with both as its parents", () => {
    const tree: IConceptTree = {
      nodes: [...pathTree.nodes, { id: "lane way", parents: ["alley", "road"] }],
      aliases: {},
    };
    const nodes = expandPlaceTypes(
      [paths],
      { path: tree },
      { ...concepts, "lane way": { label: "lane way", detail: "" } }
    );
    const both = nodes.filter((node) => node.conceptId === "lane way");
    expect(both).toHaveLength(1);
    expect(both[0].parentIds.sort()).toEqual(
      [nodeIdOf("ways", "alley"), nodeIdOf("ways", "road")].sort()
    );
    expect(
      childrenOf(nodes)
        .get(nodeIdOf("ways", "road"))!
        .map((node) => node.conceptId)
    ).toContain("lane way");
    expect(
      childrenOf(nodes)
        .get(nodeIdOf("ways", "alley"))!
        .map((node) => node.conceptId)
    ).toContain("lane way");
    // sorted by name under every parent, the second one included
    const underRoad = childrenOf(nodes)
      .get(nodeIdOf("ways", "road"))!
      .map((node) => node.name);
    expect(underRoad).toEqual(["highway", "lane way", "regional"]);
  });

  it("leaves another location type's own Concept, and what lies below only through it, out of a tree", () => {
    const settlements = root("settlement", "settlement");
    const cities = root("city", "city");
    const tree: IConceptTree = {
      nodes: [
        { id: "settlement", parents: [] },
        { id: "city", parents: ["settlement"] },
        { id: "walled city", parents: ["city"] },
      ],
      aliases: {},
    };
    const nodes = expandPlaceTypes(
      [settlements, cities],
      {
        settlement: tree,
        city: {
          nodes: [
            { id: "city", parents: [] },
            { id: "walled city", parents: ["city"] },
          ],
          aliases: {},
        },
      },
      concepts
    );
    expect(
      nodes.filter((node) => node.rootId === "settlement").map((node) => node.conceptId)
    ).toEqual(["settlement"]);
    expect(nodes.filter((node) => node.rootId === "city").map((node) => node.conceptId)).toEqual([
      "city",
      "walled city",
    ]);
  });

  it("calls a location type by its Concept's label, and by its stored name only until it has one", () => {
    expect(expandPlaceTypes([paths], { path: pathTree }, concepts)[0].name).toBe("path");
    // the label not in yet, or no Concept at all
    expect(expandPlaceTypes([paths], {}, {})[0].name).toBe("ways");
    expect(expandPlaceTypes([root("empty", "")], {}, concepts)[0].name).toBe("empty");
  });

  it("gives a location type without a Concept, or whose tree is not in yet, no subclasses", () => {
    const nodes = expandPlaceTypes([root("empty", ""), paths], {}, concepts);
    expect(nodes.map((node) => node.id)).toEqual(["empty", "ways"]);
  });
});

/** The server's answer for the ways tree: the entry per root, and every Concept each entity is classified under. */
const answer = (
  classifiedAs: Record<string, string[]>,
  shadowed: Record<string, boolean> = {}
): IResponseClassifiedUnder => ({
  entities: Object.fromEntries(
    Object.entries(classifiedAs).map(([entity, vias]) => [
      entity,
      [
        {
          concept: "path",
          via: vias[0],
          inferred: !vias.includes("path"),
          shadowed: !!shadowed[entity],
        },
      ],
    ])
  ),
  truncated: [],
  trees: { path: pathTree },
  classifiedAs,
});

describe("deriveTypeEntries", () => {
  const nodes = expandPlaceTypes([paths], { path: pathTree }, concepts);
  const id = (conceptId: string) => (conceptId === "path" ? "ways" : nodeIdOf("ways", conceptId));
  const shown = (
    entries = [] as ReturnType<typeof deriveTypeEntries> extends Map<string, infer E> ? E : never
  ) => entries.filter((entry) => !entry.shadowed).map((entry) => entry.typeId);
  const applying = (
    entries = [] as ReturnType<typeof deriveTypeEntries> extends Map<string, infer E> ? E : never
  ) =>
    entries
      .filter(entryApplies)
      .map((entry) => entry.typeId)
      .sort();

  it("reads a Location classified five levels down as that Concept, and as every one above it", () => {
    const entries = deriveTypeEntries(nodes, answer({ L: ["toll motorway"] })).get("L")!;
    expect(shown(entries)).toEqual([id("toll motorway")]);
    expect(entries[0]).toMatchObject({ inferred: false, via: "toll motorway", shadowed: false });
    expect(applying(entries)).toEqual(
      ["path", "road", "highway", "motorway", "toll motorway"].map(id).sort()
    );
  });

  it("shows only the deeper of two Concepts on one line, and counts the Location under both", () => {
    const entries = deriveTypeEntries(nodes, answer({ L: ["highway", "road"] })).get("L")!;
    expect(shown(entries)).toEqual([id("highway")]);
    const road = entries.find((entry) => entry.typeId === id("road"))!;
    expect(road).toMatchObject({ inferred: false, shadowed: true, underNode: true });
  });

  it("shows both Concepts of a Location on two branches", () => {
    const entries = deriveTypeEntries(nodes, answer({ L: ["pavement", "motorway"] })).get("L")!;
    expect(shown(entries).sort()).toEqual([id("motorway"), id("pavement")].sort());
  });

  it("reads a Location classified under a synonym as the Concept it stands beside, inferred", () => {
    const entries = deriveTypeEntries(nodes, answer({ L: ["lane"] })).get("L")!;
    expect(entries[0]).toMatchObject({
      typeId: id("alley"),
      inferred: true,
      via: "lane",
      shadowed: false,
    });
  });

  it("reads a Location classified under a Concept and its synonym as classified under the Concept", () => {
    // the server lists Concepts sorted, so the synonym "lane" comes after "alley"
    // here; listed first, it must still not win
    const entries = deriveTypeEntries(nodes, answer({ L: ["lane", "alley"] })).get("L")!;
    expect(entries[0]).toMatchObject({ typeId: id("alley"), inferred: false, via: "alley" });
  });

  it("still reads a Location as a Concept the project deactivated", () => {
    const off = expandPlaceTypes([{ ...paths, inactive: ["road"] }], { path: pathTree }, concepts);
    expect(shown(deriveTypeEntries(off, answer({ L: ["road"] })).get("L")!)).toEqual([id("road")]);
  });

  it("hides and does not count the whole tree where another location type shadows its root", () => {
    const entries = deriveTypeEntries(nodes, answer({ L: ["highway"] }, { L: true })).get("L")!;
    expect(shown(entries)).toEqual([]);
    expect(applying(entries)).toEqual([]);
  });

  it("reads the Location as the root, as the server does, where the tree is not in the answer", () => {
    const entries = deriveTypeEntries(nodes, { ...answer({ L: ["highway"] }), trees: {} }).get(
      "L"
    )!;
    expect(entries).toEqual([
      { typeId: "ways", inferred: true, via: "highway", shadowed: false, underNode: false },
    ]);
  });
});
