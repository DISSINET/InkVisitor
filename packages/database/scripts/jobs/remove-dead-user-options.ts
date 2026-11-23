import { r, Connection, RDatum } from "rethinkdb-ts";
import { Client } from "pg";
import type { IJob, IPgJob } from ".";

/**
 * Removes user options that nothing reads any more (#3399).
 *
 * A save merges into the stored row on both databases, so a key the model no
 * longer declares is never removed by the app. Run it once the instance serves a
 * release whose model lacks them: an older server stores
 * hideStatementElementsOrderTable again on every user it creates.
 */
const KEYS = ["allowMaterializedStats", "hideStatementElementsOrderTable"];

// options of any other type (missing, null, scalar, array) are left alone
const removeDeadUserOptionsJob: IJob = async (db: Connection): Promise<void> => {
  const result = await r
    .table("users")
    .filter((row: RDatum) => row("options").typeOf().eq("OBJECT"))
    .replace((row: RDatum) =>
      row.without({ options: Object.fromEntries(KEYS.map((key) => [key, true])) })
    )
    .run(db);

  // per-row failures come back in the result, not as a rejection
  if (result.errors) {
    throw new Error(`RethinkDB: ${result.errors} user(s) failed: ${result.first_error}`);
  }
  console.log(`RethinkDB: removed ${KEYS.join(", ")} from ${result.replaced} user(s)`);
};

// ?| also matches a string scalar or an array element, where #- would fail
export const removeDeadUserOptionsPgJob: IPgJob = async (db: Client): Promise<void> => {
  const result = await db.query(
    `UPDATE users SET doc = doc ${KEYS.map((key) => `#- '{options,${key}}'`).join(" ")}
     WHERE jsonb_typeof(doc->'options') = 'object' AND doc->'options' ?| $1::text[]`,
    [KEYS]
  );
  console.log(`PostgreSQL: removed ${KEYS.join(", ")} from ${result.rowCount ?? 0} user(s)`);
};

export default removeDeadUserOptionsJob;
