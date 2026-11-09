import { Connection, r } from "rethinkdb-ts";

/**
 * Replaces an entity's props with `after`, but only if they are still `before`.
 *
 * A job reads its entities once and then works through them for as long as that
 * takes. A researcher can save one of them in between, and writing back props
 * computed from what the job read would undo that save and, for a coordinate,
 * leave the Location pointing at a Value the page has since deleted. The
 * comparison runs in the database, in the same write.
 *
 * Returns whether the props were replaced.
 */
export const updatePropsIfUnchanged = async (
  db: Connection,
  entityId: string,
  before: unknown[],
  after: unknown[],
): Promise<boolean> => {
  const result: any = await r
    .table("entities")
    .get(entityId)
    .update((entity: any) =>
      r.branch(entity("props").default([]).eq(r.expr(before)), { props: after }, {}),
    )
    .run(db);
  return result.replaced === 1;
};
