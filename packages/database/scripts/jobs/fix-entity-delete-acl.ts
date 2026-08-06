import { Connection, r } from "rethinkdb-ts";
import { IJob } from ".";

// Owner and Admin bypass the ACL table entirely (see middlewares/acl.ts), so
// naming the editor alone still leaves them able to delete.
const ROLES = ["editor"];

/**
 * Grants the entity delete route to editors on an already-running database.
 *
 * The route is declared as "/:entityId?" - the optional param lets one call
 * carry a single id in the URL and a batch in the body. AclPermission lookup
 * keys on that literal path, so the row shipped under ":entityId" is never
 * matched; the ACL layer then persists a roles:[] row of its own under
 * ":entityId?" and denies every non-Admin. Deleting an entity as an Editor
 * fails with "Endpoint not allowed" before the handler's own per-entity check
 * ever runs.
 *
 * The datasets now seed ":entityId?" directly, but that only reaches databases
 * built by a fresh import - this repairs the ones already in service.
 */
const fixEntityDeleteAclJob: IJob = async (db: Connection): Promise<void> => {
  const rows: any[] = await r
    .table("acl_permissions")
    .filter({ controller: "entities", method: "DELETE", route: ":entityId?" })
    .run(db);

  if (!rows.length) {
    await r
      .table("acl_permissions")
      .insert({
        controller: "entities",
        method: "DELETE",
        route: ":entityId?",
        roles: ROLES,
        public: false,
      })
      .run(db);
    console.log('Inserted acl_permissions row for entities DELETE ":entityId?"');
    return;
  }

  const stale = rows.filter(
    (row) => !ROLES.every((role) => (row.roles ?? []).includes(role))
  );
  if (!stale.length) {
    console.log('entities DELETE ":entityId?" already grants the editor');
    return;
  }

  await r
    .table("acl_permissions")
    .getAll(...stale.map((row) => row.id))
    .update({ roles: ROLES })
    .run(db);
  console.log(
    `Updated ${stale.length} acl_permissions row(s) for entities DELETE ":entityId?"`
  );
};

export default fixEntityDeleteAclJob;
