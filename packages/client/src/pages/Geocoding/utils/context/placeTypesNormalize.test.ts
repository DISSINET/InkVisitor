import { defaultPlaceTypes, normalizePlaceTypes } from "@inkvisitor/shared/types/geocoding";
import { describe, expect, it } from "vitest";

describe("normalizePlaceTypes", () => {
  it("starts a project from the engine's twelve, each answering to its own", () => {
    const kinds = normalizePlaceTypes(undefined);
    expect(kinds).toHaveLength(12);
    expect(kinds.every((one) => one.engineType === one.id && one.favorite && !one.conceptId)).toBe(true);
  });

  it("keeps a stored list as it is, an empty one included", () => {
    expect(normalizePlaceTypes([])).toEqual([]);
  });

  it("carries the Concepts of the map a row held before the list existed", () => {
    const kinds = normalizePlaceTypes({ settlement: "C1", lake: "C2", volcano: "C3" });
    expect(kinds.find((one) => one.id === "settlement")?.conceptId).toBe("C1");
    expect(kinds.find((one) => one.id === "lake")?.conceptId).toBe("C2");
    // a key the engine no longer has is dropped rather than invented as a kind
    expect(kinds.some((one) => one.id === "volcano")).toBe(false);
  });

  it("repairs a stored entry with missing fields rather than failing on it", () => {
    const [kind] = normalizePlaceTypes([{ id: "x", engineType: "not-an-engine-type" }]);
    expect(kind).toEqual({
      id: "x",
      name: "x",
      description: "",
      icon: "unknown",
      conceptId: "",
      engineType: null,
      favorite: false,
    });
  });

  it("drops entries that are not objects with an id", () => {
    expect(normalizePlaceTypes([null, "x", { name: "no id" }, { id: "ok" }]).map((one) => one.id)).toEqual(["ok"]);
  });

  it("gives defaults that do not alias one another across calls", () => {
    const first = defaultPlaceTypes();
    first[0].name = "changed";
    expect(defaultPlaceTypes()[0].name).not.toBe("changed");
  });
});
