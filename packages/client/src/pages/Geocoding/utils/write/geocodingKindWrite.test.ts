import { RelationEnums } from "@inkvisitor/shared/enums";
import { Relation } from "@inkvisitor/shared/types";
import { IGeocodingPlaceType, defaultPlaceTypes } from "@inkvisitor/shared/types/geocoding";
import { describe, expect, it, vi } from "vitest";
import {
  KindGateway,
  executeKindChange,
  executeKindEdit,
  planKindChange,
  planKindEdit,
} from "./geocodingKindWrite";

/**
 * A location type is a Classification from the Location to the type's Concept, and
 * a Location can have several. The cases that matter are the ones that would
 * delete or duplicate something: a Classification under a Concept that is not a
 * location type belongs to someone else, and adding one must not take another
 * away.
 */

const kinds: IGeocodingPlaceType[] = [
  { ...defaultPlaceTypes()[0], conceptId: "C-village" },
  { ...defaultPlaceTypes()[1], conceptId: "C-castle" },
  { ...defaultPlaceTypes()[2], conceptId: "" },
];

const classification = (id: string, subject: string, concept: string): Relation.IRelation => ({
  id,
  type: RelationEnums.Type.Classification,
  entityIds: [subject, concept],
});

describe("planKindChange", () => {
  it("creates a Classification to the location type's Concept for a Location with none", () => {
    const change = planKindChange("L1", kinds, [], "C-village");
    expect(change.creates).toHaveLength(1);
    expect(change.creates[0]).toMatchObject({
      type: RelationEnums.Type.Classification,
      entityIds: ["L1", "C-village"],
    });
    expect(change.removeIds).toEqual([]);
  });

  it("creates nothing where the Location already has the location type", () => {
    const change = planKindChange("L1", kinds, [classification("r1", "L1", "C-village")], "C-village");
    expect(change.creates).toEqual([]);
    expect(change.removeIds).toEqual([]);
  });

  it("adds a location type beside another rather than replacing it", () => {
    const change = planKindChange("L1", kinds, [classification("r1", "L1", "C-castle")], "C-village");
    expect(change.creates.map((one) => one.entityIds)).toEqual([["L1", "C-village"]]);
    expect(change.removeIds).toEqual([]);
  });

  it("removes every location type when told there is none, and creates nothing", () => {
    const change = planKindChange(
      "L1",
      kinds,
      [classification("r1", "L1", "C-castle"), classification("r2", "L1", "C-village")],
      null,
    );
    expect(change.creates).toEqual([]);
    expect(change.removeIds.sort()).toEqual(["r1", "r2"]);
  });

  it("leaves the Location with exactly one when it already has the location type twice", () => {
    const change = planKindChange(
      "L1",
      kinds,
      [classification("r1", "L1", "C-village"), classification("r2", "L1", "C-village")],
      "C-village",
    );
    expect(change.creates).toEqual([]);
    expect(change.removeIds).toEqual(["r2"]);
  });

  it("never classifies under a Concept that no location type uses", () => {
    expect(planKindChange("L1", kinds, [], "C-anything").creates).toEqual([]);
  });
});

describe("planKindEdit", () => {
  const both = [classification("r1", "L1", "C-castle"), classification("r2", "L1", "C-village")];

  it("removes only the Classification of the Concept it is told to", () => {
    const change = planKindEdit("L1", kinds, both, { remove: ["C-castle"] });
    expect(change.removeIds).toEqual(["r1"]);
    expect(change.creates).toEqual([]);
  });

  it("adds and removes in one edit", () => {
    const change = planKindEdit("L1", kinds, [classification("r1", "L1", "C-castle")], {
      add: ["C-village"],
      remove: ["C-castle"],
    });
    expect(change.creates.map((one) => one.entityIds[1])).toEqual(["C-village"]);
    expect(change.removeIds).toEqual(["r1"]);
  });

  it("keeps a Concept it is told both to add and to remove", () => {
    const change = planKindEdit("L1", kinds, both, { add: ["C-castle"], remove: ["C-castle"] });
    expect(change.removeIds).toEqual([]);
    expect(change.creates).toEqual([]);
  });

  it("adds several at once, each once", () => {
    const change = planKindEdit("L1", kinds, [], { add: ["C-castle", "C-village", "C-castle"] });
    expect(change.creates.map((one) => one.entityIds[1])).toEqual(["C-castle", "C-village"]);
  });

  it("never removes a Classification under a Concept that is not a location type", () => {
    const change = planKindEdit(
      "L1",
      kinds,
      [classification("r1", "L1", "C-other"), classification("r2", "L1", "C-castle")],
      { remove: ["C-other"], removeAll: true },
    );
    expect(change.removeIds).toEqual(["r2"]);
  });

  it("never removes a Classification the Location is the object of", () => {
    const change = planKindEdit("L1", kinds, [classification("r1", "L2", "C-castle")], {
      removeAll: true,
    });
    expect(change.removeIds).toEqual([]);
  });

  it("ignores a location type with no Concept, which owns no Classification", () => {
    const change = planKindEdit("L1", kinds, [classification("r1", "L1", "")], { removeAll: true });
    expect(change.removeIds).toEqual([]);
  });
});

describe("executeKindEdit and executeKindChange", () => {
  const gateway = (over: Partial<KindGateway> = {}): KindGateway => ({
    readClassifications: vi.fn().mockResolvedValue([classification("r1", "L1", "C-castle")]),
    createRelation: vi.fn().mockResolvedValue(undefined),
    deleteRelation: vi.fn().mockResolvedValue(undefined),
    ...over,
  });

  it("creates the new Classification before removing the old one", async () => {
    const order: string[] = [];
    const g = gateway({
      createRelation: vi.fn(async () => void order.push("create")),
      deleteRelation: vi.fn(async () => void order.push("delete")),
    });
    const result = await executeKindEdit(
      "L1",
      kinds,
      { add: ["C-village"], remove: ["C-castle"] },
      g,
    );
    expect(result).toEqual({ ok: true, changed: true });
    expect(order).toEqual(["create", "delete"]);
  });

  it("adds a location type without touching the one the Location has", async () => {
    const g = gateway();
    await executeKindChange("L1", kinds, "C-village", g);
    expect(g.createRelation).toHaveBeenCalledTimes(1);
    expect(g.deleteRelation).not.toHaveBeenCalled();
  });

  it("keeps the old location type when creating the new one fails", async () => {
    const g = gateway({ createRelation: vi.fn().mockRejectedValue(new Error("no")) });
    const result = await executeKindEdit("L1", kinds, { add: ["C-village"], remove: ["C-castle"] }, g);
    expect(result.ok).toBe(false);
    expect(g.deleteRelation).not.toHaveBeenCalled();
  });

  it("says the new location type was saved when only removing the old one fails", async () => {
    const g = gateway({ deleteRelation: vi.fn().mockRejectedValue(new Error("no")) });
    const result = await executeKindEdit("L1", kinds, { add: ["C-village"], remove: ["C-castle"] }, g);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toContain("new location type was saved");
  });

  it("says plainly that a removal failed where nothing was added", async () => {
    const g = gateway({ deleteRelation: vi.fn().mockRejectedValue(new Error("no")) });
    const result = await executeKindEdit("L1", kinds, { remove: ["C-castle"] }, g);
    expect(!result.ok && result.reason).toBe("The location type could not be removed.");
  });

  it("writes nothing when the Location already has the location type", async () => {
    const g = gateway({
      readClassifications: vi.fn().mockResolvedValue([classification("r1", "L1", "C-village")]),
    });
    expect(await executeKindChange("L1", kinds, "C-village", g)).toEqual({ ok: true, changed: false });
    expect(g.createRelation).not.toHaveBeenCalled();
    expect(g.deleteRelation).not.toHaveBeenCalled();
  });

  it("writes nothing when it cannot read the current location types", async () => {
    const g = gateway({ readClassifications: vi.fn().mockRejectedValue(new Error("403")) });
    const result = await executeKindChange("L1", kinds, "C-village", g);
    expect(result.ok).toBe(false);
    expect(g.createRelation).not.toHaveBeenCalled();
    expect(g.deleteRelation).not.toHaveBeenCalled();
  });
});
