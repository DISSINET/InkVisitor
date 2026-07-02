import { Db } from "@service/rethink";
import { r as rethink } from "rethinkdb-ts";
import Relation from "./relation";
import Synonym from "./synonym";
import Audit from "@models/audit/audit";
import { DbEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { AuditScope } from "@inkvisitor/shared/types";
import { EventType } from "@inkvisitor/shared/types/stats";
import { IRequest } from "../../custom_typings/request";

/**
 * Model-level coverage for relation audits. Exercises the audit choke point
 * (save/update/delete -> afterSave/afterDelete) directly against the test DB,
 * without the HTTP layer, so it does not depend on the (separately broken)
 * supertest harness.
 */

const USER_ID = "test-relation-audit-user";

function mockRequest(db: Db): IRequest {
  return {
    db: { connection: db.connection },
    getUserOrFail: () => ({ id: USER_ID }),
  } as unknown as IRequest;
}

async function ensureDb(): Promise<void> {
  const dbName = process.env.DB_NAME as string;
  const dbs: string[] = await rethink.dbList().run(connection());
  if (!dbs.includes(dbName)) {
    await rethink.dbCreate(dbName).run(connection());
  }
}

async function ensureTable(name: string): Promise<void> {
  const tables: string[] = await rethink.tableList().run(connection());
  if (!tables.includes(name)) {
    await rethink.tableCreate(name).run(connection());
  }
}

/**
 * Mirrors the relation_entityIds multi-index declared in the db schema
 * (packages/database/scripts/import/indexes.ts) so getRelationAuditsForEntity
 * can be exercised against the test DB.
 */
async function ensureRelationEntityIdsIndex(): Promise<void> {
  const indexes: string[] = await rethink
    .table(Audit.table)
    .indexList()
    .run(connection());
  if (!indexes.includes(DbEnums.Indexes.AuditRelationEntityIds)) {
    await rethink
      .table(Audit.table)
      .indexCreate(
        DbEnums.Indexes.AuditRelationEntityIds,
        rethink.row("changes")("entityIds").default([]),
        { multi: true }
      )
      .run(connection());
    await rethink
      .table(Audit.table)
      .indexWait(DbEnums.Indexes.AuditRelationEntityIds)
      .run(connection());
  }
}

let db: Db;
const connection = () => db.connection;

async function relationAudits(modelId: string): Promise<Audit[]> {
  return (await rethink
    .table(Audit.table)
    .filter({ auditScope: AuditScope.Relation, modelId })
    .run(connection())) as Audit[];
}

function newSuperclass(entityIds: string[]): Relation {
  return new Relation({ type: RelationEnums.Type.Superclass, entityIds });
}

describe("Relation audits", () => {
  beforeAll(async () => {
    db = new Db();
    await db.initDb();
    await ensureDb();
    await ensureTable(Relation.table);
    await ensureTable(Audit.table);
    await ensureRelationEntityIdsIndex();
  });

  afterEach(async () => {
    // remove only the rows this suite produced
    await rethink
      .table(Audit.table)
      .filter({ user: USER_ID })
      .delete()
      .run(connection());
  });

  afterAll(async () => {
    await connection().close();
  });

  it("save + afterSave writes one RELATION_CREATE audit with the snapshot", async () => {
    const rel = newSuperclass(["e1", "e2"]);
    await rel.save(connection());
    await rel.afterSave(mockRequest(db));

    const audits = await relationAudits(rel.id);
    expect(audits).toHaveLength(1);
    expect(audits[0].type).toBe(EventType.RELATION_CREATE);
    expect(audits[0].user).toBe(USER_ID);
    expect((audits[0].changes as { entityIds: string[] }).entityIds).toEqual([
      "e1",
      "e2",
    ]);

    await rel.delete(connection());
  });

  it("update + afterSave writes a RELATION_EDIT audit", async () => {
    const rel = newSuperclass(["e1", "e2"]);
    await rel.save(connection());
    await rel.update(connection(), { entityIds: ["e1", "e3"] });
    await rel.afterSave(mockRequest(db));

    const audits = await relationAudits(rel.id);
    expect(audits.map((a) => a.type)).toEqual([EventType.RELATION_EDIT]);

    await rel.delete(connection());
  });

  it("afterDelete writes a RELATION_DELETE audit", async () => {
    const rel = newSuperclass(["e1", "e2"]);
    await rel.save(connection());
    await rel.delete(connection());
    await rel.afterDelete(mockRequest(db));

    const audits = await relationAudits(rel.id);
    expect(audits.map((a) => a.type)).toEqual([EventType.RELATION_DELETE]);
  });

  it("deleteMany audits and removes every relation", async () => {
    const a = newSuperclass(["e1", "e2"]);
    const b = newSuperclass(["e3", "e4"]);
    await a.save(connection());
    await b.save(connection());

    await Relation.deleteMany(mockRequest(db), [a.id, b.id]);

    expect((await relationAudits(a.id)).map((x) => x.type)).toEqual([
      EventType.RELATION_DELETE,
    ]);
    expect((await relationAudits(b.id)).map((x) => x.type)).toEqual([
      EventType.RELATION_DELETE,
    ]);

    const remaining = await rethink
      .table(Relation.table)
      .getAll(a.id, b.id)
      .run(connection());
    expect(remaining).toHaveLength(0);
  });

  it("getRelationAuditsForEntity returns relation audits touching the entity, not entity audits", async () => {
    // relation audit whose snapshot lists relE1 among its entityIds
    const rel = newSuperclass(["relE1", "relE2"]);
    await rel.save(connection());
    await rel.afterSave(mockRequest(db));

    // an entity-scoped audit for relE1 must NOT be indexed/returned (its
    // changes blob has no entityIds -> .default([]) yields no index entries)
    await Audit.createNew(
      mockRequest(db),
      AuditScope.Entity,
      "relE1",
      { class: "P" },
      EventType.CREATE
    );

    const found = await Audit.getRelationAuditsForEntity(connection(), "relE1");
    expect(found).toHaveLength(1);
    expect(found[0].auditScope).toBe(AuditScope.Relation);
    expect(found[0].type).toBe(EventType.RELATION_CREATE);
    expect(found[0].modelId).toBe(rel.id);

    // the same relation is also reachable from its other entity
    expect(
      await Audit.getRelationAuditsForEntity(connection(), "relE2")
    ).toHaveLength(1);
    // an entity with no relation audits yields nothing
    expect(
      await Audit.getRelationAuditsForEntity(connection(), "relE-none")
    ).toHaveLength(0);

    await rel.delete(connection());
  });

  it("does not persist the transient audit marker onto the relation row", async () => {
    const rel = newSuperclass(["e1", "e2"]);
    await rel.save(connection());

    const row = (await rethink
      .table(Relation.table)
      .get(rel.id)
      .run(connection())) as Record<string, unknown>;
    expect(row._auditEventType).toBeUndefined();

    await rel.delete(connection());
  });

  it("Synonym.afterSave still emits the create audit (calls super)", async () => {
    const syn = new Synonym({
      type: RelationEnums.Type.Synonym,
      entityIds: ["s1", "s2"],
    });
    await syn.save(connection());
    await syn.afterSave(mockRequest(db));

    const audits = await relationAudits(syn.id);
    expect(audits.map((a) => a.type)).toEqual([EventType.RELATION_CREATE]);

    await syn.delete(connection());
  });
});
