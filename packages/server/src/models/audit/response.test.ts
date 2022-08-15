import "ts-jest";
import { Db } from "@service/RethinkDB";
import { clean } from "@modules/common.test";
import Audit from "./audit";
import { ResponseAudit } from "./response";

function prepareAudit(forEntityId: string, date: Date): [string, Audit] {
  const id = Math.random().toFixed();
  const a = new Audit({
    entityId: forEntityId,
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
    const response = new ResponseAudit(entityId);
    await response.getFirstForEntity(db.connection);
    expect(response.first).not.toBe(null);
    if (response.first) {
      expect(response.first.id).not.toBe("");
    }
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
    const response = new ResponseAudit(entityId);
    await response.getLastNForEntity(db.connection, 2);
    expect(response.last).toHaveLength(2);
    expect(response.last[0].date).toEqual(a2.date);
    expect(response.last[1].date).toEqual(a1.date);
  });

  it("should return one last entry", async () => {
    const response = new ResponseAudit(entityId);
    await response.getLastNForEntity(db.connection, 1);
    expect(response.last).toHaveLength(1);
    expect(response.last[0].date).toEqual(a2.date);
  });
});
