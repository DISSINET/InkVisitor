import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IProp } from "@inkvisitor/shared/types";
import {
  GeocodingAccuracy,
  IGeocodingRoles,
  defaultPlaceTypes,
} from "@inkvisitor/shared/types/geocoding";
import {
  GeoJsonGeometry,
  parseGeometry,
  pointGeometry,
} from "@inkvisitor/shared/types/geometry";
import { UserOptions } from "@inkvisitor/shared/types/response-user";
import { CEntity, CProp } from "constructors";
import { describe, expect, it, vi } from "vitest";
import {
  GeocodingWritePlan,
  isBlocked,
  needsOverwriteConfirmation,
  planGeocodingWrite,
} from "./geocodingWrite";
import { GeocodingWriteGateway, executeGeocodingWrite } from "./geocodingWriteExecute";

/**
 * Covers I3, I6, I7 and I14–I17, with the geometry held as one GeoJSON Value.
 *
 * The planner's tests are about replacement and refusal; the executor's are
 * about ordering. The executor tests deliberately fail one step at a time and
 * assert what did NOT happen, because every one of those is a way to leave a
 * Location half-written.
 */

const roles: IGeocodingRoles = {
  geometry: "c-geo",
  accuracy: "c-acc",
  accuracyValues: { [GeocodingAccuracy.Precise]: "v-precise" },
  placeTypes: [
    { ...defaultPlaceTypes()[0], conceptId: "v-settlement" },
    { ...defaultPlaceTypes()[1], conceptId: "" },
  ],
  resources: { wikidata: "r-wikidata", geonames: "r-geonames" },
};

const userOptions = { defaultLanguage: EntityEnums.Language.English } as UserOptions;

const prop = (typeId: string, valueId: string): IProp => {
  const built = CProp();
  built.type.entityId = typeId;
  built.value.entityId = valueId;
  return built;
};

// through the app's own constructor, so a change to the entity shape reaches here
const location = (props: IProp[] = []): IEntity => {
  const entity = CEntity(userOptions, EntityEnums.Class.Location, "Breslau");
  entity.id = "L1";
  entity.props = props;
  return entity;
};

const baseInput = {
  location: location(),
  roles,
  geometry: pointGeometry(17.033, 51.107) as GeoJsonGeometry,
  accuracy: GeocodingAccuracy.Precise,
  userOptions,
};

const planOf = (input: Parameters<typeof planGeocodingWrite>[0]): GeocodingWritePlan => {
  const result = planGeocodingWrite(input);
  if (isBlocked(result)) {
    throw new Error(`unexpectedly blocked: ${result.blocked}`);
  }
  return result;
};

describe("planGeocodingWrite", () => {
  it("creates one Value holding the GeoJSON and points the prop at it", () => {
    const plan = planOf(baseInput);
    expect(plan.newValues).toHaveLength(1);
    expect(JSON.parse(plan.newValues[0].labels[0])).toEqual({
      type: "Point",
      coordinates: [17.033, 51.107],
    });
    const byType = Object.fromEntries(plan.props.map((p) => [p.type.entityId, p.value.entityId]));
    expect(byType["c-geo"]).toBe(plan.newValues[0].id);
    expect(byType["c-acc"]).toBe("v-precise");
  });

  it("rounds a coordinate to a precision the source can justify", () => {
    // a map click arrives as a raw float with fifteen decimals, which reads as
    // a precision claim nobody made
    const plan = planOf({
      ...baseInput,
      geometry: { type: "Point", coordinates: [10.744393977312738, 48.87670944400485] },
    });
    expect(JSON.parse(plan.newValues[0].labels[0]).coordinates).toEqual([10.744394, 48.876709]);
  });

  it.each([
    ["LineString", { type: "LineString", coordinates: [[1, 2], [3, 4]] }],
    ["Polygon", { type: "Polygon", coordinates: [[[0, 0], [4, 0], [4, 4], [0, 0]]] }],
    ["MultiPoint", { type: "MultiPoint", coordinates: [[1, 2], [3, 4]] }],
    [
      "MultiLineString",
      { type: "MultiLineString", coordinates: [[[1, 2], [3, 4]], [[5, 6], [7, 8]]] },
    ],
    [
      "MultiPolygon",
      { type: "MultiPolygon", coordinates: [[[[0, 0], [4, 0], [4, 4], [0, 0]]]] },
    ],
  ])("stores a %s as one Value that reads back as the same geometry", (_name, geometry) => {
    const plan = planOf({ ...baseInput, geometry: geometry as GeoJsonGeometry });
    expect(plan.newValues).toHaveLength(1);
    expect(parseGeometry(plan.newValues[0].labels[0])).toEqual(geometry);
  });

  it("gives created Values a logicalType, matching every other Value in the corpus", () => {
    expect(planOf(baseInput).newValues[0].data).toEqual({
      logicalType: EntityEnums.LogicalType.Definite,
    });
  });

  it("replaces the previous coordinate rather than adding a second one", () => {
    const plan = planOf({
      ...baseInput,
      location: location([prop("c-geo", "old-geo"), prop("c-acc", "v-precise")]),
    });
    expect(plan.props.filter((p) => p.type.entityId === "c-geo")).toHaveLength(1);
    expect(plan.isOverwrite).toBe(true);
  });

  it("keeps props this feature does not own", () => {
    const plan = planOf({
      ...baseInput,
      location: location([prop("some-other-concept", "v-other")]),
    });
    expect(plan.props.some((p) => p.type.entityId === "some-other-concept")).toBe(true);
  });

  it("marks the displaced geometry Value for deletion but never a shared Concept", () => {
    const plan = planOf({
      ...baseInput,
      location: location([prop("c-geo", "old-geo"), prop("c-acc", "v-precise")]),
    });
    expect(plan.displacedValueIds).toEqual(["old-geo"]);
    // v-precise is a Concept shared by every precisely-located place
    expect(plan.displacedValueIds).not.toContain("v-precise");
  });

  it("records what the Location carried before, since the audit log will not", () => {
    const before = [prop("c-geo", "old-geo")];
    expect(planOf({ ...baseInput, location: location(before) }).previous.props).toEqual(before);
  });

  it("writes a reference per source that has a Resource and an id", () => {
    const plan = planOf({
      ...baseInput,
      provenance: [
        { source: "wikidata", sourceId: "Q1799" },
        { source: "geonames", sourceId: "3081368" },
      ],
    });
    expect(plan.references).toHaveLength(2);
    expect(plan.references.map((r) => r.resource)).toEqual(["r-wikidata", "r-geonames"]);
    expect(plan.newValues.map((v) => v.labels[0])).toContain("Q1799");
  });

  it("writes no reference for a source with no Resource assigned — llm-coords has none", () => {
    const plan = planOf({
      ...baseInput,
      provenance: [{ source: "llm-coords", sourceId: "" }],
    });
    expect(plan.references).toHaveLength(0);
  });

  it("refuses a place type with no Concept, naming it, rather than dropping it", () => {
    const result = planGeocodingWrite({ ...baseInput, placeType: "fortress" });
    expect(isBlocked(result)).toBe(true);
    expect(isBlocked(result) && result.blocked).toContain("fortress");
  });

  it.each<[string, unknown]>([
    ["a longitude beyond 180", { type: "Point", coordinates: [538.2, -17.7] }],
    ["NaN", { type: "Point", coordinates: [NaN, 50] }],
    ["an open ring", { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1]]] }],
    ["a one-position line", { type: "LineString", coordinates: [[1, 2]] }],
  ])("refuses to write %s, so nothing unreadable is stored", (_name, geometry) => {
    const result = planGeocodingWrite({ ...baseInput, geometry: geometry as GeoJsonGeometry });
    expect(isBlocked(result)).toBe(true);
  });

  it("refuses when the roles are unassigned", () => {
    const result = planGeocodingWrite({ ...baseInput, roles: { ...roles, geometry: "" } });
    expect(isBlocked(result)).toBe(true);
  });
});

/**
 * Changing what kind of place a Location is, without moving it. Every other
 * write mints a Value entity per coordinate; doing that here would orphan a pair
 * on the operation researchers repeat most, and an orphan survives whenever
 * something still refers to it or the account cannot delete.
 */
describe("planGeocodingWrite, keeping a geometry that did not move", () => {
  const geocoded = () => location([prop("c-geo", "v-geo"), prop("c-acc", "v-precise")]);
  const same = pointGeometry(17.0384, 51.1079);

  const retype = (current: GeoJsonGeometry | null) =>
    planGeocodingWrite({
      location: geocoded(),
      roles,
      geometry: same,
      accuracy: GeocodingAccuracy.Precise,
      placeType: "settlement",
      current,
      userOptions,
    }) as GeocodingWritePlan;

  it("creates no Value entity when the geometry is the one already stored", () => {
    expect(retype(same).newValues).toEqual([]);
  });

  it("keeps the Value entity the Location already points at", () => {
    const plan = retype(same);
    expect(plan.props.find((p) => p.type.entityId === "c-geo")?.value.entityId).toBe("v-geo");
  });

  it("orphans nothing, so nothing has to be deleted afterwards", () => {
    expect(retype(same).displacedValueIds).toEqual([]);
  });

  it("keeps a polygon that did not move, however it was handed in", () => {
    const ring = [[0, 0], [4, 0], [4, 4], [0, 0]];
    const polygon = { type: "Polygon", coordinates: [ring] } as GeoJsonGeometry;
    const plan = planGeocodingWrite({
      location: geocoded(),
      roles,
      geometry: polygon,
      accuracy: GeocodingAccuracy.Precise,
      current: JSON.parse(JSON.stringify(polygon)),
      userOptions,
    }) as GeocodingWritePlan;
    expect(plan.newValues).toEqual([]);
    expect(plan.isOverwrite).toBe(false);
  });

  it("replaces the geometry when the shape kind changed at the same anchor", () => {
    const plan = planGeocodingWrite({
      location: geocoded(),
      roles,
      geometry: { type: "MultiPoint", coordinates: [[17.0384, 51.1079]] },
      accuracy: GeocodingAccuracy.Precise,
      current: same,
      userOptions,
    }) as GeocodingWritePlan;
    expect(plan.newValues).toHaveLength(1);
    expect(plan.displacedValueIds).toEqual(["v-geo"]);
  });

  it("still carries the kind of place it was called for, as a Concept to classify under", () => {
    const plan = retype(same);
    expect(plan.kindConceptId).toBe("v-settlement");
    expect(plan.props.some((p) => p.type.entityId === "c-type")).toBe(false);
  });

  it("replaces the geometry when it moved, however slightly", () => {
    // six decimal places is the stored precision, so a difference below it is
    // not a move and anything at or above it is
    const plan = retype(pointGeometry(17.0385, 51.1079));
    expect(plan.newValues).toHaveLength(1);
    expect(plan.displacedValueIds).toEqual(["v-geo"]);
  });

  it("treats a difference below the stored precision as no move", () => {
    expect(retype(pointGeometry(17.03840001, 51.1079)).newValues).toEqual([]);
  });

  it("replaces the geometry when the caller says nothing about the current one", () => {
    expect(retype(null).newValues).toHaveLength(1);
  });
});

/**
 * The accuracy and place type roles point at Concepts from the project's own
 * vocabulary, shared with every other Location that carries the same value.
 * Offering one for deletion asks the server to drop a term because one place
 * stopped using it — refused today only because the delete route checks for
 * other referrers, which is a safety net rather than the intent.
 */
describe("planGeocodingWrite, what it offers for deletion", () => {
  const replaced = (over: { accuracy: GeocodingAccuracy; placeType?: "settlement" }) =>
    planGeocodingWrite({
      location: location([prop("c-geo", "v-geo"), prop("c-acc", "v-unknown")]),
      roles: {
        ...roles,
        accuracyValues: {
          [GeocodingAccuracy.Precise]: "v-precise",
          [GeocodingAccuracy.Unknown]: "v-unknown",
        },
      },
      geometry: pointGeometry(1, 2),
      accuracy: over.accuracy,
      placeType: over.placeType,
      userOptions,
    }) as GeocodingWritePlan;

  it("never offers the Concept a previous accuracy pointed at", () => {
    const plan = replaced({ accuracy: GeocodingAccuracy.Precise });
    expect(plan.displacedValueIds).not.toContain("v-unknown");
  });

  it("offers exactly the geometry Value it replaced", () => {
    const plan = replaced({ accuracy: GeocodingAccuracy.Precise, placeType: "settlement" });
    expect(plan.displacedValueIds).toEqual(["v-geo"]);
  });
});

/**
 * `isOverwrite` gates the one confirmation on the page, so what counts as an
 * overwrite is the whole of its meaning: a first coordinate must not ask, and a
 * write that keeps the coordinate and changes only the kind of place must not
 * ask either, or the dialog appears on the correction done most often.
 */
describe("planGeocodingWrite, what counts as replacing a geometry", () => {
  const plan = (props: ReturnType<typeof prop>[], current?: GeoJsonGeometry) =>
    planGeocodingWrite({
      location: location(props),
      roles,
      geometry: pointGeometry(17.0384, 51.1079),
      accuracy: GeocodingAccuracy.Precise,
      current,
      userOptions,
    }) as GeocodingWritePlan;

  it("is false for a Location that had no coordinate", () => {
    expect(plan([]).isOverwrite).toBe(false);
  });

  it("is true when a coordinate already there is being moved", () => {
    expect(plan([prop("c-geo", "old-geo")]).isOverwrite).toBe(true);
  });

  it("is false when the coordinate stays exactly where it is", () => {
    const kept = plan([prop("c-geo", "v-geo")], pointGeometry(17.0384, 51.1079));
    expect(kept.isOverwrite).toBe(false);
  });

  it("is false when only the accuracy changes on a coordinate that stays", () => {
    const kept = plan(
      [prop("c-geo", "v-geo"), prop("c-acc", "v-old")],
      pointGeometry(17.0384, 51.1079),
    );
    expect(kept.isOverwrite).toBe(false);
  });
});

describe("needsOverwriteConfirmation", () => {
  it("asks for a Location whose existing geometry the page could not read", () => {
    // `current` is undefined for an unreadable Value, yet the write deletes it
    const plan = planOf({
      ...baseInput,
      location: location([prop("c-geo", "unparseable-geo")]),
      current: undefined,
    });
    expect(plan.isOverwrite).toBe(true);
    expect(needsOverwriteConfirmation(plan, false)).toBe(true);
  });

  it("does not ask when the replacement has already been agreed to", () => {
    const plan = planOf({ ...baseInput, location: location([prop("c-geo", "old-geo")]) });
    expect(needsOverwriteConfirmation(plan, true)).toBe(false);
  });

  it("does not ask for a Location with no geometry", () => {
    expect(needsOverwriteConfirmation(planOf(baseInput), false)).toBe(false);
  });
});

/**
 * Three answers, not two. Clearing a kind of place is a statement the researcher
 * makes; leaving it alone is what a coordinate correction does, and collapsing
 * them makes the control that offers "no kind of place" do nothing at all.
 */
describe("planGeocodingWrite, clearing versus leaving the kind of place", () => {
  // a prop of the retired type role: the plan must neither read nor remove it
  const typed = () => location([prop("c-geo", "v-geo"), prop("c-type", "v-fortress")]);

  const planWith = (placeType: "settlement" | null | undefined) =>
    planGeocodingWrite({
      location: typed(),
      roles,
      geometry: pointGeometry(1, 2),
      accuracy: GeocodingAccuracy.Precise,
      placeType,
      userOptions,
    }) as GeocodingWritePlan;

  it("asks for the kinds to be removed when told there is none", () => {
    expect(planWith(null).kindConceptId).toBeNull();
  });

  it("asks for nothing to change when not told anything", () => {
    expect(planWith(undefined).kindConceptId).toBeUndefined();
  });

  it("names the Concept to classify under when told a kind", () => {
    expect(planWith("settlement").kindConceptId).toBe("v-settlement");
  });

  it("never touches props it does not own, whatever the kind", () => {
    const kept = planWith("settlement").props.filter((p) => p.type.entityId === "c-type");
    expect(kept).toHaveLength(1);
    expect(kept[0].value.entityId).toBe("v-fortress");
  });

  it("refuses a kind that is not in the settings", () => {
    const result = planGeocodingWrite({
      location: typed(),
      roles,
      geometry: pointGeometry(1, 2),
      accuracy: GeocodingAccuracy.Precise,
      placeType: "nonexistent",
      userOptions,
    });
    expect(isBlocked(result) && result.blocked).toContain("not defined");
  });
});

describe("executeGeocodingWrite", () => {
  const gateway = (overrides: Partial<GeocodingWriteGateway> = {}): GeocodingWriteGateway => ({
    createEntity: vi.fn().mockResolvedValue(undefined),
    readEntity: vi.fn().mockResolvedValue(location()),
    updateEntity: vi.fn().mockResolvedValue(undefined),
    deleteEntity: vi.fn().mockResolvedValue(undefined),
    recordPrevious: vi.fn(),
    discardPrevious: vi.fn(),
    ...overrides,
  });

  it("creates every child before touching the Location", async () => {
    const order: string[] = [];
    const g = gateway({
      createEntity: vi.fn(async () => void order.push("create")),
      updateEntity: vi.fn(async () => void order.push("update")),
    });
    await executeGeocodingWrite("L1", location(), planOf(baseInput), roles, g);
    expect(order).toEqual(["create", "update"]);
  });

  it("leaves the Location untouched when a child cannot be created", async () => {
    const g = gateway({ createEntity: vi.fn().mockRejectedValue(new Error("boom")) });
    const result = await executeGeocodingWrite("L1", location(), planOf(baseInput), roles, g);
    expect(result.ok).toBe(false);
    expect(g.updateEntity).not.toHaveBeenCalled();
  });

  it("deletes the Values it created when the write is refused, so none are left attached to nothing", async () => {
    const g = gateway({
      readEntity: vi.fn().mockResolvedValue(location([prop("c-geo", "someone-elses-geo")])),
    });
    const plan = planOf(baseInput);
    await executeGeocodingWrite("L1", location(), plan, roles, g);
    const created = plan.newValues.map((value) => value.id);
    expect(created.length).toBeGreaterThan(0);
    for (const id of created) {
      expect(g.deleteEntity).toHaveBeenCalledWith(id);
    }
  });

  it("deletes the Values it created and takes back the history record when the update fails", async () => {
    const g = gateway({ updateEntity: vi.fn().mockRejectedValue(new Error("boom")) });
    const plan = planOf(baseInput);
    const result = await executeGeocodingWrite("L1", location(), plan, roles, g);
    expect(result.ok).toBe(false);
    expect(g.discardPrevious).toHaveBeenCalledWith("L1");
    for (const value of plan.newValues) {
      expect(g.deleteEntity).toHaveBeenCalledWith(value.id);
    }
  });

  it("refuses when the geometry changed under it, and writes nothing", async () => {
    const g = gateway({
      readEntity: vi.fn().mockResolvedValue(location([prop("c-geo", "someone-elses-geo")])),
    });
    const result = await executeGeocodingWrite("L1", location(), planOf(baseInput), roles, g);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toContain("changed while you were working");
    expect(g.updateEntity).not.toHaveBeenCalled();
    // what somebody else wrote is never touched
    expect(g.deleteEntity).not.toHaveBeenCalledWith("someone-elses-geo");
  });

  it("proceeds when an unrelated prop changed — only the geometry is grounds to refuse", async () => {
    const g = gateway({
      readEntity: vi.fn().mockResolvedValue(location([prop("unrelated", "v-new")])),
    });
    const result = await executeGeocodingWrite("L1", location(), planOf(baseInput), roles, g);
    expect(result.ok).toBe(true);
    expect(g.updateEntity).toHaveBeenCalled();
  });

  it("records the previous state before the update, not after", async () => {
    const order: string[] = [];
    const g = gateway({
      recordPrevious: vi.fn(() => void order.push("record")),
      updateEntity: vi.fn(async () => void order.push("update")),
    });
    await executeGeocodingWrite("L1", location(), planOf(baseInput), roles, g);
    expect(order).toEqual(["record", "update"]);
  });

  it("deletes displaced Values only after the update succeeds", async () => {
    const order: string[] = [];
    const plan = planOf({
      ...baseInput,
      location: location([prop("c-geo", "old-geo")]),
    });
    const g = gateway({
      updateEntity: vi.fn(async () => void order.push("update")),
      deleteEntity: vi.fn(async () => void order.push("delete")),
    });
    await executeGeocodingWrite("L1", location(), plan, roles, g);
    expect(order).toEqual(["update", "delete"]);
  });

  it("keeps no deletion when the update fails", async () => {
    const plan = planOf({ ...baseInput, location: location([prop("c-geo", "old-geo")]) });
    const g = gateway({ updateEntity: vi.fn().mockRejectedValue(new Error("boom")) });
    const result = await executeGeocodingWrite("L1", location(), plan, roles, g);
    expect(result.ok).toBe(false);
    // the Value the Location still carries stays; only what this write minted goes
    expect(g.deleteEntity).not.toHaveBeenCalledWith("old-geo");
  });

  it("succeeds and reports a Value the checked delete refused to remove", async () => {
    const plan = planOf({ ...baseInput, location: location([prop("c-geo", "old-geo")]) });
    const g = gateway({ deleteEntity: vi.fn().mockRejectedValue(new Error("still used")) });
    const result = await executeGeocodingWrite("L1", location(), plan, roles, g);
    expect(result.ok).toBe(true);
    expect(result.ok && result.undeletedValueIds).toEqual(["old-geo"]);
  });
});
