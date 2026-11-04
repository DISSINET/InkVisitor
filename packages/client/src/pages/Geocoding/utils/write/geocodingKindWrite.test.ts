import { RelationEnums } from "@inkvisitor/shared/enums";
import { Relation } from "@inkvisitor/shared/types";
import { IGeocodingPlaceType, defaultPlaceTypes } from "@inkvisitor/shared/types/geocoding";
import { describe, expect, it, vi } from "vitest";
import { KindGateway, executeKindChange, planKindChange } from "./geocodingKindWrite";

/**
 * A kind of place is a Classification from the Location to the kind's Concept.
 * The cases that matter are the ones that would delete or duplicate something:
 * a Classification under a Concept that is not a kind belongs to someone else.
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
  it("creates a Classification to the kind's Concept for a Location with none", () => {
    const change = planKindChange("L1", kinds, [], "C-village");
    expect(change.create).toMatchObject({
      type: RelationEnums.Type.Classification,
      entityIds: ["L1", "C-village"],
    });
    expect(change.removeIds).toEqual([]);
  });

  it("creates nothing where the Location already has the kind", () => {
    const change = planKindChange("L1", kinds, [classification("r1", "L1", "C-village")], "C-village");
    expect(change.create).toBeNull();
    expect(change.removeIds).toEqual([]);
  });

  it("replaces another kind, removing the old Classification", () => {
    const change = planKindChange("L1", kinds, [classification("r1", "L1", "C-castle")], "C-village");
    expect(change.create?.entityIds).toEqual(["L1", "C-village"]);
    expect(change.removeIds).toEqual(["r1"]);
  });

  it("never removes a Classification under a Concept that is not one of the kinds", () => {
    const change = planKindChange(
      "L1",
      kinds,
      [classification("r1", "L1", "C-other"), classification("r2", "L1", "C-castle")],
      "C-village",
    );
    expect(change.removeIds).toEqual(["r2"]);
  });

  it("never removes a Classification the Location is the object of", () => {
    const change = planKindChange("L1", kinds, [classification("r1", "L2", "C-castle")], "C-village");
    expect(change.removeIds).toEqual([]);
  });

  it("removes every kind when told there is none, and creates nothing", () => {
    const change = planKindChange(
      "L1",
      kinds,
      [classification("r1", "L1", "C-castle"), classification("r2", "L1", "C-village")],
      null,
    );
    expect(change.create).toBeNull();
    expect(change.removeIds.sort()).toEqual(["r1", "r2"]);
  });

  it("leaves the Location with exactly one when it already has the kind twice", () => {
    const change = planKindChange(
      "L1",
      kinds,
      [classification("r1", "L1", "C-village"), classification("r2", "L1", "C-village")],
      "C-village",
    );
    expect(change.create).toBeNull();
    expect(change.removeIds).toEqual(["r2"]);
  });

  it("ignores a kind with no Concept, which owns no Classification", () => {
    const change = planKindChange("L1", kinds, [classification("r1", "L1", "")], "C-village");
    expect(change.removeIds).toEqual([]);
  });
});

describe("executeKindChange", () => {
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
    const result = await executeKindChange("L1", kinds, "C-village", g);
    expect(result).toEqual({ ok: true, changed: true });
    expect(order).toEqual(["create", "delete"]);
  });

  it("keeps the old kind when creating the new one fails", async () => {
    const g = gateway({ createRelation: vi.fn().mockRejectedValue(new Error("no")) });
    const result = await executeKindChange("L1", kinds, "C-village", g);
    expect(result.ok).toBe(false);
    expect(g.deleteRelation).not.toHaveBeenCalled();
  });

  it("says the new kind was saved when only removing the old one fails", async () => {
    const g = gateway({ deleteRelation: vi.fn().mockRejectedValue(new Error("no")) });
    const result = await executeKindChange("L1", kinds, "C-village", g);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toContain("new kind of place was saved");
  });

  it("writes nothing when the Location already has the kind", async () => {
    const g = gateway({
      readClassifications: vi.fn().mockResolvedValue([classification("r1", "L1", "C-village")]),
    });
    expect(await executeKindChange("L1", kinds, "C-village", g)).toEqual({ ok: true, changed: false });
    expect(g.createRelation).not.toHaveBeenCalled();
    expect(g.deleteRelation).not.toHaveBeenCalled();
  });

  it("writes nothing when it cannot read the current kinds", async () => {
    const g = gateway({ readClassifications: vi.fn().mockRejectedValue(new Error("403")) });
    const result = await executeKindChange("L1", kinds, "C-village", g);
    expect(result.ok).toBe(false);
    expect(g.createRelation).not.toHaveBeenCalled();
    expect(g.deleteRelation).not.toHaveBeenCalled();
  });
});
