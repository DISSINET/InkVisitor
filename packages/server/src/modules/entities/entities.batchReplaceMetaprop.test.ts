import "ts-jest";
import { randomUUID } from "crypto";
import { apiPath } from "@common/constants";
import { AuthAgent, createAgentWithUserId, getAuthenticatedAgent } from "../../test/testAuth";
import { Db, storage } from "@service/storage";
import { pool } from "@middlewares/db";
import { createMockTree, seedAcl } from "@modules/common.test";
import Entity from "@models/entity/entity";
import User from "@models/user/user";
import { getEntityClass } from "@models/factory";
import treeCache from "@service/treeCache";
import { deleteAudits } from "@service/shorthands";
import { EntityEnums, HttpMethods, UserEnums } from "@inkvisitor/shared/enums";
import {
  IEntity,
  IProp,
  IPropSpec,
  IRequestBatchReplaceMetaprop,
} from "@inkvisitor/shared/types";
import { MAX_BATCH_REPLACE_ENTITIES } from "@inkvisitor/shared/constants";
import { ReplaceReason } from "./batch-replace-relation";

const { Concept, Person, Resource, Statement, Value } = EntityEnums.Class;
const { Elvl, Logic } = EntityEnums;

type Body = Partial<IRequestBatchReplaceMetaprop>;

const spec = (entityId: string): IPropSpec => ({
  entityId,
  elvl: Elvl.Inferential,
  logic: Logic.Positive,
  virtuality: EntityEnums.Virtuality.Reality,
  partitivity: EntityEnums.Partitivity.Unison,
});

// the defaults of a metaprop built by batchAddMetaprop
const prop = (type: string, value: string, extra: Record<string, unknown> = {}): IProp => ({
  id: randomUUID(),
  elvl: Elvl.Inferential,
  certainty: EntityEnums.Certainty.Empty,
  logic: Logic.Positive,
  mood: [EntityEnums.Mood.Indication],
  moodvariant: EntityEnums.MoodVariant.Realis,
  bundleOperator: EntityEnums.Operator.And,
  bundleStart: false,
  bundleEnd: false,
  children: [],
  type: spec(type),
  value: spec(value),
  ...extra,
});

/**
 * `replace` and `replaceAs` send a dry run: the route decides every row and
 * counts, and writes nothing, which each of them checks on the props of the
 * rows in the body and on the audits. `save` and `saveAs` send the body
 * without `dryRun`.
 */
describe("Entities batchReplaceMetaprop", () => {
  const db = new Db();
  let adminAgent: AuthAgent;

  const makeEntity = async (
    cls: EntityEnums.Class,
    extra: Record<string, unknown> = {}
  ): Promise<Entity> => {
    const entity = getEntityClass({
      id: `brm-${randomUUID()}`,
      class: cls,
      labels: [`brm-${cls}`],
      ...extra,
    });
    await entity.save(db.connection);
    return entity;
  };

  // stores the props as given: the model drops the prop fields it does not declare
  const rawEntity = async (cls: EntityEnums.Class, props: unknown[]): Promise<IEntity> => {
    const entity = {
      ...getEntityClass({ id: `brm-${randomUUID()}`, class: cls, labels: [`brm-${cls}`] }),
      props,
    } as IEntity;
    await storage.entities.insert(db.connection, entity);
    return entity;
  };

  const propsOf = async (entity: IEntity): Promise<IProp[] | undefined> =>
    (await storage.entities.get(db.connection, entity.id))?.props;

  // the stored props of each entity among the ids, in the order of the ids
  const propsByIds = async (entityIds: unknown): Promise<[string, IProp[]][]> => {
    const wanted = (Array.isArray(entityIds) ? entityIds : []).filter(
      (id): id is string => typeof id === "string" && id.length > 0
    );
    return (await Entity.findEntitiesByIds(db.connection, wanted)).map(({ id, props }) => [
      id,
      props,
    ]);
  };

  const auditCount = async (): Promise<number> =>
    (await storage.audits.all(db.connection)).length;

  const replaceAs = async (agent: AuthAgent, body: Body) => {
    const propsBefore = await propsByIds(body.entityIds);
    const auditsBefore = await auditCount();

    const res = await agent
      .post(`${apiPath}/entities/batchReplaceMetaprop`)
      .send({ ...body, dryRun: true });

    if (res.status === 200) {
      const { selected, unmatched, changed, skipped, failed } = res.body;
      expect(selected).toBe(unmatched + changed + skipped + failed);
    }
    expect(await propsByIds(body.entityIds)).toEqual(propsBefore);
    expect(await auditCount()).toBe(auditsBefore);
    return res;
  };

  const replace = (body: Body) => replaceAs(adminAgent, body);

  const saveAs = async (agent: AuthAgent, body: Body) => {
    const res = await agent.post(`${apiPath}/entities/batchReplaceMetaprop`).send(body);

    if (res.status === 200) {
      const { selected, unmatched, changed, skipped, failed } = res.body;
      expect(selected).toBe(unmatched + changed + skipped + failed);
    }
    return res;
  };

  const save = (body: Body) => saveAs(adminAgent, body);

  const ids = (...entities: IEntity[]) => entities.map((e) => e.id);

  // T, X and Y of a request; the rows hold metaprops that name them
  const tXY = async () => ({
    t: await makeEntity(Concept),
    x: await makeEntity(Concept),
    y: await makeEntity(Concept),
  });

  beforeAll(async () => {
    await db.initDb();
    await seedAcl(db, {
      controller: "entities",
      route: "batchReplaceMetaprop",
      method: HttpMethods.Post,
      roles: [UserEnums.Role.Editor],
      public: false,
    });
    adminAgent = await getAuthenticatedAgent();
  });

  afterAll(async () => {
    await db.close();
    await pool.end();
  });

  afterEach(() => jest.restoreAllMocks());

  describe("counts", () => {
    it("replaces (T, X) by (T, Y) on the rows that hold it", async () => {
      const { t, x, y } = await tXY();
      const rows = [
        await makeEntity(Person, { props: [prop(t.id, x.id)] }),
        await makeEntity(Person, { props: [prop(t.id, x.id)] }),
        await makeEntity(Person, { props: [prop(t.id, x.id)] }),
      ];
      const without = await makeEntity(Person);

      const res = await replace({
        entityIds: ids(...rows, without),
        typeEntityId: t.id,
        fromValueEntityId: x.id,
        toValueEntityId: y.id,
      });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        selected: 4,
        unmatched: 1,
        changed: 3,
        merged: 0,
        skipped: 0,
        failed: 0,
        items: 3,
        nested: 0,
        result: true,
      });
      expect(res.body.errors).toEqual({});
    });

    it("counts every (T, X) of a row that holds it twice", async () => {
      const { t, x, y } = await tXY();
      const row = await makeEntity(Person, { props: [prop(t.id, x.id), prop(t.id, x.id)] });

      const res = await replace({
        entityIds: [row.id],
        typeEntityId: t.id,
        fromValueEntityId: x.id,
        toValueEntityId: y.id,
      });

      expect(res.body).toMatchObject({ selected: 1, changed: 1, merged: 0, items: 2 });
    });

    it("merges a row that holds (T, X) and (T, Y) of the same settings", async () => {
      const { t, x, y } = await tXY();
      const row = await makeEntity(Person, { props: [prop(t.id, x.id), prop(t.id, y.id)] });

      const res = await replace({
        entityIds: [row.id],
        typeEntityId: t.id,
        fromValueEntityId: x.id,
        toValueEntityId: y.id,
      });

      expect(res.body).toMatchObject({ selected: 1, changed: 1, merged: 1, items: 1 });
    });

    it("skips a row whose (T, X) differs from its (T, Y) in elvl", async () => {
      const { t, x, y } = await tXY();
      const row = await makeEntity(Person, {
        props: [prop(t.id, x.id, { elvl: Elvl.Textual }), prop(t.id, y.id)],
      });

      const res = await replace({
        entityIds: [row.id],
        typeEntityId: t.id,
        fromValueEntityId: x.id,
        toValueEntityId: y.id,
      });

      expect(res.body).toMatchObject({ selected: 1, changed: 0, skipped: 1, items: 0 });
      expect(res.body.skippedIds).toEqual([row.id]);
      expect(res.body.errors).toEqual({});
    });

    it("skips a row whose second (T, X) has a subproperty, next to a (T, Y)", async () => {
      const { t, x, y } = await tXY();
      const child = await makeEntity(Concept);
      const row = await makeEntity(Person, {
        props: [
          prop(t.id, x.id),
          prop(t.id, x.id, { children: [prop(child.id, child.id)] }),
          prop(t.id, y.id),
        ],
      });

      const res = await replace({
        entityIds: [row.id],
        typeEntityId: t.id,
        fromValueEntityId: x.id,
        toValueEntityId: y.id,
      });

      expect(res.body).toMatchObject({ selected: 1, changed: 0, merged: 0, skipped: 1 });
      expect(res.body.skippedIds).toEqual([row.id]);
    });

    it("counts (T, X) held as a subproperty in nested and leaves it", async () => {
      const { t, x, y } = await tXY();
      const other = await makeEntity(Concept);
      const a = await makeEntity(Person, {
        props: [prop(t.id, x.id, { children: [prop(t.id, x.id)] })],
      });
      const b = await makeEntity(Person, {
        props: [prop(other.id, other.id, { children: [prop(t.id, x.id)] })],
      });

      const res = await replace({
        entityIds: ids(a, b),
        typeEntityId: t.id,
        fromValueEntityId: x.id,
        toValueEntityId: y.id,
      });

      expect(res.body).toMatchObject({
        selected: 2,
        unmatched: 1,
        changed: 1,
        items: 1,
        nested: 2,
      });
      expect(res.body.errors).toEqual({});
    });

    it("replaces the empty value when fromValueEntityId is empty", async () => {
      const { t, x, y } = await tXY();
      const empty = await makeEntity(Person, { props: [prop(t.id, "")] });
      const withX = await makeEntity(Person, { props: [prop(t.id, x.id)] });

      const res = await replace({
        entityIds: ids(empty, withX),
        typeEntityId: t.id,
        fromValueEntityId: "",
        toValueEntityId: y.id,
      });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ selected: 2, unmatched: 1, changed: 1, items: 1 });
    });

    it("counts an id sent twice once and an id that does not exist not at all", async () => {
      const { t, x, y } = await tXY();
      const row = await makeEntity(Person, { props: [prop(t.id, x.id)] });

      const res = await replace({
        entityIds: [row.id, row.id, `brm-missing-${randomUUID()}`],
        typeEntityId: t.id,
        fromValueEntityId: x.id,
        toValueEntityId: y.id,
      });

      expect(res.body).toMatchObject({ selected: 1, unmatched: 0, changed: 1, items: 1 });
    });
  });

  describe("rows that cannot take the replacement", () => {
    it("takes a template row and a merge, and refuses an instance row, when Y is a template", async () => {
      const { t, x } = await tXY();
      const y = await makeEntity(Concept, { isTemplate: true });
      const templateRow = await makeEntity(Concept, {
        isTemplate: true,
        props: [prop(t.id, x.id)],
      });
      const instanceRow = await makeEntity(Person, { props: [prop(t.id, x.id)] });
      const mergedRow = await makeEntity(Person, {
        props: [prop(t.id, x.id), prop(t.id, y.id)],
      });

      const res = await replace({
        entityIds: ids(templateRow, instanceRow, mergedRow),
        typeEntityId: t.id,
        fromValueEntityId: x.id,
        toValueEntityId: y.id,
      });

      expect(res.body).toMatchObject({ selected: 3, changed: 2, merged: 1, failed: 1, items: 2 });
      expect(res.body.errors).toEqual({ [instanceRow.id]: ReplaceReason.template });
    });

    it("refuses Y itself as a row", async () => {
      const { t, x } = await tXY();
      const y = await makeEntity(Concept, { props: [prop(t.id, x.id)] });
      const row = await makeEntity(Person, { props: [prop(t.id, x.id)] });

      const res = await replace({
        entityIds: ids(y, row),
        typeEntityId: t.id,
        fromValueEntityId: x.id,
        toValueEntityId: y.id,
      });

      expect(res.body).toMatchObject({ selected: 2, changed: 1, failed: 1, items: 1 });
      expect(res.body.errors).toEqual({ [y.id]: ReplaceReason.isValue });
    });
  });

  describe("refused requests", () => {
    let t: Entity, x: Entity, y: Entity, row: Entity, value: Entity;

    beforeAll(async () => {
      ({ t, x, y } = await tXY());
      value = await makeEntity(Value);
      row = await makeEntity(Person, { props: [prop(t.id, x.id)] });
    });

    it.each<[string, () => Body]>([
      ["no typeEntityId", () => ({ typeEntityId: undefined })],
      ["no fromValueEntityId", () => ({ fromValueEntityId: undefined })],
      ["no toValueEntityId", () => ({ toValueEntityId: undefined })],
      ["an empty toValueEntityId", () => ({ toValueEntityId: "" })],
      ["X equal to Y", () => ({ toValueEntityId: x.id })],
      ["an entity id that is not a string", () => ({ entityIds: ["a", 5] as unknown as string[] })],
      [
        `${MAX_BATCH_REPLACE_ENTITIES + 1} ids`,
        () => ({
          entityIds: Array.from({ length: MAX_BATCH_REPLACE_ENTITIES + 1 }, () => randomUUID()),
        }),
      ],
      ["a Value as Y", () => ({ toValueEntityId: value.id })],
    ])("refuses %s as bad parameters", async (_, override) => {
      const res = await replace({
        entityIds: [row.id],
        typeEntityId: t.id,
        fromValueEntityId: x.id,
        toValueEntityId: y.id,
        ...override(),
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("BadParams");
    });

    it.each<[string, () => Body]>([
      ["every row", () => ({ entityIds: [`brm-missing-${randomUUID()}`] })],
      ["a Y", () => ({ toValueEntityId: `brm-missing-${randomUUID()}` })],
    ])("refuses %s that does not exist as not found", async (_, override) => {
      const res = await replace({
        entityIds: [row.id],
        typeEntityId: t.id,
        fromValueEntityId: x.id,
        toValueEntityId: y.id,
        ...override(),
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("EntityDoesNotExist");
    });
  });

  // createMockTree empties the entities table, so this block runs last
  describe("an editor", () => {
    const rand = Math.random().toString();
    const readOnlyT = `T2-${rand}`;
    const editorId = `editor-brm-${rand}`;
    const annotatorId = `annotator-brm-${rand}`;
    let editorAgent: AuthAgent;

    const statementIn = (territoryId: string, props: IProp[] = []) =>
      makeEntity(Statement, { data: { territory: { territoryId, order: 0 } }, props });

    beforeAll(async () => {
      await createMockTree(db, rand);
      await new User({
        id: editorId,
        role: UserEnums.Role.Editor,
        active: true,
        verified: true,
        rights: [
          { territory: `T1-${rand}`, mode: UserEnums.RoleMode.Write },
          { territory: readOnlyT, mode: UserEnums.RoleMode.Read },
        ],
      }).save(db.connection);
      editorAgent = await createAgentWithUserId(editorId);

      treeCache.db = db.connection;
      treeCache.tree = await treeCache.createTree();
    });

    afterAll(async () => {
      // PostgreSQL keeps a user that audits name
      await deleteAudits(db);
      await storage.users.deleteMany(db.connection, [editorId, annotatorId]);
    });

    it("is refused the rows it may not edit and leaves a row without (T, X) unmatched", async () => {
      const { t, x, y } = await tXY();
      const readOnlyStatement = await statementIn(readOnlyT, [prop(t.id, x.id)]);
      const resourceWithDocument = await makeEntity(Resource, {
        data: { documentId: `doc-${rand}` },
        props: [prop(t.id, x.id)],
      });
      const person = await makeEntity(Person, { props: [prop(t.id, x.id)] });
      const readOnlyWithoutX = await statementIn(readOnlyT, [prop(t.id, y.id)]);

      const res = await replaceAs(editorAgent, {
        entityIds: ids(readOnlyStatement, resourceWithDocument, person, readOnlyWithoutX),
        typeEntityId: t.id,
        fromValueEntityId: x.id,
        toValueEntityId: y.id,
      });

      expect(res.body).toMatchObject({
        selected: 4,
        unmatched: 1,
        changed: 1,
        failed: 2,
        items: 1,
      });
      expect(res.body.errors).toEqual({
        [readOnlyStatement.id]: ReplaceReason.denied,
        [resourceWithDocument.id]: ReplaceReason.denied,
      });
    });

    it("is refused a merge on a row it may only read, and skips that row's unequal (T, X)", async () => {
      const { t, x, y } = await tXY();
      const mergeRow = await statementIn(readOnlyT, [prop(t.id, x.id), prop(t.id, y.id)]);
      const skipRow = await statementIn(readOnlyT, [
        prop(t.id, x.id, { elvl: Elvl.Textual }),
        prop(t.id, y.id),
      ]);

      const res = await replaceAs(editorAgent, {
        entityIds: ids(mergeRow, skipRow),
        typeEntityId: t.id,
        fromValueEntityId: x.id,
        toValueEntityId: y.id,
      });

      expect(res.body).toMatchObject({
        selected: 2,
        changed: 0,
        merged: 0,
        skipped: 1,
        failed: 1,
      });
      expect(res.body.errors).toEqual({ [mergeRow.id]: ReplaceReason.denied });
      expect(res.body.skippedIds).toEqual([skipRow.id]);
    });

    it("changes a Resource with a document when it holds the annotate right for it", async () => {
      const { t, x, y } = await tXY();
      const resourceId = `brm-resource-${randomUUID()}`;
      const resourceWithDocument = await makeEntity(Resource, {
        id: resourceId,
        data: { documentId: `doc-${rand}` },
        props: [prop(t.id, x.id)],
      });
      await new User({
        id: annotatorId,
        role: UserEnums.Role.Editor,
        active: true,
        verified: true,
        rights: [{ territory: resourceId, mode: UserEnums.RoleMode.Annotate }],
      }).save(db.connection);
      const annotatorAgent = await createAgentWithUserId(annotatorId);

      const res = await replaceAs(annotatorAgent, {
        entityIds: [resourceWithDocument.id],
        typeEntityId: t.id,
        fromValueEntityId: x.id,
        toValueEntityId: y.id,
      });

      expect(res.body).toMatchObject({ selected: 1, changed: 1, failed: 0, items: 1 });
      expect(res.body.errors).toEqual({});
    });
  });
});
