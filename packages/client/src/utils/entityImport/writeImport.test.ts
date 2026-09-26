import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { IEntity, Relation } from "@inkvisitor/shared/types";
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
    createEntity: async (item) => {
      calls.push(`create entity ${item.id}`);
      if (item.id === options.failEntity) {
        throw { error: "PermissionDeniedError", message: "entity cannot be created" };
      }
      entities.set(item.id, item);
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

const plan = (entities: IEntity[], relations: Relation.IRelation[] = []): ImportPlan => ({
  entities,
  relations,
  existingEntities: { animal: entity("animal"), hound: entity("hound") },
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

    expect(outcome).toEqual({ status: "created", entityIds: ["dog", "cat"], relationCount: 1 });
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
      relationCount: 0,
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
