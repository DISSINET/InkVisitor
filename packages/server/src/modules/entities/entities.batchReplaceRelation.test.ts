import "ts-jest";
import { randomUUID } from "crypto";
import { apiPath } from "@common/constants";
import { AuthAgent, createAgentWithUserId, getAuthenticatedAgent } from "../../test/testAuth";
import { Db, storage } from "@service/storage";
import { pool } from "@middlewares/db";
import { createMockTree, seedAcl } from "@modules/common.test";
import Entity from "@models/entity/entity";
import Relation from "@models/relation/relation";
import User from "@models/user/user";
import { getEntityClass, getRelationClass } from "@models/factory";
import treeCache from "@service/treeCache";
import { EntityEnums, HttpMethods, RelationEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IRequestBatchReplaceRelation, Relation as RelationTypes } from "@inkvisitor/shared/types";
import { MAX_BATCH_REPLACE_ENTITIES } from "@inkvisitor/shared/constants";
import { ReplaceReason } from "./batch-replace-relation";

const { Classification: CLA, Superclass: SCL, SuperordinateEntity: SOE, Related: REL } =
  RelationEnums.Type;
const { Concept, Person, Location, Resource, Statement, Event } = EntityEnums.Class;

type Body = Partial<IRequestBatchReplaceRelation>;

/**
 * Every request here is a dry run: the route decides every row and counts,
 * and writes nothing, which each request checks on the relations of its type
 * and on the audits.
 */
describe("Entities batchReplaceRelation, dry run", () => {
  const db = new Db();
  let adminAgent: AuthAgent;

  const makeEntity = async (
    cls: EntityEnums.Class,
    extra: Record<string, unknown> = {}
  ): Promise<Entity> => {
    const entity = getEntityClass({
      id: `brr-${randomUUID()}`,
      class: cls,
      labels: [`brr-${cls}`],
      ...extra,
    });
    await entity.save(db.connection);
    return entity;
  };

  const relate = async (
    type: RelationEnums.Type,
    a: Entity,
    b: Entity,
    order?: number
  ): Promise<RelationTypes.IRelation> => {
    const relation = getRelationClass({
      id: `brr-rel-${randomUUID()}`,
      type,
      entityIds: [a.id, b.id],
      order,
    });
    await relation.save(db.connection);
    return relation;
  };

  const relationsOf = async (type: RelationEnums.Type): Promise<RelationTypes.IRelation[]> =>
    (await Relation.getByType(db.connection, type)).sort((a, b) => a.id.localeCompare(b.id));

  const auditCount = async (): Promise<number> =>
    (await storage.audits.all(db.connection)).length;

  const replaceAs = async (agent: AuthAgent, body: Body) => {
    const type = body.relationType ?? CLA;
    const relationsBefore = await relationsOf(type);
    const auditsBefore = await auditCount();

    const res = await agent
      .post(`${apiPath}/entities/batchReplaceRelation`)
      .send({ relationType: CLA, ...body, dryRun: true });

    if (res.status === 200) {
      const { selected, unmatched, changed, skipped, failed } = res.body;
      expect(selected).toBe(unmatched + changed + skipped + failed);
    }
    expect(await relationsOf(type)).toEqual(relationsBefore);
    expect(await auditCount()).toBe(auditsBefore);
    return res;
  };

  const replace = (body: Body) => replaceAs(adminAgent, body);

  const ids = (...entities: Entity[]) => entities.map((e) => e.id);

  beforeAll(async () => {
    await db.initDb();
    await seedAcl(db, {
      controller: "entities",
      route: "batchReplaceRelation",
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

  describe("counts", () => {
    it("replaces CLA X by CLA Y on the Resources that hold it", async () => {
      const [x, y] = [await makeEntity(Concept), await makeEntity(Concept)];
      const rows = [
        await makeEntity(Resource),
        await makeEntity(Resource),
        await makeEntity(Resource),
      ];
      for (const row of rows) {
        await relate(CLA, row, x);
      }
      const without = await makeEntity(Resource);

      const res = await replace({
        entityIds: ids(...rows, without),
        fromEntityId: x.id,
        toEntityId: y.id,
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        selected: 4,
        unmatched: 1,
        changed: 3,
        merged: 0,
        skipped: 0,
        failed: 0,
        items: 3,
        nested: 0,
        errors: {},
        result: true,
      });
    });

    it("merges a row that holds CLA X and CLA Y", async () => {
      const [x, y, row] = [
        await makeEntity(Concept),
        await makeEntity(Concept),
        await makeEntity(Person),
      ];
      await relate(CLA, row, x);
      await relate(CLA, row, y);

      const res = await replace({ entityIds: [row.id], fromEntityId: x.id, toEntityId: y.id });

      expect(res.body).toMatchObject({ selected: 1, changed: 1, merged: 1, items: 1 });
    });

    // PostgreSQL holds one relation per type and pair (unique key), so the
    // second CLA X cannot be stored there
    (storage.kind === "postgres" ? it.skip : it)(
      "counts every CLA X of a row that holds it twice",
      async () => {
        const [x, y, row] = [
          await makeEntity(Concept),
          await makeEntity(Concept),
          await makeEntity(Person),
        ];
        await relate(CLA, row, x);
        await storage.relations.insert(db.connection, {
          id: `brr-rel-${randomUUID()}`,
          type: CLA,
          entityIds: [row.id, x.id],
          order: EntityEnums.Order.Last,
        });

        const res = await replace({ entityIds: [row.id], fromEntityId: x.id, toEntityId: y.id });

        expect(res.body).toMatchObject({ selected: 1, changed: 1, merged: 0, items: 2 });
      }
    );

    it("leaves a row whose only relation to X has another type unmatched", async () => {
      const [x, y, row] = [
        await makeEntity(Location),
        await makeEntity(Location),
        await makeEntity(Location),
      ];
      await relate(SOE, row, x);

      const res = await replace({
        entityIds: [row.id],
        relationType: REL,
        fromEntityId: x.id,
        toEntityId: y.id,
      });

      expect(res.body).toMatchObject({ selected: 1, unmatched: 1, changed: 0, result: false });
    });

    it("counts an id sent twice once and an id that does not exist not at all", async () => {
      const [x, y, row] = [
        await makeEntity(Concept),
        await makeEntity(Concept),
        await makeEntity(Person),
      ];
      await relate(CLA, row, x);

      const res = await replace({
        entityIds: [row.id, row.id, `brr-missing-${randomUUID()}`],
        fromEntityId: x.id,
        toEntityId: y.id,
      });

      expect(res.body).toMatchObject({ selected: 1, unmatched: 0, changed: 1, items: 1 });
    });
  });

  describe("X among the rows", () => {
    it("leaves X unmatched when it holds SCL to itself", async () => {
      const [x, y, row] = [
        await makeEntity(Concept),
        await makeEntity(Concept),
        await makeEntity(Concept),
      ];
      await relate(SCL, x, x);
      await relate(SCL, row, x);

      const res = await replace({
        entityIds: [x.id, row.id],
        relationType: SCL,
        fromEntityId: x.id,
        toEntityId: y.id,
      });

      expect(res.body).toMatchObject({ selected: 2, unmatched: 1, changed: 1, items: 1 });
      expect(res.body.errors).toEqual({});
    });

    it("leaves X unmatched next to two rows REL to it", async () => {
      const [x, y, first, second] = [
        await makeEntity(Person),
        await makeEntity(Person),
        await makeEntity(Person),
        await makeEntity(Person),
      ];
      await relate(REL, first, x);
      await relate(REL, x, second);

      const res = await replace({
        entityIds: ids(x, first, second),
        relationType: REL,
        fromEntityId: x.id,
        toEntityId: y.id,
      });

      expect(res.body).toMatchObject({ selected: 3, unmatched: 1, changed: 2, items: 2 });
    });
  });

  describe("REL in either slot", () => {
    it("matches a row in the second slot and merges a row holding Y in the other order", async () => {
      const [x, y, second, holdsY] = [
        await makeEntity(Person),
        await makeEntity(Person),
        await makeEntity(Person),
        await makeEntity(Person),
      ];
      await relate(REL, x, second);
      await relate(REL, holdsY, x);
      await relate(REL, y, holdsY);

      const res = await replace({
        entityIds: ids(second, holdsY),
        relationType: REL,
        fromEntityId: x.id,
        toEntityId: y.id,
      });

      expect(res.body).toMatchObject({
        selected: 2,
        unmatched: 0,
        changed: 2,
        merged: 1,
        failed: 0,
        items: 2,
      });
    });
  });

  describe("SCL cycles", () => {
    // the row r and another row s are both under X; each case adds relations
    // through which Y reaches r, so r -> Y would close a cycle and s -> Y not
    const cycleCase = async (addPath: (y: Entity, r: Entity) => Promise<void>) => {
      const [x, y, r, s] = [
        await makeEntity(Concept),
        await makeEntity(Concept),
        await makeEntity(Concept),
        await makeEntity(Concept),
      ];
      await relate(SCL, r, x);
      await relate(SCL, s, x);
      await addPath(y, r);

      const res = await replace({
        entityIds: ids(r, s),
        relationType: SCL,
        fromEntityId: x.id,
        toEntityId: y.id,
      });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ selected: 2, changed: 1, failed: 1, items: 1 });
      expect(res.body.errors).toEqual({ [r.id]: ReplaceReason.cycle });
    };

    it("refuses a row that Y is a subclass of", () =>
      cycleCase(async (y, r) => {
        await relate(SCL, y, r);
      }));

    it("refuses a row that is one of two superclasses of Y", () =>
      cycleCase(async (y, r) => {
        const other = await makeEntity(Concept);
        await relate(SCL, y, other);
        await relate(SCL, y, r);
      }));

    it("walks through a loop already in the data", () =>
      cycleCase(async (y, r) => {
        const [a, b] = [await makeEntity(Concept), await makeEntity(Concept)];
        await relate(SCL, y, a);
        await relate(SCL, a, b);
        await relate(SCL, b, a);
        await relate(SCL, b, r);
      }));
  });

  describe("rows that cannot take the replacement", () => {
    it("refuses Y itself as a row", async () => {
      const [x, y, row] = [
        await makeEntity(Person),
        await makeEntity(Person),
        await makeEntity(Person),
      ];
      await relate(REL, y, x);
      await relate(REL, row, x);

      const res = await replace({
        entityIds: ids(y, row),
        relationType: REL,
        fromEntityId: x.id,
        toEntityId: y.id,
      });

      expect(res.body).toMatchObject({ selected: 2, changed: 1, failed: 1, items: 1 });
      expect(res.body.errors).toEqual({ [y.id]: ReplaceReason.isTarget });
    });

    it("refuses every matched row when Y is a template", async () => {
      const x = await makeEntity(Concept);
      const y = await makeEntity(Concept, { isTemplate: true });
      const rows = [await makeEntity(Person), await makeEntity(Person)];
      for (const row of rows) {
        await relate(CLA, row, x);
      }

      const res = await replace({ entityIds: ids(...rows), fromEntityId: x.id, toEntityId: y.id });

      expect(res.body).toMatchObject({ selected: 2, changed: 0, failed: 2, items: 0, result: false });
      expect(res.body.errors).toEqual({
        [rows[0].id]: ReplaceReason.notValid,
        [rows[1].id]: ReplaceReason.notValid,
      });
    });
  });

  describe("refused requests", () => {
    let x: Entity, y: Entity, row: Entity, person: Entity;

    beforeAll(async () => {
      [x, y, row, person] = [
        await makeEntity(Concept),
        await makeEntity(Concept),
        await makeEntity(Person),
        await makeEntity(Person),
      ];
      await relate(CLA, row, x);
    });

    it.each<[string, () => Body]>([
      ["a type outside BatchTypes", () => ({ relationType: RelationEnums.Type.Synonym })],
      ["X equal to Y", () => ({ toEntityId: x.id })],
      ["no toEntityId", () => ({ toEntityId: undefined })],
      ["an empty toEntityId", () => ({ toEntityId: "" })],
      [
        `${MAX_BATCH_REPLACE_ENTITIES + 1} ids`,
        () => ({
          entityIds: Array.from({ length: MAX_BATCH_REPLACE_ENTITIES + 1 }, () => randomUUID()),
        }),
      ],
      ["a Y whose class CLA cannot target", () => ({ toEntityId: person.id })],
    ])("refuses %s as bad parameters", async (_, override) => {
      const res = await replace({
        entityIds: [row.id],
        fromEntityId: x.id,
        toEntityId: y.id,
        ...override(),
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("BadParams");
    });

    it.each<[string, () => Body]>([
      ["an X", () => ({ fromEntityId: `brr-missing-${randomUUID()}` })],
      ["a Y", () => ({ toEntityId: `brr-missing-${randomUUID()}` })],
    ])("refuses %s that does not exist as not found", async (_, override) => {
      const res = await replace({
        entityIds: [row.id],
        fromEntityId: x.id,
        toEntityId: y.id,
        ...override(),
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("EntityDoesNotExist");
    });
  });

  // createMockTree empties the entities table, so this block runs last
  describe("an editor", () => {
    const rand = Math.random().toString();
    const writableT = `T1-${rand}`;
    const readOnlyT = `T2-${rand}`;
    const editorId = `editor-brr-${rand}`;
    const viewerId = `viewer-brr-${rand}`;
    let editorAgent: AuthAgent;
    let viewerAgent: AuthAgent;

    const statementIn = (territoryId: string) =>
      makeEntity(Statement, { data: { territory: { territoryId, order: 0 } } });

    beforeAll(async () => {
      await createMockTree(db, rand);
      for (const [id, role] of [
        [editorId, UserEnums.Role.Editor],
        [viewerId, UserEnums.Role.Viewer],
      ] as const) {
        await new User({
          id,
          role,
          active: true,
          verified: true,
          rights: [
            { territory: writableT, mode: UserEnums.RoleMode.Write },
            { territory: readOnlyT, mode: UserEnums.RoleMode.Read },
          ],
        }).save(db.connection);
      }
      editorAgent = await createAgentWithUserId(editorId);
      viewerAgent = await createAgentWithUserId(viewerId);

      treeCache.db = db.connection;
      treeCache.tree = await treeCache.createTree();
    });

    afterAll(async () => {
      await storage.users.deleteMany(db.connection, [editorId, viewerId]);
    });

    it("is refused the rows it may not edit and leaves a row without X unmatched", async () => {
      const [x, y] = [await makeEntity(Concept), await makeEntity(Concept)];
      const readOnlyStatement = await statementIn(readOnlyT);
      const resourceWithDocument = await makeEntity(Resource, {
        data: { documentId: `doc-${rand}` },
      });
      const person = await makeEntity(Person);
      const readOnlyWithoutX = await statementIn(readOnlyT);
      for (const row of [readOnlyStatement, resourceWithDocument, person]) {
        await relate(CLA, row, x);
      }

      const res = await replaceAs(editorAgent, {
        entityIds: ids(readOnlyStatement, resourceWithDocument, person, readOnlyWithoutX),
        fromEntityId: x.id,
        toEntityId: y.id,
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

    it("is refused an SOE away from an X it may only read", async () => {
      const row = await statementIn(writableT);
      const x = await statementIn(readOnlyT);
      const y = await makeEntity(Event);
      await relate(SOE, row, x);

      const res = await replaceAs(editorAgent, {
        entityIds: [row.id],
        relationType: SOE,
        fromEntityId: x.id,
        toEntityId: y.id,
      });

      expect(res.body).toMatchObject({ selected: 1, changed: 0, failed: 1 });
      expect(res.body.errors).toEqual({ [row.id]: ReplaceReason.denied });
    });

    it("is refused an SOE to a Y it may only read", async () => {
      const row = await statementIn(writableT);
      const x = await makeEntity(Event);
      const y = await statementIn(readOnlyT);
      await relate(SOE, row, x);

      const res = await replaceAs(editorAgent, {
        entityIds: [row.id],
        relationType: SOE,
        fromEntityId: x.id,
        toEntityId: y.id,
      });

      expect(res.body).toMatchObject({ selected: 1, changed: 0, failed: 1 });
      expect(res.body.errors).toEqual({ [row.id]: ReplaceReason.denied });
    });

    it("refuses a viewer", async () => {
      const [x, y, row] = [
        await makeEntity(Concept),
        await makeEntity(Concept),
        await makeEntity(Person),
      ];
      await relate(CLA, row, x);

      const res = await replaceAs(viewerAgent, {
        entityIds: [row.id],
        fromEntityId: x.id,
        toEntityId: y.id,
      });

      expect(res.status).toBe(403);
    });
  });
});
