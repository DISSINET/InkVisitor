import { TABLES as RETHINK } from "./rethink/provision";
import { EXTRA_INDEXES, FOREIGN_KEYS, TABLES as PG, ddl, foreignKeyDdl } from "./postgres/provision";
import { REQUIRED } from "./requiredIndexes";

/**
 * The two catalogues are written by hand, one per backend. This is what keeps
 * them the same shape: same tables, same index names, multi <-> gin.
 */
describe("storage catalogues", () => {
  it("declare the same tables", () => {
    expect(Object.keys(PG).sort()).toEqual(Object.keys(RETHINK).sort());
  });

  it("declare the same index names per table", () => {
    for (const table of Object.keys(RETHINK)) {
      const names = (list: { name: string }[]) => list.map((i) => i.name).sort();
      expect(names(PG[table])).toEqual(names(RETHINK[table]));
    }
  });

  it("mirror every multi index as gin and every other one as btree", () => {
    for (const table of Object.keys(RETHINK)) {
      for (const index of RETHINK[table]) {
        const twin = PG[table].find((i) => i.name === index.name);
        expect(twin?.kind).toBe(index.multi ? "gin" : "btree");
      }
    }
  });

  it("declare every index the server requires at startup", () => {
    for (const req of REQUIRED) {
      expect(RETHINK[req.table]?.map((i) => i.name)).toContain(req.index);
      expect(PG[req.table]?.map((i) => i.name)).toContain(req.index);
    }
  });

  it("add the foreign keys last, so a loader can leave them out", () => {
    expect(ddl().slice(-FOREIGN_KEYS.length)).toEqual(FOREIGN_KEYS.map(foreignKeyDdl));
    expect(ddl(false)).toEqual(ddl().slice(0, -FOREIGN_KEYS.length));
  });

  it("create the postgres-only indexes last, on catalogue tables, under names the catalogue does not use", () => {
    const statements = ddl(false);
    expect(statements.slice(-EXTRA_INDEXES.length)).toEqual(
      EXTRA_INDEXES.map((i) => `CREATE INDEX ${i.name} ON ${i.table} (${i.expression})`)
    );
    for (const extra of EXTRA_INDEXES) {
      expect(Object.keys(PG)).toContain(extra.table);
      expect(statements.filter((s) => s.startsWith(`CREATE INDEX ${extra.name} `))).toHaveLength(1);
    }
  });
});
