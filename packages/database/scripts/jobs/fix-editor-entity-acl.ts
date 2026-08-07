import { Connection, r } from "rethinkdb-ts";
import { IJob } from ".";

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
  // seeded permissively in the datasets from the start, but a database built
  // before that carries the auto-created roles:[] row and refuses drag-move
  { controller: "statements", method: "PUT", route: "batch-move" },
  { controller: "statements", method: "POST", route: "batch-copy" },
  // the seeded relations rows cover the collection endpoints ("" for bulk
  // create/update/delete); editing or deleting one relation by id goes through
  // its own route, which had no row of its own
  { controller: "relations", method: "PUT", route: ":relationId?" },
  { controller: "relations", method: "DELETE", route: ":relationId" },
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

const fixEditorEntityAclJob: IJob = async (db: Connection): Promise<void> => {
  const targets = [
    ...ROUTES.map((r) => ({ ...r, roles: ROLES })),
    ...READ_ROUTES.map((r) => ({ ...r, roles: ["*"] })),
  ];

  for (const { controller, method, route, roles } of targets) {
    const rows: any[] = await r
      .table("acl_permissions")
      .filter({ controller, method, route })
      .run(db);

    if (!rows.length) {
      await r
        .table("acl_permissions")
        .insert({
          controller,
          method,
          route,
          roles,
          public: false,
        })
        .run(db);
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

    await r
      .table("acl_permissions")
      .getAll(...stale.map((row) => row.id))
      .update({ roles })
      .run(db);
    console.log(
      `Updated ${stale.length} acl_permissions row(s) for ${controller} ${method} "${route}"`
    );
  }

  for (const { controller, method, route } of REMOVED_ROUTES) {
    const result = await r
      .table("acl_permissions")
      .filter({ controller, method, route })
      .delete()
      .run(db);
    if (result.deleted) {
      console.log(
        `Deleted ${result.deleted} acl_permissions row(s) for removed route ${controller} ${method} "${route}"`
      );
    }
  }
};

export default fixEditorEntityAclJob;
