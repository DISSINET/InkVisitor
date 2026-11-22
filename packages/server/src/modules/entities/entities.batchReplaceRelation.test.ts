import "ts-jest";
import { randomUUID } from "crypto";
import { apiPath } from "@common/constants";
import { AuthAgent, createAgentWithUserId, getAuthenticatedAgent } from "../../test/testAuth";
import { Db, storage } from "@service/storage";
import { pool } from "@middlewares/db";
import { createMockTree, seedAcl } from "@modules/common.test";
import Entity from "@models/entity/entity";
import Relation from "@models/relation/relation";
import Audit from "@models/audit/audit";
import User from "@models/user/user";
import { getEntityClass, getRelationClass } from "@models/factory";
import treeCache from "@service/treeCache";
import { deleteAudits } from "@service/shorthands";
import { EntityEnums, HttpMethods, RelationEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IRequestBatchReplaceRelation, Relation as RelationTypes } from "@inkvisitor/shared/types";
import { EventType } from "@inkvisitor/shared/types/stats";
import { MAX_BATCH_REPLACE_ENTITIES } from "@inkvisitor/shared/constants";
import { ReplaceReason } from "./batch-replace-relation";

const { Classification: CLA, Superclass: SCL, SuperordinateEntity: SOE, Related: REL } =
  RelationEnums.Type;
const { Concept, Person, Location, Resource, Statement, Event } = EntityEnums.Class;

type Body = Partial<IRequestBatchReplaceRelation>;

/**
 * `replace` and `replaceAs` send a dry run: the route decides every row and
 * counts, and writes nothing, which each of them checks on the relations of
 * the type and on the audits. `save` and `saveAs` send the body without
 * `dryRun`; their tests check the relations and audits the save leaves.
 */
describe("Entities batchReplaceRelation", () => {
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

  const saveAs = async (agent: AuthAgent, body: Body) => {
    const res = await agent
      .post(`${apiPath}/entities/batchReplaceRelation`)
      .send({ relationType: CLA, ...body });

    if (res.status === 200) {
      const { selected, unmatched, changed, skipped, failed } = res.body;
      expect(selected).toBe(unmatched + changed + skipped + failed);
    }
    return res;
  };

  const save = (body: Body) => saveAs(adminAgent, body);

  const ids = (...entities: Entity[]) => entities.map((e) => e.id);

  const relationsOfRow = async (
    type: RelationEnums.Type,
    row: Entity
  ): Promise<RelationTypes.IRelation[]> =>
    (await relationsOf(type)).filter((relation) => relation.entityIds.includes(row.id));

  // the other end of each relation of the type the row holds, sorted
  const targetsOf = async (type: RelationEnums.Type, row: Entity): Promise<string[]> =>
    (await relationsOfRow(type, row))
      .map((relation) => relation.entityIds.find((id) => id !== row.id) as string)
      .sort();

  // "<event type> <relation id>" of every relation audit that names the entity, sorted
  const auditsOf = async (entity: Entity): Promise<string[]> =>
    (await Audit.getRelationAuditsForEntity(db.connection, entity.id, 100))
      .map(({ type, modelId }) => `${type} ${modelId}`)
      .sort();
  const created = (id: string) => `${EventType.RELATION_CREATE} ${id}`;
  const deleted = (id: string) => `${EventType.RELATION_DELETE} ${id}`;

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

    it("leaves Y unmatched as a row when it has no relation to X", async () => {
      const [x, y, row] = [
        await makeEntity(Person),
        await makeEntity(Person),
        await makeEntity(Person),
      ];
      await relate(REL, row, x);

      const res = await replace({
        entityIds: ids(y, row),
        relationType: REL,
        fromEntityId: x.id,
        toEntityId: y.id,
      });

      expect(res.body).toMatchObject({ selected: 2, unmatched: 1, changed: 1, failed: 0 });
      expect(res.body.errors).toEqual({});
    });

    it("counts a row that already holds a template Y as merged, not as not valid", async () => {
      const x = await makeEntity(Concept);
      const y = await makeEntity(Concept, { isTemplate: true });
      const row = await makeEntity(Person);
      await relate(CLA, row, x);
      await relate(CLA, row, y);

      const res = await replace({ entityIds: [row.id], fromEntityId: x.id, toEntityId: y.id });

      expect(res.body).toMatchObject({ selected: 1, changed: 1, merged: 1, failed: 0, items: 1 });
      expect(res.body.errors).toEqual({});
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
      ["an entity id that is not a string", () => ({ entityIds: ["a", 5] as unknown as string[] })],
      ["an empty entity id", () => ({ entityIds: [""] })],
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
      ["every row", () => ({ entityIds: [`brr-missing-${randomUUID()}`] })],
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

  describe("a save", () => {
    afterEach(() => jest.restoreAllMocks());

    it("replaces CLA X by CLA Y with its order and audits, as its dry run counted", async () => {
      const [x, y] = [await makeEntity(Concept), await makeEntity(Concept)];
      const rows = [
        await makeEntity(Resource),
        await makeEntity(Resource),
        await makeEntity(Resource),
      ];
      const old: RelationTypes.IRelation[] = [];
      for (const [i, row] of rows.entries()) {
        old.push(await relate(CLA, row, x, i + 1));
      }
      const without = await makeEntity(Resource);
      const notSelected = await makeEntity(Resource);
      const untouched = await relate(CLA, notSelected, x, 7);
      const body = { entityIds: ids(...rows, without), fromEntityId: x.id, toEntityId: y.id };

      const dry = await replace(body);
      const res = await save(body);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(dry.body);
      expect(res.body).toMatchObject({ changed: 3, failed: 0, items: 3 });

      const copies: RelationTypes.IRelation[] = [];
      for (const [i, row] of rows.entries()) {
        const held = await relationsOfRow(CLA, row);
        expect(held).toHaveLength(1);
        expect(held[0]).toMatchObject({ entityIds: [row.id, y.id], order: i + 1 });
        expect(await auditsOf(row)).toEqual([created(held[0].id), deleted(old[i].id)].sort());
        copies.push(held[0]);
      }
      expect(await auditsOf(y)).toEqual(copies.map(({ id }) => created(id)).sort());
      expect(await auditsOf(x)).toEqual(old.map(({ id }) => deleted(id)).sort());
      expect(await relationsOfRow(CLA, notSelected)).toEqual([{ ...untouched }]);
      expect(await relationsOfRow(CLA, without)).toEqual([]);

      const relationsBefore = await relationsOf(CLA);
      const auditsBefore = await auditCount();
      const again = await save(body);

      expect(again.body).toMatchObject({
        selected: 4,
        unmatched: 4,
        changed: 0,
        items: 0,
        result: false,
      });
      expect(await relationsOf(CLA)).toEqual(relationsBefore);
      expect(await auditCount()).toBe(auditsBefore);
    });

    it("leaves a row holding CLA X and CLA Y with CLA Y only", async () => {
      const [x, y, row] = [
        await makeEntity(Concept),
        await makeEntity(Concept),
        await makeEntity(Person),
      ];
      await relate(CLA, row, x);
      const kept = await relate(CLA, row, y);

      const res = await save({ entityIds: [row.id], fromEntityId: x.id, toEntityId: y.id });

      expect(res.body).toMatchObject({ changed: 1, merged: 1, failed: 0, items: 1 });
      expect((await relationsOfRow(CLA, row)).map(({ id }) => id)).toEqual([kept.id]);
    });

    // PostgreSQL holds one relation per type and pair (unique key), so the
    // second CLA X cannot be stored there
    (storage.kind === "postgres" ? it.skip : it)(
      "leaves a row holding CLA X twice with CLA Y once",
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

        const res = await save({ entityIds: [row.id], fromEntityId: x.id, toEntityId: y.id });

        expect(res.body).toMatchObject({ changed: 1, merged: 0, failed: 0, items: 2 });
        expect(await targetsOf(CLA, row)).toEqual([y.id]);
      }
    );

    it("puts Y in the slot X had in a REL", async () => {
      const [x, y, row] = [
        await makeEntity(Person),
        await makeEntity(Person),
        await makeEntity(Person),
      ];
      await relate(REL, x, row);

      const res = await save({
        entityIds: [row.id],
        relationType: REL,
        fromEntityId: x.id,
        toEntityId: y.id,
      });

      expect(res.body).toMatchObject({ changed: 1, failed: 0, items: 1 });
      expect((await relationsOfRow(REL, row)).map(({ entityIds }) => entityIds)).toEqual([
        [y.id, row.id],
      ]);
    });

    it("replaces an SCL stored without order by a copy without one", async () => {
      const [x, y, row] = [
        await makeEntity(Concept),
        await makeEntity(Concept),
        await makeEntity(Concept),
      ];
      // the Superclass model sets an order on every relation it builds
      await storage.relations.insert(db.connection, {
        id: `brr-rel-${randomUUID()}`,
        type: SCL,
        entityIds: [row.id, x.id],
      });
      expect(typeof (await relationsOfRow(SCL, row))[0].order).not.toBe("number");

      const res = await save({
        entityIds: [row.id],
        relationType: SCL,
        fromEntityId: x.id,
        toEntityId: y.id,
      });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ changed: 1, failed: 0, items: 1 });
      const held = await relationsOfRow(SCL, row);
      expect(held.map(({ entityIds }) => entityIds)).toEqual([[row.id, y.id]]);
      expect(typeof held[0].order).not.toBe("number");
    });

    it("deletes nothing when the insert fails", async () => {
      const [x, y] = [await makeEntity(Concept), await makeEntity(Concept)];
      const rows = [await makeEntity(Person), await makeEntity(Person)];
      for (const row of rows) {
        await relate(CLA, row, x);
      }
      jest
        .spyOn(Relation, "insertMany")
        .mockImplementationOnce(async (_, relations) => ({
          written: [],
          failed: relations.map(({ id }) => id),
        }));

      const res = await save({ entityIds: ids(...rows), fromEntityId: x.id, toEntityId: y.id });

      expect(res.body).toMatchObject({
        selected: 2,
        changed: 0,
        failed: 2,
        items: 0,
        result: false,
      });
      expect(res.body.errors).toEqual({
        [rows[0].id]: ReplaceReason.insertFailed,
        [rows[1].id]: ReplaceReason.insertFailed,
      });
      for (const row of rows) {
        expect(await targetsOf(CLA, row)).toEqual([x.id]);
        expect(await auditsOf(row)).toEqual([]);
      }
      expect(await auditsOf(x)).toEqual([]);
    });

    it("reports rows whose old relation stayed as holding both, and a second save finishes them", async () => {
      const [x, y] = [await makeEntity(Concept), await makeEntity(Concept)];
      const rows = [await makeEntity(Person), await makeEntity(Person)];
      for (const row of rows) {
        await relate(CLA, row, x);
      }
      const body = { entityIds: ids(...rows), fromEntityId: x.id, toEntityId: y.id };
      jest.spyOn(Relation, "deleteMany").mockRejectedValueOnce(new Error("delete refused"));

      const res = await save(body);

      expect(res.body).toMatchObject({ changed: 0, merged: 0, failed: 2, items: 0 });
      expect(res.body.errors).toEqual({
        [rows[0].id]: ReplaceReason.bothKept,
        [rows[1].id]: ReplaceReason.bothKept,
      });
      for (const row of rows) {
        expect(await targetsOf(CLA, row)).toEqual([x.id, y.id].sort());
      }

      const again = await save(body);

      expect(again.body).toMatchObject({ changed: 2, merged: 2, failed: 0, items: 2 });
      for (const row of rows) {
        expect(await targetsOf(CLA, row)).toEqual([y.id]);
      }
    });

    it("counts the relations a delete removed before it threw", async () => {
      const [x, y] = [await makeEntity(Concept), await makeEntity(Concept)];
      const rows = [await makeEntity(Person), await makeEntity(Person)];
      for (const row of rows) {
        await relate(CLA, row, x);
      }
      const deleteMany = Relation.deleteMany;
      jest.spyOn(Relation, "deleteMany").mockImplementationOnce(async (request, relationIds) => {
        await deleteMany(request, relationIds);
        throw new Error("audits refused");
      });

      const res = await save({ entityIds: ids(...rows), fromEntityId: x.id, toEntityId: y.id });

      expect(res.body).toMatchObject({ changed: 2, failed: 0, items: 2 });
      expect(res.body.errors).toEqual({});
      for (const row of rows) {
        expect(await targetsOf(CLA, row)).toEqual([y.id]);
      }
    });

    it("reports only the row whose old relation the delete left", async () => {
      const [x, y] = [await makeEntity(Concept), await makeEntity(Concept)];
      const [removedRow, keptRow] = [await makeEntity(Person), await makeEntity(Person)];
      const removedOld = await relate(CLA, removedRow, x);
      await relate(CLA, keptRow, x);
      const deleteMany = Relation.deleteMany;
      jest
        .spyOn(Relation, "deleteMany")
        .mockImplementationOnce((request) => deleteMany(request, [removedOld.id]));

      const res = await save({
        entityIds: ids(removedRow, keptRow),
        fromEntityId: x.id,
        toEntityId: y.id,
      });

      expect(res.body).toMatchObject({ changed: 1, failed: 1, items: 1 });
      expect(res.body.errors).toEqual({ [keptRow.id]: ReplaceReason.bothKept });
      expect(await targetsOf(CLA, removedRow)).toEqual([y.id]);
      expect(await targetsOf(CLA, keptRow)).toEqual([x.id, y.id].sort());
    });

    it("deletes X from the written and the merged rows when one insert fails", async () => {
      const [x, y] = [await makeEntity(Concept), await makeEntity(Concept)];
      const [writtenRow, refusedRow, mergedRow] = [
        await makeEntity(Person),
        await makeEntity(Person),
        await makeEntity(Person),
      ];
      for (const row of [writtenRow, refusedRow, mergedRow]) {
        await relate(CLA, row, x);
      }
      await relate(CLA, mergedRow, y);
      const insertMany = Relation.insertMany;
      jest.spyOn(Relation, "insertMany").mockImplementationOnce(async (request, relations) => {
        const refused = relations.filter(({ entityIds }) => entityIds[0] === refusedRow.id);
        const { written } = await insertMany(
          request,
          relations.filter((relation) => !refused.includes(relation))
        );
        return { written, failed: refused.map(({ id }) => id) };
      });

      const res = await save({
        entityIds: ids(writtenRow, refusedRow, mergedRow),
        fromEntityId: x.id,
        toEntityId: y.id,
      });

      expect(res.body).toMatchObject({ changed: 2, merged: 1, failed: 1, items: 2 });
      expect(res.body.errors).toEqual({ [refusedRow.id]: ReplaceReason.insertFailed });
      expect(await targetsOf(CLA, writtenRow)).toEqual([y.id]);
      expect(await targetsOf(CLA, mergedRow)).toEqual([y.id]);
      expect(await targetsOf(CLA, refusedRow)).toEqual([x.id]);
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
      // the editor's save leaves audits naming the editor, and PostgreSQL keeps
      // a user that audits name
      await deleteAudits(db);
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

    it("is refused a row it may only read that holds CLA X and CLA Y, before the merge", async () => {
      const [x, y] = [await makeEntity(Concept), await makeEntity(Concept)];
      const row = await statementIn(readOnlyT);
      await relate(CLA, row, x);
      await relate(CLA, row, y);

      const res = await replaceAs(editorAgent, {
        entityIds: [row.id],
        fromEntityId: x.id,
        toEntityId: y.id,
      });

      expect(res.body).toMatchObject({ selected: 1, changed: 0, merged: 0, failed: 1 });
      expect(res.body.errors).toEqual({ [row.id]: ReplaceReason.denied });
    });

    it("saves the rows it may edit and leaves the refused ones as they were", async () => {
      const [x, y] = [await makeEntity(Concept), await makeEntity(Concept)];
      const readOnlyWithY = await statementIn(readOnlyT);
      const resourceWithDocument = await makeEntity(Resource, {
        data: { documentId: `doc-${rand}` },
      });
      const person = await makeEntity(Person);
      for (const row of [readOnlyWithY, resourceWithDocument, person]) {
        await relate(CLA, row, x);
      }
      await relate(CLA, readOnlyWithY, y);

      const res = await saveAs(editorAgent, {
        entityIds: ids(readOnlyWithY, resourceWithDocument, person),
        fromEntityId: x.id,
        toEntityId: y.id,
      });

      expect(res.body).toMatchObject({ selected: 3, changed: 1, merged: 0, failed: 2, items: 1 });
      expect(res.body.errors).toEqual({
        [readOnlyWithY.id]: ReplaceReason.denied,
        [resourceWithDocument.id]: ReplaceReason.denied,
      });
      expect(await targetsOf(CLA, person)).toEqual([y.id]);
      expect(await targetsOf(CLA, readOnlyWithY)).toEqual([x.id, y.id].sort());
      expect(await targetsOf(CLA, resourceWithDocument)).toEqual([x.id]);
      expect(await auditsOf(readOnlyWithY)).toEqual([]);
      expect(await auditsOf(resourceWithDocument)).toEqual([]);
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

    it("refuses a viewer's save and changes nothing", async () => {
      const [x, y, row] = [
        await makeEntity(Concept),
        await makeEntity(Concept),
        await makeEntity(Person),
      ];
      await relate(CLA, row, x);
      const relationsBefore = await relationsOf(CLA);
      const auditsBefore = await auditCount();

      const res = await saveAs(viewerAgent, {
        entityIds: [row.id],
        fromEntityId: x.id,
        toEntityId: y.id,
      });

      expect(res.status).toBe(403);
      expect(await relationsOf(CLA)).toEqual(relationsBefore);
      expect(await auditCount()).toBe(auditsBefore);
    });
  });
});
