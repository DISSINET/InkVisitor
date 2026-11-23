import { Connection, r, RDatum } from "rethinkdb-ts";
import { Client } from "pg";
import { IJob, IPgJob } from ".";

/**
 * Closes every open password reset link. One `hash` field carries both the
 * reset and the activation link, and both routes accept either, so the only
 * link kept is an invitation nobody has used yet: an unverified, inactive user
 * with no audit of their own.
 */
const cancelPasswordResetLinksJob: IJob = async (db: Connection): Promise<void> => {
  const users = (await r
    .table("users")
    .filter((user: RDatum) =>
      user("hash").default(null).typeOf().eq("STRING").and(user("hash").ne(""))
    )
    .pluck("id", "active", "verified")
    .run(db)) as { id: string; active?: boolean; verified?: boolean }[];

  const invited = users.filter((user) => !user.active && !user.verified).map((user) => user.id);
  // audits has no index on user, so one scan answers for every invitation
  const withAudits: string[] = invited.length
    ? await r
        .table("audits")
        .filter((audit: RDatum) => r.expr(invited).contains(audit("user")))
        .getField("user")
        .distinct()
        .run(db)
    : [];
  const kept = invited.filter((id) => !withAudits.includes(id));
  const ids = users.map((user) => user.id).filter((id) => !kept.includes(id));

  if (ids.length) {
    const result = await r.table("users").getAll(r.args(ids)).update({ hash: null }).run(db);
    // per-row failures come back in the result, not as a rejection
    if (result.errors) {
      throw new Error(`${result.errors} user(s) failed: ${result.first_error}`);
    }
  }
  console.log(`closed the link of ${ids.length} user(s), kept ${kept.length} unused invitation(s)`);
};

export const cancelPasswordResetLinksPgJob: IPgJob = async (db: Client): Promise<void> => {
  const result = await db.query(`
    WITH open AS (
      SELECT id,
        (doc->>'active') IS DISTINCT FROM 'true'
          AND (doc->>'verified') IS DISTINCT FROM 'true'
          AND NOT EXISTS (SELECT 1 FROM audits WHERE audits.user_id = users.id) AS invitation
      FROM users
      WHERE jsonb_typeof(doc->'hash') = 'string' AND doc->>'hash' <> ''
    ), closed AS (
      UPDATE users SET doc = jsonb_set(users.doc, '{hash}', 'null')
      FROM open WHERE users.id = open.id AND NOT open.invitation
      RETURNING users.id
    )
    SELECT (SELECT count(*) FROM closed)::int AS closed,
      (SELECT count(*) FROM open WHERE invitation)::int AS kept`);
  const { closed, kept } = result.rows[0];
  console.log(`closed the link of ${closed} user(s), kept ${kept} unused invitation(s)`);
};

export default cancelPasswordResetLinksJob;
