import { Connection, r, RDatum, RTable, RValue } from "rethinkdb-ts";
import { DbEnums } from "@inkvisitor/shared/enums";
import { Conn } from "../types";
import { closeConnection, openConnection, unwrap } from "./conn";
import { REQUIRED, RequiredIndex } from "../requiredIndexes";

/**
 * Table + secondary-index provisioning for throwaway databases (jest, replay)
 * and the startup check that the indexes the routes depend on exist.
 *
 * TABLES is the one RethinkDB index list. The seeder in packages/database
 * imports it through its @service alias.
 */

/**
 * A secondary index as data. RethinkDB builds it from `keys`. No `keys` means
 * the index is over the field called `name`.
 */
export interface IndexDef {
  name: string;
  keys?: (row: RDatum) => RValue;
  multi: boolean;
}

const def = (
  name: string,
  keys?: (row: RDatum) => RValue,
  opts: { multi?: boolean } = {}
): IndexDef => ({ name, keys, multi: !!opts.multi });

/** the `indexCreate` term for `index` on `table`; the caller runs it */
export function buildIndex(table: RTable, index: IndexDef) {
  const opts = index.multi ? { multi: true } : {};
  return index.keys
    ? (table.indexCreate as any)(index.name, index.keys, opts)
    : (table.indexCreate as any)(index.name, opts);
}

const entitiesIndexes: IndexDef[] = [
  def(
    DbEnums.Indexes.PropsRecursive,
    (row: RDatum) =>
      row("props")
        .concatMap((prop: RDatum) =>
          r
            .expr([prop("value")("entityId"), prop("type")("entityId")])
            .add(
              prop("children").concatMap((ch1: RDatum) =>
                r
                  .expr([ch1("value")("entityId"), ch1("type")("entityId")])
                  .add(
                    ch1("children").concatMap((ch2: RDatum) =>
                      r
                        .expr([ch2("value")("entityId"), ch2("type")("entityId")])
                        .add(
                          ch2("children").concatMap((ch3: RDatum) => [
                            ch3("value")("entityId"),
                            ch3("type")("entityId"),
                          ]) as RValue
                        )
                    ) as RValue
                  )
              ) as RValue
            )
        )
        .distinct(),
    { multi: true }
  ),
  def(
    DbEnums.Indexes.StatementDataProps,
    function (row: RDatum) {
      return (row("data")("actions").concatMap((action: RDatum) => {
        return action("props").concatMap((ch1: RDatum) => {
          return r
            .expr([ch1("value")("entityId"), ch1("type")("entityId")])
            .add(
              ch1("children").concatMap((ch2: RDatum) =>
                r
                  .expr([ch2("value")("entityId"), ch2("type")("entityId")])
                  .add(
                    ch2("children").concatMap((ch3: RDatum) => [
                      ch3("value")("entityId"),
                      ch3("type")("entityId"),
                    ]) as RValue
                  )
              ) as RValue
            );
        });
      }).add(
        row("data")("actants").concatMap((actant: RDatum) => {
          return actant("props").concatMap((ch1: RDatum) => {
            return r
              .expr([ch1("value")("entityId"), ch1("type")("entityId")])
              .add(
                ch1("children").concatMap((ch2: RDatum) =>
                  r
                    .expr([ch2("value")("entityId"), ch2("type")("entityId")])
                    .add(
                      ch2("children").concatMap((ch3: RDatum) => [
                        ch3("value")("entityId"),
                        ch3("type")("entityId"),
                      ]) as RValue
                    )
                ) as RValue
              );
          });
        }) as any
      ) as any).distinct();
    },
    { multi: true }
  ),
  def(DbEnums.Indexes.Class),
  def(DbEnums.Indexes.StatementTerritory, (row: RDatum) =>
    row("data")("territory")("territoryId")
  ),
  def(
    DbEnums.Indexes.StatementEntities,
    function (row: RDatum) {
      return (row("data")("actions")
        .map(function (a: RDatum) {
          return a("actionId");
        })
        .add(
          row("data")("actants").map(function (a: RDatum) {
            return a("entityId");
          }) as any,
          row("data")("tags").map(function (t: RDatum) {
            return t;
          }) as any,
          r.branch(
            row("data").hasFields("territory"),
            [row("data")("territory")("territoryId")],
            []
          ) as any
        ) as any).distinct();
    },
    { multi: true }
  ),
  def(DbEnums.Indexes.EntityUsedTemplate),
  def(
    DbEnums.Indexes.EntityReferences,
    function (row: RDatum) {
      return r.branch(
        row.hasFields("references").not(),
        [] as unknown as RValue,
        row("references")
          .concatMap((ref: RDatum) => [
            ref("resource").default(""),
            ref("value").default(""),
          ])
          // a reference row is created before either side is picked, so empty
          // sides are common - they would all pile up under a single "" key
          .filter((id: RDatum) => id.ne(""))
          .distinct()
      );
    },
    { multi: true }
  ),
  def(
    DbEnums.Indexes.StatementActantsCI,
    function (row: RDatum) {
      return row("data")("actants")
        .concatMap(function (a: RDatum) {
          return r
            .branch(
              a.hasFields("classifications"),
              a("classifications").map(function (cRow: RDatum) {
                return cRow("entityId");
              }),
              []
            )
            .add(
              r.branch(
                a.hasFields("identifications"),
                a("identifications").map(function (iRow: RDatum) {
                  return iRow("entityId");
                }),
                []
              ) as any
            );
        })
        .distinct();
    },
    { multi: true }
  ),
];

const auditsIndexes: IndexDef[] = [
  def(DbEnums.Indexes.AuditScopeModelId, (row: RDatum) => [
    row("auditScope"),
    row("modelId"),
  ]),
  def(DbEnums.Indexes.AuditDate),
  def(DbEnums.Indexes.AuditDateTypeUser, (row: RDatum) => [
    row("date"),
    row("type"),
    row("user"),
  ]),
  def(
    DbEnums.Indexes.AuditRelationEntityIds,
    (row: RDatum) => row("changes")("entityIds").default([]),
    { multi: true }
  ),
];

const relationsIndexes: IndexDef[] = [
  def(DbEnums.Indexes.RelationsEntityIds, undefined, { multi: true }),
];

const documentsIndexes: IndexDef[] = [
  // Multi-index over every entity id referenced by a document. Backs
  // Document.findByEntityId so it can getAll the matching documents instead of
  // scanning the whole table and deserializing every document's full content.
  // The function flattens both shapes entityIds comes in.
  def(
    DbEnums.Indexes.DocumentEntityIds,
    function (row: RDatum) {
      return r.branch(
        // a malformed/legacy row without entityIds contributes no keys
        row.hasFields("entityIds").not(),
        [] as unknown as RValue,
        // legacy flat string[] shape
        row("entityIds").typeOf().eq("ARRAY"),
        row("entityIds"),
        // canonical Record<Class, string[]> shape
        row("entityIds").values().concatMap((arr: RDatum) => arr)
      );
    },
    { multi: true }
  ),
];

const materializedStatsIndexes: IndexDef[] = [
  def("date"),
  def("lastUpdated"),
  def("date_eventType_aggregateBy", (row: RDatum) => [
    row("date"),
    row("eventType"),
    row("aggregateBy"),
  ]),
];

/**
 * Physical RethinkDB table name -> its secondary indexes. Table names match the
 * `static table` values on the server models (and the import tooling's
 * TABLE_PHYSICAL_NAMES map). Statements live in the `entities` table.
 */
export const TABLES: Record<string, IndexDef[]> = {
  entities: entitiesIndexes,
  relations: relationsIndexes,
  audits: auditsIndexes,
  documents: documentsIndexes,
  users: [],
  acl_permissions: [],
  settings: [],
  saved_queries: [],
  stats_materialized_day: materializedStatsIndexes,
  stats_materialized_week: materializedStatsIndexes,
  stats_materialized_month: materializedStatsIndexes,
  stats_materialized_year: materializedStatsIndexes,
};

/**
 * Create every table and its secondary indexes on the (already-created,
 * already-`use`d) test database, waiting for each table's indexes to finish
 * building before moving on so the first query never races a half-built index.
 */
async function provisionTables(conn: Connection): Promise<void> {
  for (const [table, indexes] of Object.entries(TABLES)) {
    await r.tableCreate(table).run(conn);
    for (const idx of indexes) {
      await buildIndex(r.table(table), idx).run(conn);
    }
    if (indexes.length) {
      await r.table(table).indexWait().run(conn);
    }
  }
}

/** Drops `name` if it exists and recreates it with every table and index. */
export async function createDatabase(name: string): Promise<void> {
  const conn = await openConnection({ db: null, timeoutSeconds: 5 });
  try {
    await r.dbDrop(name).run(unwrap(conn)).catch(() => undefined);
    await r.dbCreate(name).run(unwrap(conn));
    unwrap(conn).use(name);
    await provisionTables(unwrap(conn));
  } finally {
    await closeConnection(conn, { noreplyWait: false });
  }
}

export async function dropDatabase(name: string): Promise<void> {
  const conn = await openConnection({ db: null, timeoutSeconds: 5 });
  try {
    await r.dbDrop(name).run(unwrap(conn)).catch(() => undefined);
  } finally {
    await closeConnection(conn, { noreplyWait: false });
  }
}

/**
 * Verifies every entry in REQUIRED exists on the connected RethinkDB.
 * Throws with operator instructions if anything is missing.
 */
export async function assertRequiredIndexes(conn: Conn): Promise<void> {
  const db = unwrap(conn);
  const tableList = (await r.tableList().run(db)) as string[];
  const indexCache = new Map<string, string[]>();
  const missing: RequiredIndex[] = [];

  for (const req of REQUIRED) {
    if (!tableList.includes(req.table)) {
      missing.push(req);
      continue;
    }
    let indexes = indexCache.get(req.table);
    if (!indexes) {
      indexes = (await r.table(req.table).indexList().run(db)) as string[];
      indexCache.set(req.table, indexes);
    }
    if (!indexes.includes(req.index)) {
      missing.push(req);
    }
  }

  if (missing.length === 0) {
    console.log(
      `[startup] verified ${REQUIRED.length} required RethinkDB indexes`
    );
    return;
  }

  const lines = missing
    .map((m) => `  - ${m.table}.${m.index}  (${m.usedBy})`)
    .join("\n");
  throw new Error(
    `[startup] required RethinkDB indexes are missing:\n${lines}\n\n` +
      `Run \`pnpm start\` in packages/database and select ` +
      `"ensureIndexesJob" to create them, then restart the server.`
  );
}

/**
 * Builds every entity index on `table` of a suite's own database and waits
 * for them, so a raw ReQL suite runs against the indexes a real database has.
 */
export async function provisionEntityIndexes(conn: Connection, table: string): Promise<void> {
  for (const idx of entitiesIndexes) {
    await buildIndex(r.table(table), idx).run(conn);
  }
  await r.table(table).indexWait().run(conn);
}
