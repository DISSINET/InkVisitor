import { TABLES as RETHINK } from "./rethink/provision";
import { CONSTRAINTS, EXTRA_INDEXES, TABLES as PG, constraintDdl, ddl } from "./postgres/provision";
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

  it("add the constraints last, so a loader can leave them out", () => {
    expect(ddl().slice(-CONSTRAINTS.length)).toEqual(CONSTRAINTS.map(constraintDdl));
    expect(ddl(false)).toEqual(ddl().slice(0, -CONSTRAINTS.length));
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

  it("add no postgres-only index that another btree or a unique constraint leads with", () => {
    const split = (expression: string) => expression.split(",").map((c) => c.trim());
    for (const extra of EXTRA_INDEXES) {
      const columns = split(extra.expression);
      const others = [
        ...PG[extra.table].map((i) => (i.kind === "btree" ? [...i.columns, ...(i.trailing ?? [])] : [])),
        ...EXTRA_INDEXES.filter((i) => i !== extra && i.table === extra.table).map((i) => split(i.expression)),
        ...CONSTRAINTS.filter((c) => c.table === extra.table).map((c) => (c.kind === "unique" ? c.columns : [])),
      ];
      expect(others.map((other) => other.slice(0, columns.length))).not.toContainEqual(columns);
    }
  });
});
