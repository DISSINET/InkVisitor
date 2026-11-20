import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { IEntity, Relation } from "@inkvisitor/shared/types";
import { emptySkips } from "./appendMerge";
import { ImportPlan } from "./types";
import { ImportWriteApi, writeImport } from "./writeImport";

const entity = (id: string, entityClass = EntityEnums.Class.Concept) =>
  ({ id, class: entityClass, labels: [id], isTemplate: false }) as IEntity;

const relation = (id: string, type: RelationEnums.Type, ...entityIds: string[]) =>
  ({ id, type, entityIds }) as Relation.IRelation;

/**
 * An in-memory server: entities and relations it holds, the calls it received,
 * and the synonym merge the real server performs on create.
 */
const fakeServer = (options: {
  existing?: IEntity[];
  relations?: Relation.IRelation[];
  failEntity?: string;
  failUpdate?: string;
  failRelation?: string;
  keepEntities?: string[];
}) => {
  const entities = new Map((options.existing ?? []).map((item) => [item.id, item]));
  const relations = new Map((options.relations ?? []).map((item) => [item.id, item]));
  const calls: string[] = [];

  const api: ImportWriteApi = {
    getEntities: async (ids) => ids.filter((id) => entities.has(id)).map((id) => entities.get(id)!),
    getForwardRelations: async (entityId, type) =>
      [...relations.values()].filter(
        (item) => item.type === type && item.entityIds.includes(entityId)
      ),
    getRelations: async (entityId) =>
      [...relations.values()].filter((item) => item.entityIds.includes(entityId)),
    createEntity: async (item) => {
      calls.push(`create entity ${item.id}`);
      if (item.id === options.failEntity) {
        throw { error: "PermissionDeniedError", message: "entity cannot be created" };
      }
      entities.set(item.id, item);
    },
    updateEntity: async (entityId, changes) => {
      calls.push(`update entity ${entityId} ${Object.keys(changes).join(",")}`);
      if (entityId === options.failUpdate) {
        throw { error: "ModelNotValidError", message: "update refused" };
      }
      entities.set(entityId, { ...entities.get(entityId)!, ...changes });
    },
    createRelation: async (item) => {
      calls.push(`create relation ${item.id}`);
      if (item.id === options.failRelation) {
        throw { error: "ModelNotValidError", message: "relation refused" };
      }
      if (item.type === RelationEnums.Type.Synonym) {
        const siblings = [...relations.values()].filter(
          (other) =>
            other.type === RelationEnums.Type.Synonym &&
            other.entityIds.some((entityId) => item.entityIds.includes(entityId))
        );
        const merged = new Set([...item.entityIds, ...siblings.flatMap((other) => other.entityIds)]);
        siblings.forEach((other) => relations.delete(other.id));
        relations.set(item.id, { ...item, entityIds: [...merged].sort() });
        return;
      }
      relations.set(item.id, item);
    },
    updateRelation: async (relationId, changes) => {
      calls.push(`update relation ${relationId} ${Object.keys(changes).join(",")}`);
      relations.set(relationId, { ...relations.get(relationId)!, ...changes });
    },
    deleteRelation: async (relationId) => {
      calls.push(`delete relation ${relationId}`);
      relations.delete(relationId);
    },
    deleteEntities: async (ids) => {
      calls.push(`delete entities ${ids.join(",")}`);
      const kept = ids.filter((id) => options.keepEntities?.includes(id));
      ids.filter((id) => !kept.includes(id)).forEach((id) => entities.delete(id));
      return kept;
    },
  };

  return { api, calls, entities, relations };
};

const plan = (
  entities: IEntity[],
  relations: Relation.IRelation[] = [],
  appends: ImportPlan["appends"] = {}
): ImportPlan => ({
  entities,
  relations,
  existingEntities: { animal: entity("animal"), hound: entity("hound") },
  valueCopyIds: [],
  appends,
});

describe("writeImport", () => {
  it("creates entities, then relations, reporting progress", async () => {
    const server = fakeServer({ existing: [entity("animal")] });
    const onProgress = vi.fn();

    const outcome = await writeImport(
      plan([entity("dog"), entity("cat")], [relation("r1", RelationEnums.Type.Superclass, "dog", "animal")]),
      server.api,
      onProgress
    );

    expect(outcome).toEqual({
      status: "created",
      entityIds: ["dog", "cat"],
      appendedIds: [],
      relationCount: 1,
      updatedRelationCount: 0,
      deletedRelationCount: 0,
    });
    expect(server.calls).toEqual(["create entity dog", "create entity cat", "create relation r1"]);
    expect(onProgress.mock.calls).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ]);
  });

  it("writes nothing when an id was taken meanwhile", async () => {
    const server = fakeServer({ existing: [entity("cat")] });

    const outcome = await writeImport(plan([entity("dog"), entity("cat")]), server.api);

    expect(outcome.status).toBe("conflict");
    expect(outcome.status === "conflict" && outcome.errors.map((error) => error.entityIndex)).toEqual([2]);
    expect(server.calls).toEqual([]);
  });

  it("removes the created entities when an entity fails", async () => {
    const server = fakeServer({ failEntity: "cat" });

    const outcome = await writeImport(plan([entity("dog"), entity("cat"), entity("cow")]), server.api);

    expect(outcome).toEqual({
      status: "rolledBack",
      failure: 'Failed at entity "cat": entity cannot be created',
      entityCount: 1,
      appendCount: 0,
      relationCount: 0,
      storedRelationCount: 0,
    });
    expect(server.calls.slice(-1)).toEqual(["delete entities dog"]);
    expect(server.entities.size).toBe(0);
  });

  it("removes relations before entities when a relation fails", async () => {
    const server = fakeServer({ existing: [entity("animal")], failRelation: "r2" });

    const outcome = await writeImport(
      plan(
        [entity("dog"), entity("cat")],
        [
          relation("r1", RelationEnums.Type.Superclass, "dog", "animal"),
          relation("r2", RelationEnums.Type.Superclass, "cat", "animal"),
        ]
      ),
      server.api
    );

    expect(outcome).toMatchObject({
      status: "rolledBack",
      failure: 'Failed at relation 2 (Superclass "cat" → "animal"): relation refused',
      entityCount: 2,
      relationCount: 1,
    });
    expect(server.calls.slice(-2)).toEqual(["delete relation r1", "delete entities dog,cat"]);
    expect(server.relations.size).toBe(0);
  });

  it("restores synonym groups the server merged into an imported synonym", async () => {
    const group = relation("group", RelationEnums.Type.Synonym, "canine", "hound");
    const server = fakeServer({
      existing: [entity("hound"), entity("canine"), entity("animal")],
      relations: [group],
      failRelation: "r2",
    });

    const outcome = await writeImport(
      plan(
        [entity("dog")],
        [
          relation("r1", RelationEnums.Type.Synonym, "dog", "hound"),
          relation("r2", RelationEnums.Type.Superclass, "dog", "animal"),
        ]
      ),
      server.api
    );

    expect(outcome.status).toBe("rolledBack");
    expect(server.calls.slice(-3)).toEqual([
      "delete relation r1",
      "create relation group",
      "delete entities dog",
    ]);
    expect([...server.relations.values()]).toEqual([group]);
  });

  it("skips its own synonym relations that a later synonym merged away", async () => {
    const server = fakeServer({ existing: [entity("hound"), entity("animal")], failRelation: "r3" });

    await writeImport(
      plan(
        [entity("dog"), entity("doggo")],
        [
          relation("r1", RelationEnums.Type.Synonym, "dog", "hound"),
          relation("r2", RelationEnums.Type.Synonym, "doggo", "hound"),
          relation("r3", RelationEnums.Type.Superclass, "dog", "animal"),
        ]
      ),
      server.api
    );

    expect(server.calls.filter((call) => call.startsWith("delete relation"))).toEqual([
      "delete relation r2",
    ]);
    expect(server.relations.size).toBe(0);
  });

  it("appends to a stored entity after creating the new ones, and only what changed", async () => {
    const stored = { ...entity("wolf"), notes: ["old"], updatedAt: "t1" } as unknown as IEntity;
    const server = fakeServer({ existing: [stored] });

    const outcome = await writeImport(
      plan([entity("dog"), { ...stored, notes: ["old", "new"] }], [], {
        wolf: { stored, conflicts: [], skipped: emptySkips() },
      }),
      server.api
    );

    expect(outcome).toMatchObject({ status: "created", entityIds: ["dog"], appendedIds: ["wolf"] });
    expect(server.calls).toEqual(["create entity dog", "update entity wolf notes"]);
    expect(server.entities.get("wolf")!.notes).toEqual(["old", "new"]);
  });

  it("stops before writing when an appended entity changed meanwhile", async () => {
    const stored = { ...entity("wolf"), updatedAt: "t1" } as unknown as IEntity;
    const server = fakeServer({ existing: [{ ...stored, updatedAt: "t2" } as unknown as IEntity] });

    const outcome = await writeImport(
      plan([{ ...stored, notes: ["new"] }], [], {
        wolf: { stored, conflicts: [], skipped: emptySkips() },
      }),
      server.api
    );

    expect(outcome.status).toBe("conflict");
    expect(outcome.status === "conflict" && outcome.errors).toMatchObject([
      { entityId: "wolf", stale: true },
    ]);
    expect(server.calls).toEqual([]);
  });

  it("stops before writing when a stored relation the drafts change was changed or removed meanwhile", async () => {
    const stored = { ...entity("wolf"), updatedAt: "t1" } as unknown as IEntity;
    const scl = relation("s1", RelationEnums.Type.Superclass, "wolf", "animal");
    const ant = relation("s2", RelationEnums.Type.Antonym, "wolf", "hound");
    const write = (relations: Relation.IRelation[]) => {
      const server = fakeServer({ existing: [stored], relations });
      const outcome = writeImport(
        {
          ...plan([stored], [], { wolf: { stored, conflicts: [], skipped: emptySkips() } }),
          storedRelationChanges: {
            updated: [{ before: scl, changes: { entityIds: ["wolf", "hound"] } }],
            deleted: [ant],
          },
        },
        server.api
      );
      return { server, outcome };
    };

    const changed = write([{ ...scl, entityIds: ["wolf", "hound"] }, ant]);
    expect(await changed.outcome).toMatchObject({
      status: "conflict",
      errors: [{ entityId: "wolf", stale: true }],
    });
    expect(changed.server.calls).toEqual([]);

    const removed = write([scl]);
    expect(await removed.outcome).toMatchObject({ status: "conflict" });

    const unchanged = write([scl, ant]);
    expect(await unchanged.outcome).toMatchObject({ status: "created" });
  });

  it("undoes an append when a later write fails", async () => {
    const stored = { ...entity("wolf"), notes: ["old"], updatedAt: "t1" } as unknown as IEntity;
    const server = fakeServer({ existing: [stored], failRelation: "r1" });

    const outcome = await writeImport(
      plan(
        [{ ...stored, notes: ["old", "new"] }],
        [relation("r1", RelationEnums.Type.Superclass, "wolf", "animal")],
        { wolf: { stored, conflicts: [], skipped: emptySkips() } }
      ),
      server.api
    );

    expect(outcome).toMatchObject({ status: "rolledBack", appendCount: 1 });
    expect(server.entities.get("wolf")!.notes).toEqual(["old"]);
  });

  it("writes the edits to stored relations before the new relations", async () => {
    const stored = { ...entity("wolf"), updatedAt: "t1" } as unknown as IEntity;
    const scl = relation("s1", RelationEnums.Type.Superclass, "wolf", "animal");
    const ant = relation("s2", RelationEnums.Type.Antonym, "wolf", "hound");
    const server = fakeServer({ existing: [stored], relations: [scl, ant] });

    const outcome = await writeImport(
      {
        ...plan([stored], [relation("r1", RelationEnums.Type.Holonym, "wolf", "animal")], {
          wolf: { stored, conflicts: [], skipped: emptySkips() },
        }),
        storedRelationChanges: {
          updated: [{ before: scl, changes: { entityIds: ["wolf", "hound"] } }],
          deleted: [ant],
        },
      },
      server.api
    );

    expect(outcome).toMatchObject({
      status: "created",
      updatedRelationCount: 1,
      deletedRelationCount: 1,
      relationCount: 1,
    });
    expect(server.calls).toEqual([
      "update relation s1 entityIds",
      "delete relation s2",
      "create relation r1",
    ]);
    expect(server.relations.get("s1")!.entityIds).toEqual(["wolf", "hound"]);
    expect(server.relations.has("s2")).toBe(false);
  });

  it("puts the stored relations back when a later write fails", async () => {
    const stored = { ...entity("wolf"), updatedAt: "t1" } as unknown as IEntity;
    const scl = relation("s1", RelationEnums.Type.Superclass, "wolf", "animal");
    const ant = relation("s2", RelationEnums.Type.Antonym, "wolf", "hound");
    const server = fakeServer({ existing: [stored], relations: [scl, ant], failRelation: "r1" });

    const outcome = await writeImport(
      {
        ...plan([stored], [relation("r1", RelationEnums.Type.Holonym, "wolf", "animal")], {
          wolf: { stored, conflicts: [], skipped: emptySkips() },
        }),
        storedRelationChanges: {
          updated: [{ before: scl, changes: { entityIds: ["wolf", "hound"] } }],
          deleted: [ant],
        },
      },
      server.api
    );

    expect(outcome).toMatchObject({ status: "rolledBack", storedRelationCount: 2 });
    expect(server.relations.get("s1")).toEqual(scl);
    expect(server.relations.get("s2")).toEqual(ant);
  });

  it("lists what the rollback could not remove", async () => {
    const server = fakeServer({ failEntity: "cat", keepEntities: ["dog"] });

    const outcome = await writeImport(plan([entity("dog"), entity("cat")]), server.api);

    expect(outcome).toEqual({
      status: "rollbackFailed",
      failure: 'Failed at entity "cat": entity cannot be created',
      leftovers: ['entity "dog" (dog)'],
    });
  });
});
