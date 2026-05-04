import "ts-jest";
import { Db } from "@service/rethink";
import { clean } from "@modules/common.test";
import { AuditScope } from "@shared/types";
import Audit from "./audit";

function prepareAudit(forEntityId: string, date: Date): [string, Audit] {
  const id = Math.random().toFixed();
  const a = new Audit({
    modelId: forEntityId,
    auditScope: AuditScope.Entity,
    date: date,
  });
  return [id, a];
}

describe("test Audit.save", function () {
  const rand = Math.random().toString();

  describe("save one audit", () => {
    it("should correctly save audit instance", async () => {
      const db = new Db();
      await db.initDb();

      const [, audit] = prepareAudit(rand, new Date());

      await audit.save(db.connection);

      expect(audit.id).not.toBe("");

      await clean(db);
    });
  });
});

describe("test ResponseAudit.getFirstForEntity", function () {
  const db = new Db();
  const rand = Math.random().toString();
  const entityId = `entity-${rand}`;

  const a1Date = new Date();
  const a2Date = new Date();
  a2Date.setSeconds(a2Date.getSeconds() + 10);

  const [, a1] = prepareAudit(entityId, a1Date);
  const [, a2] = prepareAudit(entityId, a2Date);

  beforeAll(async () => {
    await db.initDb();
    await a1.save(db.connection);
    await a2.save(db.connection);
  });

  afterAll(async () => await clean(db));

  it("should return exactly the first audit entry", async () => {
    const first = await Audit.getFirstForEntity(db.connection, entityId);
    expect(first).not.toBe(null);
    if (first) {
      expect(first.id).not.toBe("");
    }
  });
});

describe("test Audit.getEarliestDate", function () {
  const db = new Db();
  const rand = Math.random().toString();
  const entityId = `entity-${rand}`;

  const a1Date = new Date("2023-01-01");
  const a2Date = new Date("2023-01-02");
  const a3Date = new Date("2023-01-03");

  const [, a1] = prepareAudit(entityId, a1Date);
  const [, a2] = prepareAudit(entityId, a2Date);
  const [, a3] = prepareAudit(entityId, a3Date);

  beforeAll(async () => {
    await db.initDb();
    // Insert in reverse order to test that it finds the earliest
    await a3.save(db.connection);
    await a2.save(db.connection);
    await a1.save(db.connection);
  });

  afterAll(async () => await clean(db));

  it("should return the earliest audit entry date", async () => {
    const earliestDate = await Audit.getEarliestDate(db.connection);
    expect(earliestDate).not.toBe(null);
    if (earliestDate) {
      expect(earliestDate.getTime()).toBe(a1Date.getTime());
    }
  });

  it("should return null when no audit entries exist", async () => {
    const emptyDb = new Db();
    await emptyDb.initDb();
    
    const earliestDate = await Audit.getEarliestDate(emptyDb.connection);
    expect(earliestDate).toBe(null);
    
    await clean(emptyDb);
  });
});

describe("test ResponseAudit.getLastNForEntity", function () {
  const db = new Db();
  const rand = Math.random().toString();
  const entityId = `entity-${rand}`;

  const a1Date = new Date();
  const a2Date = new Date();
  a2Date.setSeconds(a2Date.getSeconds() + 10);

  const [, a1] = prepareAudit(entityId, a1Date);
  const [, a2] = prepareAudit(entityId, a2Date);

  beforeAll(async () => {
    await db.initDb();
    await a1.save(db.connection);
    await a2.save(db.connection);
  });

  afterAll(async () => await clean(db));

  it("should return both entries", async () => {
    const last = await Audit.getLastNForEntity(db.connection, entityId, 2);
    expect(last).toHaveLength(2);
    expect(last[0].date).toEqual(a2.date);
    expect(last[1].date).toEqual(a1.date);
  });

  it("should return one last entry", async () => {
    const last = await Audit.getLastNForEntity(db.connection, entityId, 1);
    expect(last).toHaveLength(1);
    expect(last[0].date).toEqual(a2.date);
  });
});
