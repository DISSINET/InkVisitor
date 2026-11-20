import { GEOCODING_SETTINGS_KEY } from "@inkvisitor/shared/types/geocoding";
import { Client } from "pg";
import { Connection, r } from "rethinkdb-ts";

/**
 * The reads and writes the geocoding jobs make, one implementation per database.
 * What the jobs decide is written once over these, so both databases move,
 * leave and credit the same Locations.
 */
export interface GeocodingRows {
  /** the roles of the project's geocoding settings, undefined where none are saved */
  roles(): Promise<any>;
  /** the Locations that carry a top-level prop of the given type */
  locationsWithProp(typeId: string): Promise<any[]>;
  /** when each of these entities was created, in ms; an entity without a creation time is absent */
  createdAt(ids: string[]): Promise<Map<string, number>>;
  /**
   * Replaces an entity's props with `after`, but only if they are still `before`.
   *
   * A job reads its entities once and then works through them for as long as
   * that takes. A researcher can save one of them in between, and writing back
   * props computed from what the job read would undo that save and, for a
   * coordinate, leave the Location pointing at a Value the page has since
   * deleted. The comparison runs in the database, in the same write.
   *
   * @returns whether the props were replaced
   */
  replacePropsIfUnchanged(entityId: string, before: unknown[], after: unknown[]): Promise<boolean>;
}

const toMs = (rows: { id: string; createdAt?: unknown }[]): Map<string, number> =>
  new Map(
    rows
      .filter((row) => row.createdAt)
      .map((row): [string, number] => [row.id, new Date(row.createdAt as string | Date).getTime()])
  );

export const rethinkGeocodingRows = (db: Connection): GeocodingRows => ({
  roles: async () =>
    ((await r.table("settings").get(GEOCODING_SETTINGS_KEY).run(db)) as any)?.value?.roles,
  locationsWithProp: (typeId) =>
    r
      .table("entities")
      .filter((entity: any) =>
        entity("class")
          .eq("L")
          .and(
            entity("props")
              .default([])
              .contains((prop: any) => prop("type")("entityId").eq(typeId))
          )
      )
      .run(db),
  createdAt: async (ids) =>
    ids.length
      ? toMs(
          (await r
            .table("entities")
            .getAll(...ids)
            .pluck("id", "createdAt")
            .run(db)) as any[]
        )
      : new Map(),
  replacePropsIfUnchanged: async (entityId, before, after) => {
    const result: any = await r
      .table("entities")
      .get(entityId)
      .update((entity: any) =>
        r.branch(entity("props").default([]).eq(r.expr(before)), { props: after }, {})
      )
      .run(db);
    return result.replaced === 1;
  },
});

// Every table keeps the whole record in `doc jsonb`; `id` and `class` are
// columns generated from it. jsonb equality ignores key order, as RethinkDB's
// eq does, so props read, parsed and sent back compare equal to the stored ones.
export const pgGeocodingRows = (db: Client): GeocodingRows => ({
  roles: async () =>
    (await db.query("SELECT doc FROM settings WHERE id = $1", [GEOCODING_SETTINGS_KEY])).rows[0]
      ?.doc?.value?.roles,
  // containment matches the top-level props only, and is false rather than an
  // error where `props` is missing or not an array
  locationsWithProp: async (typeId) =>
    (
      await db.query(
        "SELECT doc FROM entities WHERE class = 'L' AND doc->'props' @> $1::jsonb ORDER BY id",
        [JSON.stringify([{ type: { entityId: typeId } }])]
      )
    ).rows.map((row) => row.doc),
  createdAt: async (ids) =>
    ids.length
      ? toMs(
          (
            await db.query(
              "SELECT id, doc->>'createdAt' AS \"createdAt\" FROM entities WHERE id = ANY($1::text[])",
              [ids]
            )
          ).rows
        )
      : new Map(),
  replacePropsIfUnchanged: async (entityId, before, after) =>
    (
      await db.query(
        "UPDATE entities SET doc = jsonb_set(doc, '{props}', $3::jsonb) " +
          "WHERE id = $1 AND COALESCE(doc->'props', '[]'::jsonb) = $2::jsonb",
        [entityId, JSON.stringify(before), JSON.stringify(after)]
      )
    ).rowCount === 1,
});
