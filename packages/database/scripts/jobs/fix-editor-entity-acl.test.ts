import { test } from "node:test";
import assert from "node:assert/strict";
import { AclTable, fixEditorEntityAcl } from "./fix-editor-entity-acl";

type Route = { controller: string; method: string; route: string };
type Row = Route & { id: string; roles?: string[]; public?: boolean };

/** acl_permissions in memory; `writes` counts the rows each operation changed */
function memoryTable(rows: Row[]) {
  const writes = { inserted: 0, updated: 0, deleted: 0 };
  const same = (row: Row, { controller, method, route }: Route) =>
    row.controller === controller && row.method === method && row.route === route;
  const table: AclTable = {
    find: async (route) => rows.filter((row) => same(row, route)),
    insert: async (row) => {
      writes.inserted++;
      rows.push({ id: `new-${writes.inserted}`, ...row });
    },
    setRoles: async (ids, roles) => {
      for (const row of rows.filter((row) => ids.includes(row.id))) {
        writes.updated++;
        row.roles = roles;
      }
    },
    remove: async (route) => {
      const gone = rows.filter((row) => same(row, route));
      gone.forEach((row) => rows.splice(rows.indexOf(row), 1));
      writes.deleted += gone.length;
      return gone.length;
    },
  };
  return { rows, table, writes };
}

const find = (rows: Row[], controller: string, method: string, route: string) =>
  rows.find((row) => row.controller === controller && row.method === method && row.route === route);

test("grants the listed routes, narrows a wildcard and drops a removed route; a second run changes nothing", async (t) => {
  t.mock.method(console, "log", () => undefined);
  const { rows, table, writes } = memoryTable([
    { id: "wildcard", controller: "relations", method: "POST", route: "", roles: ["*"] },
    { id: "auto", controller: "entities", method: "DELETE", route: ":entityId?", roles: [] },
    { id: "wider", controller: "statements", method: "PUT", route: "batch-move", roles: ["editor", "viewer"] },
    { id: "removed", controller: "statements", method: "PUT", route: ":statementId/elementsOrders", roles: ["editor"] },
  ]);

  await fixEditorEntityAcl(table);

  assert.deepEqual(find(rows, "relations", "POST", "")?.roles, ["editor"]);
  assert.deepEqual(find(rows, "entities", "DELETE", ":entityId?")?.roles, ["editor"]);
  assert.deepEqual(find(rows, "statements", "PUT", "batch-move")?.roles, ["editor", "viewer"]);
  assert.equal(find(rows, "statements", "PUT", ":statementId/elementsOrders"), undefined);
  assert.deepEqual(find(rows, "entities", "POST", ":entityId/restore")?.roles, ["editor"]);
  assert.equal(find(rows, "entities", "POST", ":entityId/restore")?.public, false);
  assert.deepEqual(find(rows, "territories", "GET", ":territoryId/statements")?.roles, ["*"]);
  assert.deepEqual(writes, { inserted: 11, updated: 2, deleted: 1 });

  await fixEditorEntityAcl(table);
  assert.deepEqual(writes, { inserted: 11, updated: 2, deleted: 1 });
});
