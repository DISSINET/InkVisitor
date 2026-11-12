import { test } from "node:test";
import assert from "node:assert/strict";
import { Constraint } from "@service/storage/postgres/provision";
import { KeepFirst, planSkips } from "./duplicates";
import { RowSource } from "./preflight";

type Tables = Record<string, Record<string, unknown>[]>;

const source =
  (tables: Tables): RowSource =>
  async (table, each) => {
    for (const row of tables[table] ?? []) each(row);
  };

const plan = async (tables: Tables, constraints?: Constraint[], keepFirst?: KeepFirst) => {
  const { skipped, blocking } = await planSkips(source(tables), constraints, keepFirst);
  return {
    skipped: skipped.map((s) => `${s.table} ${s.row.id}, kept ${s.kept}`),
    blocking: blocking.map((v) => `${v.constraint.name} ${v.id}`),
  };
};

const duplicateRelations = [
  { id: "r1", type: "CLA", entityIds: ["a", "b"] },
  { id: "r2", type: "CLA", entityIds: ["a", "b"] },
];

test("planSkips has nothing to leave out of consistent rows", async () => {
  assert.deepEqual(
    await plan({
      users: [{ id: "u1", email: "a@b" }],
      audits: [{ id: "a1", user: "u1" }],
      relations: [
        { id: "r1", type: "CLA", entityIds: ["a", "b"] },
        { id: "r2", type: "SCL", entityIds: ["a", "b"] },
      ],
    }),
    { skipped: [], blocking: [] }
  );
});

test("planSkips keeps the relation with the lowest order, then the smallest id", async () => {
  assert.deepEqual(
    await plan({
      relations: [
        { id: "r1", type: "CLA", entityIds: ["a", "b"], order: 5 },
        { id: "r2", type: "CLA", entityIds: ["a", "b"], order: 1 },
        { id: "r3", type: "CLA", entityIds: ["a", "b"] },
        { id: "r4", type: "SCL", entityIds: ["a", "b"] },
        { id: "r5", type: "SCL", entityIds: ["a", "b"] },
      ],
    }),
    { skipped: ["relations r1, kept r2", "relations r3, kept r2", "relations r5, kept r4"], blocking: [] }
  );
});

test("planSkips keeps the acl_permissions row granting the most", async () => {
  const entities = { controller: "entities", method: "GET" };
  assert.deepEqual(
    await plan({
      acl_permissions: [
        { id: "p1", ...entities, route: "/", roles: [] },
        { id: "p2", ...entities, route: "/", roles: ["editor"], public: true },
        { id: "p3", ...entities, route: "/:id", roles: ["editor", "viewer"] },
        { id: "p4", ...entities, route: "/:id", roles: ["*"] },
      ],
    }),
    { skipped: ["acl_permissions p1, kept p2", "acl_permissions p3, kept p4"], blocking: [] }
  );
});

test("planSkips leaves a duplicate user email to a person", async () => {
  assert.deepEqual(
    await plan({
      users: [
        { id: "u1", email: "a@b", deletedAt: 1 },
        { id: "u2", email: "a@b" },
      ],
      relations: duplicateRelations,
    }),
    { skipped: ["relations r2, kept r1"], blocking: ["users_email_key u2"] }
  );
});

test("planSkips still stops on a dangling reference", async () => {
  assert.deepEqual(
    await plan({
      entities: [{ id: "s1", data: { territory: { territoryId: "gone" } } }],
      relations: duplicateRelations,
    }),
    { skipped: ["relations r2, kept r1"], blocking: ["entities_territory_id_fkey s1"] }
  );
});

test("planSkips stops on a reference to a row it leaves out", async () => {
  const constraints: Constraint[] = [
    { table: "users", name: "users_email_key", kind: "unique", columns: ["email"] },
    { table: "audits", name: "audits_user_id_fkey", kind: "foreign key", column: "user_id", references: "users" },
  ];
  const smallestId: KeepFirst = { users: (a, b) => (String(a.id) < String(b.id) ? -1 : 1) };
  assert.deepEqual(
    await plan(
      {
        users: [
          { id: "u1", email: "a@b" },
          { id: "u2", email: "a@b" },
        ],
        audits: [{ id: "a1", user: "u2" }],
      },
      constraints,
      smallestId
    ),
    { skipped: ["users u2, kept u1"], blocking: ["audits_user_id_fkey a1"] }
  );
});
