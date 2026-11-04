import { test } from "node:test";
import assert from "node:assert/strict";
import { checkConstraints, columnValue, RowSource } from "./preflight";

const source =
  (tables: Record<string, Record<string, unknown>[]>): RowSource =>
  async (table, each) => {
    for (const row of tables[table] ?? []) each(row);
  };

const violations = async (tables: Record<string, Record<string, unknown>[]>) =>
  (await checkConstraints(source(tables))).map((v) => `${v.constraint.name} ${v.id}: ${v.detail}`);

test("columnValue follows the column spec like PostgreSQL does", () => {
  assert.equal(columnValue("entities", "territory_id", { data: { territory: { territoryId: "t1" } } }), "t1");
  assert.equal(columnValue("entities", "territory_id", { data: { territory: { territoryId: "" } } }), null);
  assert.equal(columnValue("entities", "territory_id", { data: { territory: false } }), null);
  assert.equal(columnValue("entities", "status", { status: 1 }), "1");
  assert.equal(columnValue("users", "email", {}), null);
  assert.equal(columnValue("entities", "is_template", { isTemplate: false }), false);
  assert.equal(columnValue("entities", "is_template", { isTemplate: true }), true);
  assert.equal(columnValue("entities", "is_template", { isTemplate: "" }), false);
  assert.deepEqual(columnValue("relations", "entity_ids", { entityIds: ["a", "b"] }), ["a", "b"]);
  assert.deepEqual(columnValue("relations", "entity_ids", { entityIds: "a" }), []);
  assert.throws(() => columnValue("entities", "labels_x", {}), /not a generated column/);
  assert.throws(() => columnValue("entities", "prop_entity_ids", {}), /only PostgreSQL evaluates/);
});

test("checkConstraints finds nothing on consistent rows", async () => {
  assert.deepEqual(
    await violations({
      users: [{ id: "u1", email: "a@b" }, { id: "u2", email: "" }, { id: "u3", email: "" }],
      entities: [
        { id: "t", class: "T", data: { parent: { territoryId: "" } } },
        { id: "s", class: "S", data: { territory: { territoryId: "t" } } },
      ],
      audits: [{ id: "a1", user: "u1" }, { id: "a2" }],
      saved_queries: [{ id: "q1", ownerId: "u2" }],
      relations: [
        { id: "r1", type: "CLA", entityIds: ["a", "b"] },
        { id: "r2", type: "SCL", entityIds: ["a", "b"] },
        { id: "r3", type: "CLA", entityIds: ["b", "a"] },
      ],
      acl_permissions: [
        { id: "p1", controller: "c", method: "GET", route: "" },
        { id: "p2", controller: "c", method: "POST", route: "" },
      ],
    }),
    []
  );
});

test("checkConstraints names every dangling reference and every duplicate", async () => {
  assert.deepEqual(
    await violations({
      users: [{ id: "u1", email: "a@b" }, { id: "u2", email: "a@b" }, { id: "u3", email: "a@b" }],
      entities: [
        { id: "s1", data: { territory: { territoryId: "gone" } } },
        { id: "t1", data: { parent: { territoryId: "gone-too" } } },
      ],
      audits: [{ id: "a1", user: "nobody" }],
      saved_queries: [{ id: "q1", ownerId: "nobody" }],
      relations: [
        { id: "r1", type: "CLA", entityIds: ["a", "b"] },
        { id: "r2", type: "CLA", entityIds: ["a", "b"] },
        { id: "r3", type: "CLA", entityIds: ["a", "b"] },
      ],
      acl_permissions: [
        { id: "p1", controller: "c", method: "GET", route: "" },
        { id: "p2", controller: "c", method: "GET", route: "" },
      ],
    }),
    [
      "entities_territory_id_fkey s1: territory_id = gone is not an id in entities",
      "entities_parent_id_fkey t1: parent_id = gone-too is not an id in entities",
      "audits_user_id_fkey a1: user_id = nobody is not an id in users",
      "saved_queries_owner_id_fkey q1: owner_id = nobody is not an id in users",
      'relations_type_entity_ids_key r2: (type, entity_ids) = ["CLA",["a","b"]] duplicates row r1',
      'relations_type_entity_ids_key r3: (type, entity_ids) = ["CLA",["a","b"]] duplicates row r1',
      'users_email_key u2: (email) = ["a@b"] duplicates row u1',
      'users_email_key u3: (email) = ["a@b"] duplicates row u1',
      'acl_permissions_route_key p2: (controller, method, route) = ["c","GET",""] duplicates row p1',
    ]
  );
});
