import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IProp } from "@inkvisitor/shared/types";
import { GeocodingAccuracy, IGeocodingRoles } from "@inkvisitor/shared/types/geocoding";
import { UserOptions } from "@inkvisitor/shared/types/response-user";
import { CEntity, CProp } from "constructors";
import { describe, expect, it, vi } from "vitest";
import { GeocodingWritePlan, isBlocked, planGeocodingWrite } from "./geocodingWrite";
import { GeocodingWriteGateway, executeGeocodingWrite } from "./geocodingWriteExecute";

/**
 * Covers I3, I6, I7 and I14–I17.
 *
 * The planner's tests are about replacement and refusal; the executor's are
 * about ordering. The executor tests deliberately fail one step at a time and
 * assert what did NOT happen, because every one of those is a way to leave a
 * Location half-written.
 */

const roles: IGeocodingRoles = {
  x: "c-x",
  y: "c-y",
  accuracy: "c-acc",
  type: "c-type",
  accuracyValues: { [GeocodingAccuracy.Precise]: "v-precise" },
  placeTypes: { settlement: "v-settlement" },
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
  lon: 17.033,
  lat: 51.107,
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
  it("creates one Value per coordinate and points the props at them", () => {
    const plan = planOf(baseInput);
    expect(plan.newValues).toHaveLength(2);
    expect(plan.newValues.map((v) => v.labels[0])).toEqual(["17.033", "51.107"]);
    const byType = Object.fromEntries(plan.props.map((p) => [p.type.entityId, p.value.entityId]));
    expect(byType["c-x"]).toBe(plan.newValues[0].id);
    expect(byType["c-y"]).toBe(plan.newValues[1].id);
    expect(byType["c-acc"]).toBe("v-precise");
  });

  it("rounds a coordinate to a precision the source can justify", () => {
    // a map click arrives as a raw float with fifteen decimals, which reads as
    // a precision claim nobody made
    const plan = planOf({ ...baseInput, lon: 10.744393977312738, lat: 48.87670944400485 });
    expect(plan.newValues.map((v) => v.labels[0])).toEqual(["10.744394", "48.876709"]);
  });

  it("does not pad a coordinate that is already short", () => {
    expect(planOf({ ...baseInput, lon: 17, lat: 51.1 }).newValues.map((v) => v.labels[0])).toEqual([
      "17",
      "51.1",
    ]);
  });

  it("gives created Values a logicalType, matching every other Value in the corpus", () => {
    expect(planOf(baseInput).newValues[0].data).toEqual({
      logicalType: EntityEnums.LogicalType.Definite,
    });
  });

  it("replaces the previous coordinate rather than adding a second one", () => {
    const plan = planOf({
      ...baseInput,
      location: location([prop("c-x", "old-lon"), prop("c-y", "old-lat"), prop("c-acc", "v-precise")]),
    });
    expect(plan.props.filter((p) => p.type.entityId === "c-x")).toHaveLength(1);
    expect(plan.props.filter((p) => p.type.entityId === "c-y")).toHaveLength(1);
    expect(plan.isOverwrite).toBe(true);
  });

  it("keeps props this feature does not own", () => {
    const plan = planOf({
      ...baseInput,
      location: location([prop("some-other-concept", "v-other")]),
    });
    expect(plan.props.some((p) => p.type.entityId === "some-other-concept")).toBe(true);
  });

  it("marks displaced coordinate Values for deletion but never a shared Concept", () => {
    const plan = planOf({
      ...baseInput,
      location: location([prop("c-x", "old-lon"), prop("c-y", "old-lat"), prop("c-acc", "v-precise")]),
    });
    expect(plan.displacedValueIds).toEqual(["old-lon", "old-lat"]);
    // v-precise is a Concept shared by every precisely-located place
    expect(plan.displacedValueIds).not.toContain("v-precise");
  });

  it("records what the Location carried before, since the audit log will not", () => {
    const before = [prop("c-x", "old-lon")];
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

  it("refuses when the roles are unassigned", () => {
    const result = planGeocodingWrite({ ...baseInput, roles: { ...roles, x: "" } });
    expect(isBlocked(result)).toBe(true);
  });
});

/**
 * Changing what kind of place a Location is, without moving it. Every other
 * write mints a Value entity per coordinate; doing that here would orphan a pair
 * on the operation researchers repeat most, and an orphan survives whenever
 * something still refers to it or the account cannot delete.
 */
describe("planGeocodingWrite, keeping a coordinate that did not move", () => {
  const geocoded = () =>
    location([prop("c-x", "v-lon"), prop("c-y", "v-lat"), prop("c-acc", "v-precise")]);

  const retype = (current: { lon: number | null; lat: number | null } | null) =>
    planGeocodingWrite({
      location: geocoded(),
      roles,
      lon: 17.0384,
      lat: 51.1079,
      accuracy: GeocodingAccuracy.Precise,
      placeType: "settlement",
      current,
      userOptions,
    }) as GeocodingWritePlan;

  it("creates no Value entities when the coordinate is the one already stored", () => {
    expect(retype({ lon: 17.0384, lat: 51.1079 }).newValues).toEqual([]);
  });

  it("keeps the Value entities the Location already points at", () => {
    const plan = retype({ lon: 17.0384, lat: 51.1079 });
    expect(plan.props.find((p) => p.type.entityId === "c-x")?.value.entityId).toBe("v-lon");
    expect(plan.props.find((p) => p.type.entityId === "c-y")?.value.entityId).toBe("v-lat");
  });

  it("orphans nothing, so nothing has to be deleted afterwards", () => {
    expect(retype({ lon: 17.0384, lat: 51.1079 }).displacedValueIds).toEqual([]);
  });

  it("still writes the place type it was called for", () => {
    const plan = retype({ lon: 17.0384, lat: 51.1079 });
    expect(plan.props.find((p) => p.type.entityId === "c-type")?.value.entityId).toBe(
      "v-settlement",
    );
  });

  it("replaces the coordinate when it moved, however slightly", () => {
    // six decimal places is the stored precision, so a difference below it is
    // not a move and anything at or above it is
    const plan = retype({ lon: 17.0385, lat: 51.1079 });
    expect(plan.newValues).toHaveLength(2);
    expect(plan.displacedValueIds).toEqual(expect.arrayContaining(["v-lon", "v-lat"]));
  });

  it("replaces the coordinate when the caller says nothing about the current one", () => {
    expect(retype(null).newValues).toHaveLength(2);
  });

  it("replaces the coordinate when the Location was not geocoded", () => {
    expect(retype({ lon: null, lat: null }).newValues).toHaveLength(2);
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
      location: location([
        prop("c-x", "v-lon"),
        prop("c-y", "v-lat"),
        prop("c-acc", "v-unknown"),
        prop("c-type", "v-fortress"),
      ]),
      roles: {
        ...roles,
        accuracyValues: {
          [GeocodingAccuracy.Precise]: "v-precise",
          [GeocodingAccuracy.Unknown]: "v-unknown",
        },
      },
      lon: 1,
      lat: 2,
      accuracy: over.accuracy,
      placeType: over.placeType,
      userOptions,
    }) as GeocodingWritePlan;

  it("never offers the Concept a previous accuracy pointed at", () => {
    const plan = replaced({ accuracy: GeocodingAccuracy.Precise });
    expect(plan.displacedValueIds).not.toContain("v-unknown");
  });

  it("never offers the Concept a previous place type pointed at", () => {
    const plan = replaced({ accuracy: GeocodingAccuracy.Precise, placeType: "settlement" });
    expect(plan.displacedValueIds).not.toContain("v-fortress");
  });

  it("offers exactly the two coordinate Values it replaced", () => {
    const plan = replaced({ accuracy: GeocodingAccuracy.Precise, placeType: "settlement" });
    expect(plan.displacedValueIds.sort()).toEqual(["v-lat", "v-lon"]);
  });
});

/**
 * `isOverwrite` gates the one confirmation on the page, so what counts as an
 * overwrite is the whole of its meaning: a first coordinate must not ask, and a
 * write that keeps the coordinate and changes only the kind of place must not
 * ask either, or the dialog appears on the correction done most often.
 */
describe("planGeocodingWrite, what counts as replacing a coordinate", () => {
  const plan = (props: ReturnType<typeof prop>[], current?: { lon: number; lat: number }) =>
    planGeocodingWrite({
      location: location(props),
      roles,
      lon: 17.0384,
      lat: 51.1079,
      accuracy: GeocodingAccuracy.Precise,
      current,
      userOptions,
    }) as GeocodingWritePlan;

  it("is false for a Location that had no coordinate", () => {
    expect(plan([]).isOverwrite).toBe(false);
  });

  it("is true when a coordinate already there is being moved", () => {
    expect(plan([prop("c-x", "old-lon"), prop("c-y", "old-lat")]).isOverwrite).toBe(true);
  });

  it("is false when the coordinate stays exactly where it is", () => {
    const kept = plan([prop("c-x", "v-lon"), prop("c-y", "v-lat")], {
      lon: 17.0384,
      lat: 51.1079,
    });
    expect(kept.isOverwrite).toBe(false);
  });

  it("is false when only the accuracy changes on a coordinate that stays", () => {
    const kept = plan([prop("c-x", "v-lon"), prop("c-y", "v-lat"), prop("c-acc", "v-old")], {
      lon: 17.0384,
      lat: 51.1079,
    });
    expect(kept.isOverwrite).toBe(false);
  });
});

/**
 * Three answers, not two. Clearing a kind of place is a statement the researcher
 * makes; leaving it alone is what a coordinate correction does, and collapsing
 * them makes the control that offers "no kind of place" do nothing at all.
 */
describe("planGeocodingWrite, clearing versus leaving the kind of place", () => {
  const typed = () =>
    location([prop("c-x", "v-lon"), prop("c-y", "v-lat"), prop("c-type", "v-fortress")]);

  const planWith = (placeType: "settlement" | null | undefined) =>
    planGeocodingWrite({
      location: typed(),
      roles,
      lon: 1,
      lat: 2,
      accuracy: GeocodingAccuracy.Precise,
      placeType,
      userOptions,
    }) as GeocodingWritePlan;

  it("removes the kind of place when told there is none", () => {
    expect(planWith(null).props.filter((p) => p.type.entityId === "c-type")).toHaveLength(0);
  });

  it("leaves the kind of place alone when not told anything", () => {
    const kept = planWith(undefined).props.filter((p) => p.type.entityId === "c-type");
    expect(kept).toHaveLength(1);
    expect(kept[0].value.entityId).toBe("v-fortress");
  });

  it("replaces the kind of place when told a different one", () => {
    const set = planWith("settlement").props.filter((p) => p.type.entityId === "c-type");
    expect(set).toHaveLength(1);
    expect(set[0].value.entityId).toBe("v-settlement");
  });

  it("does not offer the Concept it removed for deletion", () => {
    expect(planWith(null).displacedValueIds).not.toContain("v-fortress");
  });
});

describe("executeGeocodingWrite", () => {
  const gateway = (overrides: Partial<GeocodingWriteGateway> = {}): GeocodingWriteGateway => ({
    createEntity: vi.fn().mockResolvedValue(undefined),
    readEntity: vi.fn().mockResolvedValue(location()),
    updateEntity: vi.fn().mockResolvedValue(undefined),
    deleteEntity: vi.fn().mockResolvedValue(undefined),
    recordPrevious: vi.fn(),
    ...overrides,
  });

  it("creates every child before touching the Location", async () => {
    const order: string[] = [];
    const g = gateway({
      createEntity: vi.fn(async () => void order.push("create")),
      updateEntity: vi.fn(async () => void order.push("update")),
    });
    await executeGeocodingWrite("L1", location(), planOf(baseInput), roles, g);
    expect(order).toEqual(["create", "create", "update"]);
  });

  it("leaves the Location untouched when a child cannot be created", async () => {
    const g = gateway({ createEntity: vi.fn().mockRejectedValue(new Error("boom")) });
    const result = await executeGeocodingWrite("L1", location(), planOf(baseInput), roles, g);
    expect(result.ok).toBe(false);
    expect(g.updateEntity).not.toHaveBeenCalled();
  });

  it("refuses when the coordinate changed under it, and writes nothing", async () => {
    const g = gateway({
      readEntity: vi.fn().mockResolvedValue(location([prop("c-x", "someone-elses-lon")])),
    });
    const result = await executeGeocodingWrite("L1", location(), planOf(baseInput), roles, g);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toContain("changed while you were working");
    expect(g.updateEntity).not.toHaveBeenCalled();
    expect(g.deleteEntity).not.toHaveBeenCalled();
  });

  it("proceeds when an unrelated prop changed — only the coordinate is grounds to refuse", async () => {
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
      location: location([prop("c-x", "old-lon")]),
    });
    const g = gateway({
      updateEntity: vi.fn(async () => void order.push("update")),
      deleteEntity: vi.fn(async () => void order.push("delete")),
    });
    await executeGeocodingWrite("L1", location(), plan, roles, g);
    expect(order).toEqual(["update", "delete"]);
  });

  it("keeps no deletion when the update fails", async () => {
    const plan = planOf({ ...baseInput, location: location([prop("c-x", "old-lon")]) });
    const g = gateway({ updateEntity: vi.fn().mockRejectedValue(new Error("boom")) });
    const result = await executeGeocodingWrite("L1", location(), plan, roles, g);
    expect(result.ok).toBe(false);
    expect(g.deleteEntity).not.toHaveBeenCalled();
  });

  it("succeeds and reports a Value the checked delete refused to remove", async () => {
    const plan = planOf({ ...baseInput, location: location([prop("c-x", "old-lon")]) });
    const g = gateway({ deleteEntity: vi.fn().mockRejectedValue(new Error("still used")) });
    const result = await executeGeocodingWrite("L1", location(), plan, roles, g);
    expect(result.ok).toBe(true);
    expect(result.ok && result.undeletedValueIds).toEqual(["old-lon"]);
  });
});
