import { DbEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { Conn, Row, storage } from "@service/storage";
import { closeTestDb, openTestDb } from "../../test/db";
import { TABLE } from "./names";
import { EXTRA_INDEXES, TABLES as PG_TABLES } from "./postgres/provision";
import { q } from "./postgres/tables";

/**
 * Behaviour of the storage adapter, the same file on both backends: run with
 * `pnpm test` (RethinkDB) and `pnpm test:contract:pg` (PostgreSQL). Every
 * operation the models call on the standalone tables is exercised here with
 * its ordering and filtering pinned. isolate.ts empties the mutable tables and
 * re-seeds the admin user before this file; acl_permissions and the stats
 * tables are not reset, so those blocks clean up after themselves.
 */
const onPostgres = storage.kind === "postgres";
const itPg = onPostgres ? it : it.skip;

let conn: Conn;
beforeAll(async () => {
  conn = await openTestDb();
});
afterAll(async () => {
  await closeTestDb(conn);
});

const insertUsers = (...userIds: string[]) =>
  storage.users.insert(conn, userIds.map((id) => ({ id, name: id, email: `${id}@x` })));

const ids = (rows: { id: string }[]) => rows.map((r) => r.id).sort();

describe("connection", () => {
  it("lists every catalogue table", async () => {
    const tables = await storage.tableList(conn);
    for (const table of Object.keys(PG_TABLES)) {
      expect(tables).toContain(table);
    }
  });

  it("pings and reports open until closed", async () => {
    const extra = await storage.openConnection();
    expect(storage.isOpen(extra)).toBe(true);
    await expect(storage.ping(extra)).resolves.toBeUndefined();
    await storage.closeConnection(extra, { noreplyWait: false });
    expect(storage.isOpen(extra)).toBe(false);
  });

  it("finds every required index", async () => {
    await expect(storage.assertRequiredIndexes(conn)).resolves.toBeUndefined();
  });
});

describe("generic store", () => {
  const settings = storage.settings;

  beforeEach(async () => {
    await settings.deleteAll(conn);
  });

  it("inserts rows, generating ids only for rows without one, in input order", async () => {
    // only absent ids are exercised: RethinkDB stores an empty string as a
    // key, and no model sends one (they send `id: this.id || undefined`)
    const result = await settings.insert(conn, [
      { value: 1 },
      { id: "s-fixed", value: 2 },
      { value: 3 },
    ]);
    expect(result.inserted).toBe(3);
    expect(result.errors).toBe(0);
    expect(result.generated_keys).toHaveLength(2);
    const rows = await settings.all(conn);
    expect(ids(rows)).toEqual([...result.generated_keys!, "s-fixed"].sort());
    expect(rows.find((r) => r.id === result.generated_keys![0])?.value).toBe(1);
    expect(rows.find((r) => r.id === result.generated_keys![1])?.value).toBe(3);
  });

  it("omits generated_keys when every row carries an id", async () => {
    const result = await settings.insert(conn, { id: "s1", value: 1 });
    expect(result.inserted).toBe(1);
    expect(result.generated_keys).toBeUndefined();
  });

  it("reports a duplicate id as an error with first_error", async () => {
    await settings.insert(conn, { id: "s1", value: 1 });
    const result = await settings.insert(conn, [{ id: "s1", value: 2 }, { id: "s2", value: 3 }]);
    expect(result.inserted).toBe(1);
    expect(result.errors).toBe(1);
    expect(result.first_error).toMatch(/Duplicate primary key/);
    expect((await settings.get(conn, "s1"))?.value).toBe(1);
  });

  it("names the repeated id when a batch duplicates itself", async () => {
    const result = await settings.insert(conn, [{ id: "s1", value: 1 }, { id: "s1", value: 2 }]);
    expect(result.inserted).toBe(1);
    expect(result.errors).toBe(1);
    expect(result.first_error).toMatch(/s1/);
  });

  it("returns empty results for empty inputs", async () => {
    await settings.insert(conn, { id: "s1", value: 1 });
    expect(await settings.getMany(conn, [])).toEqual([]);
    expect(await storage.entities.byIndex(conn, DbEnums.Indexes.Class, [])).toEqual([]);
    expect(await storage.audits.byIndex(conn, DbEnums.Indexes.AuditScopeModelId, [])).toEqual([]);
    expect((await settings.deleteMany(conn, [])).deleted).toBe(0);
    expect((await settings.insert(conn, [])).inserted).toBe(0);
    expect(await settings.all(conn)).toHaveLength(1);
  });

  it("gets one, many and all", async () => {
    await settings.insert(conn, [{ id: "b", value: 2 }, { id: "a", value: 1 }, { id: "c", value: 3 }]);
    expect(await settings.get(conn, "a")).toEqual({ id: "a", value: 1 });
    expect(await settings.get(conn, "nope")).toBeNull();
    expect(ids(await settings.getMany(conn, ["c", "a", "nope"]))).toEqual(["a", "c"]);
    expect(ids(await settings.all(conn))).toEqual(["a", "b", "c"]);
  });

  it("update merges nested objects, replaces arrays, sets null and keeps absent keys", async () => {
    await settings.insert(conn, {
      id: "s1",
      value: { keep: 1, nested: { x: 1, y: 2 }, list: ["a", "b"] },
      public: false,
    });
    const result = await settings.update(conn, "s1", {
      value: { nested: { y: 3, z: null }, list: ["c"] },
    });
    expect(result.replaced).toBe(1);
    expect(result.unchanged).toBe(0);
    expect(await settings.get(conn, "s1")).toEqual({
      id: "s1",
      value: { keep: 1, nested: { x: 1, y: 3, z: null }, list: ["c"] },
      public: false,
    });
  });

  it("update reports unchanged for a patch that changes nothing and skipped for a missing row", async () => {
    await settings.insert(conn, { id: "s1", value: { a: 1 } });
    const same = await settings.update(conn, "s1", { value: { a: 1 } });
    expect(same.replaced).toBe(0);
    expect(same.unchanged).toBe(1);
    const missing = await settings.update(conn, "nope", { value: 2 });
    expect(missing.skipped).toBe(1);
    expect(missing.replaced).toBe(0);
  });

  it("replace overwrites the whole document", async () => {
    await settings.insert(conn, { id: "s1", value: 1, public: true });
    const result = await settings.replace(conn, "s1", { id: "s1", value: 2 });
    expect(result.replaced).toBe(1);
    expect(await settings.get(conn, "s1")).toEqual({ id: "s1", value: 2 });
    expect((await settings.replace(conn, "s1", { id: "s1", value: 2 })).unchanged).toBe(1);
  });

  it("refuses to move a row to another primary key", async () => {
    await settings.insert(conn, { id: "s1", value: 1 });
    const moved = await settings.update(conn, "s1", { id: "s2", value: 2 });
    expect(moved.errors).toBe(1);
    expect(moved.replaced).toBe(0);
    expect(moved.first_error).toMatch(/Primary key/);
    const replaced = await settings.replace(conn, "s1", { id: "s2", value: 2 });
    expect(replaced.errors).toBe(1);
    expect(replaced.replaced).toBe(0);
    expect((await settings.update(conn, "s1", { id: "s1", value: 3 })).replaced).toBe(1);
    expect(ids(await settings.all(conn))).toEqual(["s1"]);
    expect((await settings.get(conn, "s1"))?.value).toBe(3);
  });

  it("insert with conflict replace counts new, rewritten and unchanged rows", async () => {
    await settings.insert(conn, [{ id: "s1", value: 1 }, { id: "s2", value: 2 }]);
    const result = await settings.insert(
      conn,
      [{ id: "s1", value: 1 }, { id: "s2", value: 20 }, { id: "s3", value: 3 }],
      { conflict: "replace" }
    );
    expect(result.inserted).toBe(1);
    expect(result.replaced).toBe(1);
    expect(result.unchanged).toBe(1);
    expect((await settings.get(conn, "s2"))?.value).toBe(20);
  });

  it("insert with conflict update merges into the existing row", async () => {
    await settings.insert(conn, { id: "s1", value: { a: 1 }, public: false });
    const result = await settings.insert(conn, { id: "s1", value: { b: 2 } }, { conflict: "update" });
    expect(result.replaced).toBe(1);
    expect(await settings.get(conn, "s1")).toEqual({ id: "s1", value: { a: 1, b: 2 }, public: false });
  });

  // RethinkDB supports the combination; PostgreSQL refuses it, as its conflict
  // statement returns written rows only
  itPg("insert refuses returnChanges with conflict replace", async () => {
    await expect(
      settings.insert(conn, [{ id: "g1", value: 1 }], { conflict: "replace", returnChanges: true })
    ).rejects.toThrow("not implemented");
  });

  it("deletes one, many with changes, and all", async () => {
    await settings.insert(conn, [{ id: "a", value: 1 }, { id: "b", value: 2 }, { id: "c", value: 3 }]);
    expect((await settings.delete(conn, "a")).deleted).toBe(1);
    expect((await settings.delete(conn, "a")).deleted).toBe(0);
    const many = await settings.deleteMany(conn, ["b", "nope"], { returnChanges: true });
    expect(many.deleted).toBe(1);
    expect(many.changes).toEqual([{ new_val: null, old_val: { id: "b", value: 2 } }]);
    expect((await settings.deleteAll(conn)).deleted).toBe(1);
    expect(await settings.all(conn)).toEqual([]);
  });

  it("insert with returnChanges lists every written row and marks a duplicate with an error", async () => {
    await settings.insert(conn, { id: "dup", value: 0 });
    const result = await settings.insert(conn, [{ id: "n1", value: 1 }, { id: "dup", value: 2 }], { returnChanges: true });
    expect(result.inserted).toBe(1);
    expect(result.errors).toBe(1);
    const changes = result.changes!;
    expect(changes.filter((c) => c.new_val && !c.error).map((c) => c.new_val!.id)).toEqual(["n1"]);
    expect(changes.filter((c) => c.error)).toHaveLength(1);
    // the refused row repeats the row as stored, not the rejected document
    expect(changes.find((c) => c.error)!.new_val).toEqual({ id: "dup", value: 0 });
  });

  it("updateMany merges one patch into every existing row and ignores missing ids", async () => {
    await settings.insert(conn, [{ id: "m1", value: { a: 1 } }, { id: "m2", value: { a: 1, b: 2 } }]);
    const result = await settings.updateMany(conn, ["m1", "m2", "missing"], { value: { b: 2 } }, { returnChanges: true });
    expect(result.replaced).toBe(1);
    expect(result.unchanged).toBe(1);
    expect(result.errors).toBe(0);
    // every existing row has an entry, the unchanged one too (ReQL "always")
    expect(result.changes!.map((c) => c.new_val!.id).sort()).toEqual(["m1", "m2"]);
    expect((await settings.get(conn, "m1"))?.value).toEqual({ a: 1, b: 2 });
    expect((await settings.updateMany(conn, ["m1"], { value: { c: 3 } })).changes).toBeUndefined();
  });

  it("updateMany refuses a patch that moves the id", async () => {
    await settings.insert(conn, { id: "m3", value: 1 });
    const result = await settings.updateMany(conn, ["m3"], { id: "moved", value: 2 }, { returnChanges: true });
    expect(result.errors).toBe(1);
    expect(result.first_error).toContain("Primary key");
    expect(result.changes!.every((c) => c.error)).toBe(true);
    expect((await settings.get(conn, "m3"))?.value).toBe(1);
  });

  it("updateEach merges each row's own patch, counts a missing id as skipped and an id move as an error", async () => {
    await settings.insert(conn, [{ id: "e1", value: 1 }, { id: "e2", value: 2 }]);
    const result = await settings.updateEach(
      conn,
      [{ id: "e1", patch: { value: 10 } }, { id: "e2", patch: { value: 2 } }, { id: "nope", patch: { value: 3 } }],
      { returnChanges: true }
    );
    expect(result.replaced).toBe(1);
    expect(result.unchanged).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.changes!.filter((c) => c.new_val).map((c) => c.new_val!.id).sort()).toEqual(["e1", "e2"]);
    expect((await settings.get(conn, "e1"))?.value).toBe(10);
    const moved = await settings.updateEach(conn, [{ id: "e2", patch: { id: "moved", value: 5 } }], { returnChanges: true });
    expect(moved.errors).toBe(1);
    expect(moved.changes!.filter((c) => c.error)).toHaveLength(1);
    expect((await settings.get(conn, "e2"))?.value).toBe(2);
    expect(await settings.updateEach(conn, [])).toMatchObject({ replaced: 0, errors: 0 });
  });

  it("stores a NUL code point as absent rather than failing", async () => {
    await settings.insert(conn, { id: "s1", value: "a\u0000b" });
    const value = (await settings.get(conn, "s1"))?.value as string;
    expect(value.replace("\u0000", "")).toBe("ab");
  });
});

describe("secondary indexes through byIndex", () => {
  it("single btree: entities by class", async () => {
    await storage.entities.insert(conn, [
      { id: "e1", class: "C" },
      { id: "e2", class: "P" },
      { id: "e3", class: "C" },
    ]);
    expect(ids(await storage.entities.byIndex(conn, DbEnums.Indexes.Class, ["C"]))).toEqual(["e1", "e3"]);
    expect(ids(await storage.entities.byIndex(conn, DbEnums.Indexes.Class, ["C", "P"]))).toEqual(["e1", "e2", "e3"]);
    expect(ids(await storage.entities.byClass(conn, "P" as any))).toEqual(["e2"]);
  });

  it("compound btree: audits by scope and model", async () => {
    await storage.audits.insert(conn, [
      { id: "a1", auditScope: "entity", modelId: "m1", date: new Date("2024-01-01T00:00:00Z") },
      { id: "a2", auditScope: "document", modelId: "m1", date: new Date("2024-01-02T00:00:00Z") },
      { id: "a3", auditScope: "entity", modelId: "m2", date: new Date("2024-01-03T00:00:00Z") },
    ]);
    expect(ids(await storage.audits.byIndex(conn, DbEnums.Indexes.AuditScopeModelId, [["entity", "m1"]]))).toEqual(["a1"]);
    expect(
      ids(await storage.audits.byIndex(conn, DbEnums.Indexes.AuditScopeModelId, [["entity", "m1"], ["document", "m1"]]))
    ).toEqual(["a1", "a2"]);
  });

  it("gin: documents by entity id in both entityIds shapes", async () => {
    await storage.documents.insert(conn, [
      { id: "d1", title: "t", content: "x", entityIds: { C: ["e1"], P: ["e2"] } },
      { id: "d2", title: "t", content: "x", entityIds: ["e2", "e3"] },
      { id: "d3", title: "t", content: "x", entityIds: {} },
    ]);
    expect(ids(await storage.documents.byIndex(conn, DbEnums.Indexes.DocumentEntityIds, ["e2"]))).toEqual(["d1", "d2"]);
    expect(ids(await storage.documents.byIndex(conn, DbEnums.Indexes.DocumentEntityIds, ["e3"]))).toEqual(["d2"]);
  });
});

describe("dates", () => {
  it("come back as Date objects on every listed field", async () => {
    // ids prefixed dt- so they never collide with the fixtures of the other blocks
    const date = new Date("2024-03-02T10:20:30.123Z");
    await storage.audits.insert(conn, { id: "dt-a1", auditScope: "entity", modelId: "m", user: "1", date, changes: {}, type: "edit" });
    await storage.documents.insert(conn, { id: "dt-d1", title: "t", content: "", createdAt: date, updatedAt: date });
    await storage.savedQueries.insert(conn, { id: "dt-q1", name: "n", ownerId: "1", shared: false, data: {}, createdAt: date });
    await storage.users.insert(conn, { id: "dt-u1", name: "x", email: "x@x", deletedAt: date });
    await storage.stats("day").insert(conn, { id: "dt-st1", date: "2024-03-02", lastUpdated: date });
    try {
      expect((await storage.audits.get(conn, "dt-a1"))?.date).toEqual(date);
      expect((await storage.documents.get(conn, "dt-d1"))?.updatedAt).toEqual(date);
      expect((await storage.savedQueries.get(conn, "dt-q1"))?.createdAt).toEqual(date);
      expect((await storage.users.get(conn, "dt-u1"))?.deletedAt).toEqual(date);
      expect((await storage.stats("day").get(conn, "dt-st1"))?.lastUpdated).toEqual(date);
    } finally {
      await storage.stats("day").delete(conn, "dt-st1");
      await storage.audits.delete(conn, "dt-a1");
      await storage.savedQueries.delete(conn, "dt-q1");
    }
  });

  it("stores a Date carried by an update patch", async () => {
    const created = new Date("2024-03-02T00:00:00.000Z");
    const updated = new Date("2024-03-03T00:00:00.000Z");
    await storage.savedQueries.insert(conn, { id: "dt-q2", name: "n", ownerId: "1", shared: false, data: {}, createdAt: created });
    await storage.savedQueries.update(conn, "dt-q2", { updatedAt: updated });
    const row = await storage.savedQueries.get(conn, "dt-q2");
    expect(row?.createdAt).toEqual(created);
    expect(row?.updatedAt).toEqual(updated);
    await storage.savedQueries.delete(conn, "dt-q2");
  });
});

describe("users", () => {
  const trashed = new Date("2024-01-01T00:00:00Z");
  beforeAll(async () => {
    await storage.users.deleteAllExceptName(conn, "admin");
    await storage.users.insert(conn, [
      { id: "u-b", name: "beta", email: "beta@x", role: "viewer", hash: "h-b", bookmarks: [{ id: "f", name: "f", entityIds: ["e1", "e2"] }], storedTerritories: [{ territoryId: "t1" }] },
      { id: "u-a", name: "alpha", email: "alpha@x", role: "viewer", bookmarks: [], storedTerritories: [{ territoryId: "t2" }] },
      { id: "u-e", name: "ed", email: "ed@x", role: "editor", bookmarks: [{ id: "g", name: "g", entityIds: ["e2"] }] },
      { id: "u-o", name: "own", email: "own@x", role: "owner" },
      { id: "u-t", name: "gone", email: "gone@x", role: "viewer", hash: "h-t", deletedAt: trashed },
      { id: "u-0-gone", name: "old owner", email: "old@x", role: "owner", deletedAt: trashed },
    ]);
  });

  it("owner skips trashed users", async () => {
    expect((await storage.users.owner(conn))?.id).toBe("u-o");
  });

  it("byEmail and byHash skip trashed users", async () => {
    expect((await storage.users.byEmail(conn, "alpha@x"))?.id).toBe("u-a");
    expect(await storage.users.byEmail(conn, "gone@x")).toBeNull();
    expect((await storage.users.byHash(conn, "h-b"))?.id).toBe("u-b");
    expect(await storage.users.byHash(conn, "h-t")).toBeNull();
  });

  it("allActive orders by role then name and skips trashed users", async () => {
    expect((await storage.users.allActive(conn)).map((u) => u.id)).toEqual(["1", "u-e", "u-o", "u-a", "u-b"]);
  });

  it("byLogin matches name or email, trashed only when asked", async () => {
    expect((await storage.users.byLogin(conn, "beta", false))?.id).toBe("u-b");
    expect((await storage.users.byLogin(conn, "beta@x", false))?.id).toBe("u-b");
    expect(await storage.users.byLogin(conn, "gone", false)).toBeNull();
    expect((await storage.users.byLogin(conn, "gone", true))?.id).toBe("u-t");
    expect(await storage.users.byLogin(conn, "nobody", true)).toBeNull();
  });

  it("byBookmarkedEntity and byStoredTerritory", async () => {
    expect(ids(await storage.users.byBookmarkedEntity(conn, "e2"))).toEqual(["u-b", "u-e"]);
    expect(ids(await storage.users.byBookmarkedEntity(conn, "e1"))).toEqual(["u-b"]);
    expect(ids(await storage.users.byStoredTerritory(conn, "t2"))).toEqual(["u-a"]);
    expect(await storage.users.byStoredTerritory(conn, "t9")).toEqual([]);
  });

  it("deleteAllExceptName keeps one user", async () => {
    const result = await storage.users.deleteAllExceptName(conn, "admin");
    expect(result.deleted).toBe(6);
    expect(ids(await storage.users.all(conn))).toEqual(["1"]);
  });
});

describe("acl", () => {
  const rows = [
    { id: "acl-t1", controller: "x", method: "GET", route: "a", roles: [], public: true },
    { id: "acl-t2", controller: "x", method: "POST", route: "a", roles: [], public: false },
    { id: "acl-t3", controller: "x", method: "GET", route: "b", roles: [], public: false },
  ];
  beforeAll(async () => {
    await storage.acl.insert(conn, rows);
  });
  afterAll(async () => {
    await storage.acl.deleteMany(conn, rows.map((r) => r.id));
  });

  it("byRoute matches controller, method and route", async () => {
    expect(ids(await storage.acl.byRoute(conn, "x", "GET" as any, "a"))).toEqual(["acl-t1"]);
    expect(await storage.acl.byRoute(conn, "x", "PUT" as any, "a")).toEqual([]);
  });
});

describe("saved queries", () => {
  beforeAll(async () => {
    await storage.savedQueries.deleteAll(conn);
    await insertUsers("u1", "u2");
    await storage.savedQueries.insert(conn, [
      { id: "q-s1", name: "Alpha", ownerId: "u1", shared: true, data: {}, createdAt: new Date("2024-01-01T00:00:00Z") },
      { id: "q-p1", name: "alpha", ownerId: "u1", shared: false, data: {}, createdAt: new Date("2024-01-03T00:00:00Z") },
      { id: "q-p2", name: "Beta", ownerId: "u2", shared: false, data: {}, createdAt: new Date("2024-01-02T00:00:00Z") },
    ]);
  });
  afterAll(async () => {
    await storage.savedQueries.deleteAll(conn);
    await storage.users.deleteMany(conn, ["u1", "u2"]);
  });

  it("idsWithName ignores case within the shared or the owner's private folder", async () => {
    expect(await storage.savedQueries.idsWithName(conn, "alpha", true, "u9")).toEqual(["q-s1"]);
    expect(await storage.savedQueries.idsWithName(conn, "alpha", false, "u1")).toEqual(["q-p1"]);
    expect(await storage.savedQueries.idsWithName(conn, "alpha", false, "u2")).toEqual([]);
  });

  it("visibleFor lists shared plus own, newest first", async () => {
    expect((await storage.savedQueries.visibleFor(conn, "u1")).map((q) => q.id)).toEqual(["q-p1", "q-s1"]);
    expect((await storage.savedQueries.visibleFor(conn, "u2")).map((q) => q.id)).toEqual(["q-p2", "q-s1"]);
  });
});

describe("documents", () => {
  beforeAll(async () => {
    await storage.documents.deleteAll(conn);
    await storage.documents.insert(conn, [
      { id: "d-2", title: "second", content: "c2", anchors: [{ anchor: "e1" }], entityIds: { C: ["e1", "e1"], P: ["e2"] }, createdAt: new Date("2024-01-02T00:00:00Z") },
      { id: "d-1", title: "first", content: "c1", anchors: [], entityIds: ["e1"], createdAt: new Date("2024-01-01T00:00:00Z") },
      { id: "d-3", title: "third", content: "c3", anchors: [], entityIds: {}, createdAt: new Date("2024-01-03T00:00:00Z") },
    ]);
  });

  it("byEntityId strips content and returns each document once", async () => {
    const found = await storage.documents.byEntityId(conn, "e1");
    expect(ids(found)).toEqual(["d-1", "d-2"]);
    for (const doc of found) {
      expect((doc as Row).content).toBeUndefined();
      expect(doc.title).toBeTruthy();
    }
  });

  it("byEntityIds returns each matching document once", async () => {
    expect(ids(await storage.documents.byEntityIds(conn, ["e1", "e2"]))).toEqual(["d-1", "d-2"]);
  });

  it("allByCreatedAt and listMeta order by creation, listMeta without content and anchors", async () => {
    expect((await storage.documents.allByCreatedAt(conn)).map((d) => d.id)).toEqual(["d-1", "d-2", "d-3"]);
    const meta = await storage.documents.listMeta(conn);
    expect(meta.map((d) => d.id)).toEqual(["d-1", "d-2", "d-3"]);
    expect((meta[1] as Row).content).toBeUndefined();
    expect((meta[1] as Row).anchors).toBeUndefined();
    expect(meta[1].createdAt).toBeInstanceOf(Date);
  });
});

describe("entities", () => {
  const IDX = DbEnums.Indexes;
  // the shapes the index functions read; every other field is irrelevant to storage
  const prop = (valueId: string, typeId: string, children: Row[] = []): Row => ({
    id: `p-${valueId}-${typeId}`,
    value: { entityId: valueId },
    type: { entityId: typeId },
    children,
  });
  const actant = (entityId: string, extra: Row = {}): Row => ({
    id: `a-${entityId}`,
    entityId,
    props: [],
    classifications: [],
    identifications: [],
    ...extra,
  });
  const statement = (id: string, territory: unknown, data: Row = {}): Row => ({
    id,
    class: "S",
    data: { text: "", territory, actions: [], actants: [], tags: [], ...data },
  });

  beforeAll(async () => {
    await storage.entities.deleteAll(conn);
    await storage.entities.insert(conn, [
      { id: "t-root", class: "T", data: { parent: false } },
      { id: "t-child", class: "T", data: { parent: { territoryId: "t-root", order: 0 } } },
      { id: "t-broken", class: "T", data: { parent: "t-root" } },
      // c-1 as actant, classification, tag and a prop value three levels down
      statement("s-1", { territoryId: "t-root", order: 1 }, {
        tags: ["c-1"],
        actants: [
          actant("c-1", {
            classifications: [{ id: "cl-1", entityId: "c-1" }],
            props: [prop("x-1", "x-2", [prop("x-3", "x-4", [prop("c-1", "x-5")])])],
          }),
        ],
      }),
      statement("s-2", { territoryId: "t-child", order: 1 }, { tags: ["c-1"] }),
      statement("s-none", null, { actants: [actant("c-2")] }),
      {
        id: "c-1",
        class: "C",
        props: [prop("x-6", "x-7", [prop("x-8", "c-2")])],
        references: [{ id: "ref-1", resource: "r-1", value: "" }],
      },
      { id: "c-2", class: "C" },
      { id: "r-1", class: "R", data: { documentId: "d-1" } },
      { id: "r-2", class: "R", data: { documentId: "d-1" } },
      { id: "r-3", class: "R", data: {} },
    ]);
  });
  afterAll(async () => {
    await storage.entities.deleteAll(conn);
  });
  it("get and getMany return nested documents intact", async () => {
    const [c1] = await storage.entities.getMany(conn, ["c-1"]);
    expect(c1.props[0].children[0].type.entityId).toBe("c-2");
    expect(c1.references).toEqual([{ id: "ref-1", resource: "r-1", value: "" }]);
    const s1 = (await storage.entities.get(conn, "s-1"))!;
    expect(s1.data.actants[0].classifications[0].entityId).toBe("c-1");
    expect(s1.data.actants[0].props[0].children[0].children[0].value.entityId).toBe("c-1");
  });

  it("byIndex finds an entity through every gin index, nested props included", async () => {
    const found = (index: string, key: string) => storage.entities.byIndex(conn, index, [key]);
    expect(ids(await found(IDX.StatementEntities, "c-1"))).toEqual(["s-1", "s-2"]);
    expect(ids(await found(IDX.StatementEntities, "t-child"))).toEqual(["s-2"]);
    expect(ids(await found(IDX.StatementActantsCI, "c-1"))).toEqual(["s-1"]);
    expect(ids(await found(IDX.StatementDataProps, "c-1"))).toEqual(["s-1"]);
    expect(ids(await found(IDX.PropsRecursive, "c-2"))).toEqual(["c-1"]);
    expect(ids(await found(IDX.EntityReferences, "r-1"))).toEqual(["c-1"]);
    expect(await found(IDX.EntityReferences, "")).toEqual([]);
    expect(ids(await found(IDX.StatementTerritory, "t-root"))).toEqual(["s-1"]);
  });

  it("territoryChildren returns the territories whose parent object points at the id", async () => {
    expect(ids(await storage.entities.territoryChildren(conn, "t-root"))).toEqual(["t-child"]);
    expect(await storage.entities.territoryChildren(conn, "t-child")).toEqual([]);
  });

  it("resourcesByDocumentId and resourcesByDocumentIds return the resources of a document", async () => {
    expect(ids(await storage.entities.resourcesByDocumentId(conn, "d-1"))).toEqual(["r-1", "r-2"]);
    expect(await storage.entities.resourcesByDocumentId(conn, "d-9")).toEqual([]);
    expect(ids(await storage.entities.resourcesByDocumentIds(conn, ["d-1", "d-9"]))).toEqual(["r-1", "r-2"]);
    // a resource without a document has the empty string as its document id
    expect(ids(await storage.entities.resourcesByDocumentIds(conn, [""]))).toEqual(["r-3"]);
    expect(await storage.entities.resourcesByDocumentIds(conn, [])).toEqual([]);
  });

  it("statementsByIndex keeps statements only", async () => {
    expect(ids(await storage.entities.statementsByIndex(conn, IDX.StatementTerritory, "t-root"))).toEqual(["s-1"]);
    expect(ids(await storage.entities.statementsByIndex(conn, IDX.StatementEntities, "c-1"))).toEqual(["s-1", "s-2"]);
    // PropsRecursive finds the concept c-1, which is not a statement
    expect(await storage.entities.statementsByIndex(conn, IDX.PropsRecursive, "c-2")).toEqual([]);
  });

  const pairs = async (entityIds: string[], indexes: string[]) => {
    const found = await storage.entities.statementTerritoryPairs(conn, entityIds, indexes);
    return [...new Set(found.map((p) => `${p.entityId}:${p.territoryId}`))].sort();
  };

  it("statementTerritoryPairs tags every statement hit with the id it was found under", async () => {
    expect(await pairs(["c-1"], DbEnums.EntityIdReferenceIndexes)).toEqual(["c-1:t-child", "c-1:t-root"]);
    expect(await pairs(["t-child"], [IDX.StatementEntities])).toEqual(["t-child:t-child"]);
    expect(await pairs(["c-2"], [IDX.StatementEntities])).toEqual(["c-2:null"]);
    expect(await pairs(["c-1", "c-2"], [IDX.StatementEntities])).toEqual(["c-1:t-child", "c-1:t-root", "c-2:null"]);
    expect(await pairs(["nope"], [IDX.StatementEntities])).toEqual([]);
    expect(await storage.entities.statementTerritoryPairs(conn, [], [IDX.StatementEntities])).toEqual([]);
  });

  itPg("statementTerritoryPairs returns nothing for an empty index list", async () => {
    expect(await storage.entities.statementTerritoryPairs(conn, ["c-1"], [])).toEqual([]);
  });

  // last: it moves s-1 out of t-root
  it("updateStatementTerritoryOrders moves the listed statements and skips unknown ids", async () => {
    const at = new Date("2024-05-06T07:08:09.000Z");
    await storage.entities.updateStatementTerritoryOrders(
      conn,
      [{ id: "s-1", territoryId: "t-child", order: 5 }, { id: "nope", territoryId: "t-child", order: 1 }],
      at
    );
    const moved = (await storage.entities.get(conn, "s-1"))!;
    expect(moved.data.territory).toEqual({ territoryId: "t-child", order: 5 });
    expect(moved.data.tags).toEqual(["c-1"]);
    expect(moved.data.actants).toHaveLength(1);
    expect(moved.updatedAt).toEqual(at);
    expect(await storage.entities.get(conn, "nope")).toBeNull();
    expect(ids(await storage.entities.statementsByIndex(conn, IDX.StatementTerritory, "t-child"))).toEqual(["s-1", "s-2"]);
    expect(await storage.entities.statementsByIndex(conn, IDX.StatementTerritory, "t-root")).toEqual([]);
  });

  itPg("provisions the extra indexes", async () => {
    const res = await q(conn, "SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public'");
    const present = res.rows.map((row: { tablename: string; indexname: string }) => `${row.tablename}.${row.indexname}`);
    for (const extra of EXTRA_INDEXES) {
      expect(present).toContain(`${extra.table}.${extra.name}`);
    }
  });
});

describe("relations", () => {
  beforeAll(async () => {
    await storage.relations.deleteAll(conn);
    await storage.relations.insert(conn, [
      { id: "rel-1", type: "SCL", entityIds: ["c-1", "c-2"] },
      { id: "rel-2", type: "SCL", entityIds: ["c-2", "c-3"] },
      { id: "rel-3", type: "SYN", entityIds: ["c-1", "c-3"] },
    ]);
  });
  afterAll(async () => {
    await storage.relations.deleteAll(conn);
  });

  it("byType lists every relation, or the relations of one type", async () => {
    expect(ids(await storage.relations.byType(conn))).toEqual(["rel-1", "rel-2", "rel-3"]);
    expect(ids(await storage.relations.byType(conn, RelationEnums.Type.Superclass))).toEqual(["rel-1", "rel-2"]);
    expect(await storage.relations.byType(conn, RelationEnums.Type.Classification)).toEqual([]);
  });

  it("forEntities finds a relation from either side, once, optionally of one type", async () => {
    expect(ids(await storage.relations.forEntities(conn, ["c-1"]))).toEqual(["rel-1", "rel-3"]);
    expect(ids(await storage.relations.forEntities(conn, ["c-2"]))).toEqual(["rel-1", "rel-2"]);
    expect(ids(await storage.relations.forEntities(conn, ["c-1", "c-2"]))).toEqual(["rel-1", "rel-2", "rel-3"]);
    expect(ids(await storage.relations.forEntities(conn, ["c-1", "c-1"]))).toEqual(["rel-1", "rel-3"]);
    expect(ids(await storage.relations.forEntities(conn, ["c-1"], RelationEnums.Type.Synonym))).toEqual(["rel-3"]);
    expect(await storage.relations.forEntities(conn, ["c-1"], RelationEnums.Type.Classification)).toEqual([]);
    expect(await storage.relations.forEntities(conn, [])).toEqual([]);
  });
});

describe("audits", () => {
  const audit = (id: string, date: string, extra: Row = {}): Row => ({
    id,
    auditScope: "entity",
    modelId: "m1",
    user: "u1",
    type: "edit",
    changes: {},
    date: new Date(date),
    ...extra,
  });
  beforeAll(async () => {
    await storage.audits.deleteAll(conn);
    await insertUsers("u1", "u2");
    await storage.audits.insert(conn, [
      audit("au-1", "2024-02-28T10:00:00Z", { type: "create" }),
      audit("au-2", "2024-03-01T23:59:59Z"),
      audit("au-3", "2024-03-02T00:00:00Z", { user: "u2" }),
      audit("au-4", "2024-03-04T12:00:00Z", { modelId: "m2", type: "create", user: "u2" }),
      audit("au-5", "2024-03-05T12:00:00Z", { auditScope: "document", modelId: "doc1" }),
      audit("au-6", "2024-03-06T12:00:00Z", { auditScope: "relation", modelId: "r1", type: "relation_create", changes: { entityIds: ["m1", "m2"] } }),
      audit("au-7", "2025-01-01T00:00:00Z", { auditScope: "relation", modelId: "r2", type: "relation_edit", changes: { entityIds: ["m2"] } }),
    ]);
  });
  afterAll(async () => {
    await storage.audits.deleteAll(conn);
    await storage.users.deleteMany(conn, ["u1", "u2"]);
  });

  it("firstFor, lastFor, lastNFor by scope and model, ordered by date", async () => {
    expect((await storage.audits.firstFor(conn, "entity" as any, "m1"))?.id).toBe("au-1");
    expect((await storage.audits.lastFor(conn, "entity" as any, "m1"))?.id).toBe("au-3");
    expect((await storage.audits.lastNFor(conn, "entity" as any, "m1", 2)).map((a) => a.id)).toEqual(["au-3", "au-2"]);
    expect(await storage.audits.firstFor(conn, "entity" as any, "none")).toBeNull();
    expect((await storage.audits.firstFor(conn, "document" as any, "doc1"))?.id).toBe("au-5");
  });

  it("relationAuditsForEntity, newest first, capped", async () => {
    expect((await storage.audits.relationAuditsForEntity(conn, "m2", 5)).map((a) => a.id)).toEqual(["au-7", "au-6"]);
    expect((await storage.audits.relationAuditsForEntity(conn, "m2", 1)).map((a) => a.id)).toEqual(["au-7"]);
    expect(await storage.audits.relationAuditsForEntity(conn, "m1", 5)).toHaveLength(1);
  });

  it("earliestDate", async () => {
    expect(await storage.audits.earliestDate(conn)).toEqual(new Date("2024-02-28T10:00:00Z"));
  });

  it("onDate matches the UTC calendar day", async () => {
    expect(ids(await storage.audits.onDate(conn, new Date("2024-03-01T00:00:00Z")))).toEqual(["au-2"]);
    expect(ids(await storage.audits.onDate(conn, new Date("2024-03-02T00:00:00Z")))).toEqual(["au-3"]);
    expect(await storage.audits.onDate(conn, new Date("2024-03-03T00:00:00Z"))).toEqual([]);
  });

  it("firstPerEntityInRange keeps entities first audited within the inclusive optional bounds", async () => {
    const first = (after?: string, before?: string) =>
      storage.audits.firstPerEntityInRange(conn, after ? new Date(after) : undefined, before ? new Date(before) : undefined);
    expect(ids(await first())).toEqual(["au-1", "au-4"]);
    expect(ids(await first("2024-03-02T00:00:00Z"))).toEqual(["au-4"]);
    expect(ids(await first(undefined, "2024-03-01T23:59:59Z"))).toEqual(["au-1"]);
    expect(ids(await first("2024-02-28T10:00:00Z", "2024-03-04T12:00:00Z"))).toEqual(["au-1", "au-4"]);
    expect(await first("2024-03-01T00:00:00Z", "2024-03-02T00:00:00Z")).toEqual([]);
  });

  it("lastPerEntityInRange keeps entities last audited within the inclusive optional bounds", async () => {
    const last = (after?: string, before?: string) =>
      storage.audits.lastPerEntityInRange(conn, after ? new Date(after) : undefined, before ? new Date(before) : undefined);
    expect(ids(await last())).toEqual(["au-3", "au-4"]);
    expect(ids(await last("2024-03-02T00:00:00Z"))).toEqual(["au-3", "au-4"]);
    expect(await last(undefined, "2024-03-01T23:59:59Z")).toEqual([]);
    expect(ids(await last("2024-03-01T00:00:00Z", "2024-03-02T00:00:00Z"))).toEqual(["au-3"]);
  });

  it("byTypeAndUser", async () => {
    expect(ids(await storage.audits.byTypeAndUser(conn, "create" as any, "u2"))).toEqual(["au-4"]);
    expect(ids(await storage.audits.byTypeAndUser(conn, "edit" as any, "u1"))).toEqual(["au-2", "au-5"]);
  });

  it("page from a day, ordered by date, with skip and take", async () => {
    const from = new Date("2024-03-02T00:00:00Z");
    expect((await storage.audits.page(conn, { skip: 0, take: 2, from })).map((a) => a.id)).toEqual(["au-3", "au-4"]);
    expect((await storage.audits.page(conn, { skip: 2, take: 10, from })).map((a) => a.id)).toEqual(["au-5", "au-6", "au-7"]);
    expect((await storage.audits.page(conn, { skip: 0, take: 1, from: new Date("2024-03-01T12:00:00Z") })).map((a) => a.id)).toEqual(["au-3"]);
  });

  // grouped rows compare as sets: the backends order groups differently
  const byGroup = (rows: { group: string[]; reduction: number }[]) =>
    [...rows].sort((a, b) => (a.group.join("|") < b.group.join("|") ? -1 : 1));

  it("countByBucket per day, week, month and year with group keys", async () => {
    const all = ["edit", "create", "relation_create", "relation_edit"];
    const byDay = await storage.audits.countByBucket(conn, { eventTypes: all, timeUnit: "day" as any, groupBy: ["type"] });
    expect(byDay).toEqual(
      expect.arrayContaining([
        { group: ["2024-02-28", "create"], reduction: 1 },
        { group: ["2024-03-01", "edit"], reduction: 1 },
        { group: ["2024-03-06", "relation_create"], reduction: 1 },
      ])
    );
    expect(byDay).toHaveLength(7);
    // ISO weeks start on Monday: Feb 28 (Wed), Mar 1 (Fri) and Mar 2 (Sat) share the week of Feb 26
    const byWeek = await storage.audits.countByBucket(conn, { eventTypes: ["edit", "create"], timeUnit: "week" as any, groupBy: ["type"] });
    expect(byWeek).toEqual(
      expect.arrayContaining([
        { group: ["2024-02-26", "create"], reduction: 1 },
        { group: ["2024-02-26", "edit"], reduction: 2 },
        { group: ["2024-03-04", "create"], reduction: 1 },
        { group: ["2024-03-04", "edit"], reduction: 1 },
      ])
    );
    expect(byWeek).toHaveLength(4);
    const byMonth = await storage.audits.countByBucket(conn, { eventTypes: ["edit"], timeUnit: "month" as any, groupBy: ["type", "user"] });
    expect(byGroup(byMonth)).toEqual([
      { group: ["2024-03", "edit", "u1"], reduction: 2 },
      { group: ["2024-03", "edit", "u2"], reduction: 1 },
    ]);
    const byYear = await storage.audits.countByBucket(conn, { eventTypes: all, timeUnit: "year" as any, groupBy: ["type"] });
    expect(byYear).toEqual(
      expect.arrayContaining([
        { group: ["2024", "edit"], reduction: 3 },
        { group: ["2025", "relation_edit"], reduction: 1 },
      ])
    );
  });

  it("countByBucket with a half-open window and an entity subset", async () => {
    const windowed = await storage.audits.countByBucket(conn, {
      from: new Date("2024-03-01T00:00:00Z"),
      to: new Date("2024-03-04T12:00:00Z"),
      eventTypes: ["edit", "create"],
      timeUnit: "day" as any,
      groupBy: ["type"],
    });
    expect(byGroup(windowed)).toEqual([
      { group: ["2024-03-01", "edit"], reduction: 1 },
      { group: ["2024-03-02", "edit"], reduction: 1 },
    ]);
    const subset = await storage.audits.countByBucket(conn, {
      eventTypes: ["edit", "create"],
      timeUnit: "year" as any,
      groupBy: ["type"],
      entityIds: ["m2"],
    });
    expect(byGroup(subset)).toEqual([{ group: ["2024", "create"], reduction: 1 }]);
  });
});

describe("materialized stats", () => {
  const day = storage.stats("day");
  const rows = [
    { id: "ms-1", date: "2024-03-01", eventType: "edit", aggregateBy: "user", aggregationKey: "u1", count: 2, lastUpdated: new Date("2024-03-05T00:00:00Z") },
    { id: "ms-2", date: "2024-03-02", eventType: "create", aggregateBy: "user", aggregationKey: "u1", count: 1, lastUpdated: new Date("2024-03-06T00:00:00Z") },
    { id: "ms-3", date: "2024-03-03", eventType: "edit", aggregateBy: "activityType", aggregationKey: "edit", count: 1, lastUpdated: new Date("2024-03-04T00:00:00Z") },
    { id: "ms-4", date: "2024-02-29", eventType: "edit", aggregateBy: "user", aggregationKey: "u2", count: 5, lastUpdated: new Date("2024-03-01T00:00:00Z") },
  ];
  beforeAll(async () => {
    await day.insert(conn, rows);
  });
  afterAll(async () => {
    await day.deleteMany(conn, rows.map((r) => r.id));
  });

  it("byDateRange is left-closed, right-open, filtered by event types and aggregation, ordered by date", async () => {
    const found = await day.byDateRange(conn, "2024-02-29", "2024-03-03", ["edit", "create"], "user");
    expect(found.map((r) => r.id)).toEqual(["ms-4", "ms-1", "ms-2"]);
    expect((await day.byDateRange(conn, "2024-03-01", "2024-03-02", ["edit", "create"], "user")).map((r) => r.id)).toEqual(["ms-1"]);
    expect((await day.byDateRange(conn, "2024-03-01", "2024-03-04", ["edit"], "activityType")).map((r) => r.id)).toEqual(["ms-3"]);
  });

  it("latestUpdate", async () => {
    expect(await day.latestUpdate(conn)).toEqual(new Date("2024-03-06T00:00:00Z"));
  });
});

describe("sessions", () => {
  beforeAll(async () => {
    await storage.sessions.ensure(conn);
    await storage.sessions.ensure(conn);
  });
  afterAll(async () => {
    for (const sid of ["sid-1", "sid-2", "sid-3"]) {
      await storage.sessions.delete(conn, sid);
    }
  });

  it("set inserts or overwrites, get returns the row", async () => {
    await storage.sessions.set(conn, { id: "sid-1", userId: "u1", data: "{}", expiresAt: 10 });
    await storage.sessions.set(conn, { id: "sid-1", userId: "u1", data: '{"a":1}', expiresAt: 20 });
    expect(await storage.sessions.get(conn, "sid-1")).toEqual({ id: "sid-1", userId: "u1", data: '{"a":1}', expiresAt: 20 });
    expect(await storage.sessions.get(conn, "sid-none")).toBeNull();
  });

  it("deleteByUser and deleteExpired", async () => {
    await storage.sessions.set(conn, { id: "sid-2", userId: "u2", data: "{}", expiresAt: 5 });
    await storage.sessions.set(conn, { id: "sid-3", userId: "u2", data: "{}", expiresAt: 500 });
    await storage.sessions.deleteByUser(conn, "u1");
    expect(await storage.sessions.get(conn, "sid-1")).toBeNull();
    expect(await storage.sessions.deleteExpired(conn, 5)).toBe(1);
    expect(await storage.sessions.get(conn, "sid-2")).toBeNull();
    expect((await storage.sessions.get(conn, "sid-3"))?.expiresAt).toBe(500);
    await storage.sessions.delete(conn, "sid-3");
    expect(await storage.sessions.get(conn, "sid-3")).toBeNull();
  });
});
