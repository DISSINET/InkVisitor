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
];

const fixEditorEntityAclJob: IJob = async (db: Connection): Promise<void> => {
  for (const { controller, method, route } of ROUTES) {
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
          roles: ROLES,
          public: false,
        })
        .run(db);
      console.log(`Inserted acl_permissions row for ${controller} ${method} "${route}"`);
      continue;
    }

    const stale = rows.filter(
      (row) => !ROLES.every((role) => (row.roles ?? []).includes(role))
    );
    if (!stale.length) {
      console.log(`${controller} ${method} "${route}" already grants the editor`);
      continue;
    }

    await r
      .table("acl_permissions")
      .getAll(...stale.map((row) => row.id))
      .update({ roles: ROLES })
      .run(db);
    console.log(
      `Updated ${stale.length} acl_permissions row(s) for ${controller} ${method} "${route}"`
    );
  }
};

export default fixEditorEntityAclJob;
