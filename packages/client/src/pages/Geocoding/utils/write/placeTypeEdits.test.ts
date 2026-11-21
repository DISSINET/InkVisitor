import { IGeocodingPlaceType, defaultPlaceTypes } from "@inkvisitor/shared/types/geocoding";
import { describe, expect, it } from "vitest";
import { assignConcept, kindsForEngineType, makeFavorite, pairEngineType } from "./placeTypeEdits";
import { expandPlaceTypes } from "../context/placeTypeHierarchy";

const kind = (id: string, over: Partial<IGeocodingPlaceType> = {}): IGeocodingPlaceType => ({
  ...defaultPlaceTypes()[0],
  id,
  name: id,
  conceptId: "",
  engineType: null,
  favorite: false,
  inactive: [],
  ...over,
});

describe("assignConcept", () => {
  it("moves a Concept another kind holds, so one Concept never stands for two kinds", () => {
    const next = assignConcept([kind("a", { conceptId: "C1" }), kind("b")], "b", "C1");
    expect(next.map((one) => one.conceptId)).toEqual(["", "C1"]);
  });

  it("unlinks without touching the others", () => {
    const next = assignConcept(
      [kind("a", { conceptId: "C1" }), kind("b", { conceptId: "C2" })],
      "a",
      null,
    );
    expect(next.map((one) => one.conceptId)).toEqual(["", "C2"]);
  });

  it("leaves the list it was given alone", () => {
    const list = [kind("a", { conceptId: "C1" }), kind("b")];
    assignConcept(list, "b", "C1");
    expect(list[0].conceptId).toBe("C1");
  });
});

describe("pairEngineType", () => {
  it("makes the first kind to answer to a gazetteer location type its favourite", () => {
    const next = pairEngineType([kind("a")], "a", "religious");
    expect(next[0]).toMatchObject({ engineType: "religious", favorite: true });
  });

  it("does not take the star from the kind that already has it", () => {
    const list = [kind("a", { engineType: "religious", favorite: true }), kind("b")];
    const next = pairEngineType(list, "b", "religious");
    expect(next.map((one) => one.favorite)).toEqual([true, false]);
  });

  it("drops the star with the gazetteer location type", () => {
    const next = pairEngineType([kind("a", { engineType: "religious", favorite: true })], "a", null);
    expect(next[0]).toMatchObject({ engineType: null, favorite: false });
  });
});

describe("makeFavorite", () => {
  it("moves the star to the chosen kind and leaves other gazetteer location types alone", () => {
    const list = [
      kind("a", { engineType: "religious", favorite: true }),
      kind("b", { engineType: "religious" }),
      kind("c", { engineType: "river", favorite: true }),
    ];
    expect(makeFavorite(list, "b").map((one) => one.favorite)).toEqual([false, true, true]);
  });

  it("does nothing for a kind with no gazetteer location type, which has nothing to be favourite of", () => {
    const list = [kind("a")];
    expect(makeFavorite(list, "a")).toBe(list);
  });
});

describe("kindsForEngineType", () => {
  it("lists the kinds that answer to it, the favourite first", () => {
    const list = [
      kind("a", { engineType: "religious" }),
      kind("b", { engineType: "religious", favorite: true }),
      kind("c", { engineType: "river" }),
    ];
    expect(kindsForEngineType(list, "religious").map((one) => one.id)).toEqual(["b", "a"]);
  });

  it("is empty for no gazetteer location type and for one no kind answers to", () => {
    expect(kindsForEngineType([kind("a", { engineType: "river" })], null)).toEqual([]);
    expect(kindsForEngineType([kind("a", { engineType: "river" })], "lake")).toEqual([]);
  });
});

describe("location types with subclass trees", () => {
  const tree = {
    "c-path": {
      nodes: [
        { id: "c-path", parents: [] },
        { id: "c-road", parents: ["c-path"] },
      ],
      aliases: {},
    },
  };

  it("points a gazetteer type at the location types the project set up, not at the subclasses that share it", () => {
    const nodes = expandPlaceTypes(
      [kind("ways", { conceptId: "c-path", engineType: "road", favorite: true })],
      tree,
      { "c-road": { label: "road", detail: "" } }
    );
    expect(nodes).toHaveLength(2);
    expect(kindsForEngineType(nodes, "road").map((one) => one.id)).toEqual(["ways"]);
  });

  it("does not point a gazetteer type at a location type whose own Concept is deactivated", () => {
    const off = kind("ways", {
      conceptId: "c-path",
      engineType: "road",
      favorite: true,
      inactive: ["c-path"],
    });
    expect(kindsForEngineType([off], "road")).toEqual([]);
  });

  it("forgets what was deactivated when the location type is given another Concept, whose tree it was not", () => {
    const kinds = [kind("ways", { conceptId: "c-path", inactive: ["c-road"] })];
    expect(assignConcept(kinds, "ways", "c-street")[0].inactive).toEqual([]);
    expect(assignConcept(kinds, "ways", "c-path")[0].inactive).toEqual(["c-road"]);
  });
});
