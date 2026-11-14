import { Connection, r } from "rethinkdb-ts";
import { Client } from "pg";
import { v4 as uuid } from "uuid";
import type { IJob, IPgJob } from ".";

// Owner and Admin bypass the ACL table entirely (see middlewares/acl.ts), so
// naming the editor alone still leaves them able to call these.
const ROLES = ["editor"];

/**
 * Opens the entity routes an editor needs on an already-running database.
 *
 * A route with no matching acl_permissions row is not merely unlisted: the ACL
 * layer persists a roles:[] row for it and denies every non-Admin from then on,
 * so the call fails with "Endpoint not allowed" before the handler's own
 * per-entity check ever runs. Two routes land there.
 *
 * Delete is declared as "/:entityId?" - the optional param lets one call carry a
 * single id in the URL and a batch in the body - but lookup keys on that literal
 * path, so the row shipped under ":entityId" never matches it.
 *
 * Restore has no seeded row at all, which strands the Restore link the delete
 * toast offers: the delete succeeds and the undo is refused. Clone is in the
 * same state.
 *
 * The datasets now seed all three, but that only reaches databases built by a
 * fresh import - this repairs the ones already in service.
 */
const ROUTES: Array<{ controller: string; method: string; route: string }> = [
  { controller: "entities", method: "DELETE", route: ":entityId?" },
  { controller: "entities", method: "POST", route: ":entityId/restore" },
  { controller: "entities", method: "POST", route: ":entityId/clone" },
  // the relations of one entity, read by the Explorer relation column and by
  // the JSON import's checks; never seeded, so it answers only to Admin/Owner
  { controller: "entities", method: "GET", route: ":entityId/relations" },
  // seeded permissively in the datasets from the start, but a database built
  // before that carries the auto-created roles:[] row and refuses drag-move
  { controller: "statements", method: "PUT", route: "batch-move" },
  { controller: "statements", method: "POST", route: "batch-copy" },
  { controller: "statements", method: "PUT", route: "batch-reorder" },
  // batch reference replace/append behind the statement list; never seeded, so
  // it carries the auto-created roles:[] row and answers only to Admin/Owner
  { controller: "statements", method: "PUT", route: "references" },
  // the seeded relations rows cover the collection endpoints ("" for bulk
  // create/update/delete); editing or deleting one relation by id goes through
  // its own route, which had no row of its own
  { controller: "relations", method: "PUT", route: ":relationId?" },
  { controller: "relations", method: "DELETE", route: ":relationId" },
  // the collection endpoints were seeded as roles:["*"], which waves a Viewer
  // past the ACL layer; rows are rewritten to the roles named here, so listing
  // them narrows the wildcard down to the editor
  { controller: "relations", method: "POST", route: "" },
  { controller: "relations", method: "PUT", route: "" },
  { controller: "relations", method: "DELETE", route: "" },
];

// read-only routes any signed-in user may reach - kept apart because they are
// granted to every role, not just the editor
const READ_ROUTES: Array<{ controller: string; method: string; route: string }> =
  [{ controller: "territories", method: "GET", route: ":territoryId/statements" }];

// rows the ACL layer wrote for routes that no longer exist - nothing deletes a
// permission once its route is gone, so they linger and misrepresent what the
// server actually exposes
const REMOVED_ROUTES: Array<{
  controller: string;
  method: string;
  route: string;
}> = [
  {
    controller: "statements",
    method: "PUT",
    route: ":statementId/elementsOrders",
  },
];

type Route = { controller: string; method: string; route: string };

/** the row operations of the job, one implementation per database */
export interface AclTable {
  /** the rows of one route */
  find(route: Route): Promise<{ id: string; roles?: string[] }[]>;
  insert(row: Route & { roles: string[]; public: boolean }): Promise<void>;
  setRoles(ids: string[], roles: string[]): Promise<void>;
  /** @returns the number of rows deleted */
  remove(route: Route): Promise<number>;
}

export async function fixEditorEntityAcl(acl: AclTable): Promise<void> {
  const targets = [
    ...ROUTES.map((r) => ({ ...r, roles: ROLES })),
    ...READ_ROUTES.map((r) => ({ ...r, roles: ["*"] })),
  ];

  for (const { controller, method, route, roles } of targets) {
    const rows = await acl.find({ controller, method, route });

    if (!rows.length) {
      await acl.insert({ controller, method, route, roles, public: false });
      console.log(`Inserted acl_permissions row for ${controller} ${method} "${route}"`);
      continue;
    }

    const stale = rows.filter(
      (row) => !roles.every((role) => (row.roles ?? []).includes(role))
    );
    if (!stale.length) {
      console.log(`${controller} ${method} "${route}" already grants ${roles.join(", ")}`);
      continue;
    }

    await acl.setRoles(
      stale.map((row) => row.id),
      roles
    );
    console.log(
      `Updated ${stale.length} acl_permissions row(s) for ${controller} ${method} "${route}"`
    );
  }

  for (const { controller, method, route } of REMOVED_ROUTES) {
    const deleted = await acl.remove({ controller, method, route });
    if (deleted) {
      console.log(
        `Deleted ${deleted} acl_permissions row(s) for removed route ${controller} ${method} "${route}"`
      );
    }
  }
}

const rethinkTable = (db: Connection): AclTable => ({
  find: (route) => r.table("acl_permissions").filter(route).run(db),
  insert: async (row) => {
    await r.table("acl_permissions").insert(row).run(db);
  },
  setRoles: async (ids, roles) => {
    await r
      .table("acl_permissions")
      .getAll(...ids)
      .update({ roles })
      .run(db);
  },
  remove: async (route) =>
    (await r.table("acl_permissions").filter(route).delete().run(db)).deleted,
});

// the row is the jsonb `doc`; controller, method and route are generated
// columns over it, and the `id` primary key is generated from doc.id, so a new
// row brings its own id where RethinkDB generates one
const pgTable = (db: Client): AclTable => {
  const where = "controller = $1 AND method = $2 AND route = $3";
  const key = ({ controller, method, route }: Route) => [controller, method, route];
  return {
    find: async (route) =>
      (await db.query(`SELECT doc FROM acl_permissions WHERE ${where} ORDER BY id`, key(route))).rows.map(
        (row) => row.doc
      ),
    insert: async (row) => {
      await db.query("INSERT INTO acl_permissions (doc) VALUES ($1::jsonb)", [
        JSON.stringify({ id: uuid(), ...row }),
      ]);
    },
    setRoles: async (ids, roles) => {
      await db.query(
        "UPDATE acl_permissions SET doc = jsonb_set(doc, '{roles}', $2::jsonb) WHERE id = ANY($1::text[])",
        [ids, JSON.stringify(roles)]
      );
    },
    remove: async (route) =>
      (await db.query(`DELETE FROM acl_permissions WHERE ${where}`, key(route))).rowCount ?? 0,
  };
};

const fixEditorEntityAclJob: IJob = (db) => fixEditorEntityAcl(rethinkTable(db));

export const fixEditorEntityAclPgJob: IPgJob = (db) => fixEditorEntityAcl(pgTable(db));

export default fixEditorEntityAclJob;
