import { Connection, r, RDatum, RTable, RValue } from "rethinkdb-ts";
import { DbEnums } from "@inkvisitor/shared/enums";
import { Conn } from "../types";
import { closeConnection, openConnection, unwrap } from "./conn";

/**
 * Table + secondary-index provisioning for throwaway databases (jest, replay)
 * and the startup check that the indexes the routes depend on exist.
 *
 * The index definitions are copied VERBATIM from the canonical source of truth,
 * packages/database/scripts/import/indexes.ts. We do not import that file
 * directly: it pulls in scripts/import/common.ts, which runs a module-level
 * dotenv.config() against ./env/.env and throws when that file is absent. Keep
 * this list in sync with indexes.ts when indexes change there.
 */

interface IndexDef {
  name: string;
  build: (table: RTable) => any;
}

const def = (name: string, ...args: unknown[]): IndexDef => ({
  name,
  build: (table: RTable) => (table.indexCreate as any)(name, ...args),
});

const entitiesIndexes: IndexDef[] = [
  def(
    DbEnums.Indexes.PropsRecursive,
    r
      .row("props")
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
                      .expr([
                        ch2("value")("entityId"),
                        ch2("type")("entityId"),
                      ])
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
  def(
    DbEnums.Indexes.StatementTerritory,
    r.row("data")("territory")("territoryId")
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
  def(DbEnums.Indexes.AuditScopeModelId, [
    r.row("auditScope"),
    r.row("modelId"),
  ]),
  def(DbEnums.Indexes.AuditDate),
  def(DbEnums.Indexes.AuditDateTypeUser, [
    r.row("date"),
    r.row("type"),
    r.row("user"),
  ]),
  def(
    DbEnums.Indexes.AuditRelationEntityIds,
    r.row("changes")("entityIds").default([]),
    { multi: true }
  ),
];

const relationsIndexes: IndexDef[] = [
  def(DbEnums.Indexes.RelationsEntityIds, { multi: true }),
];

const documentsIndexes: IndexDef[] = [
  def(
    DbEnums.Indexes.DocumentEntityIds,
    function (row: RDatum) {
      return r.branch(
        row.hasFields("entityIds").not(),
        [] as unknown as RValue,
        row("entityIds").typeOf().eq("ARRAY"),
        row("entityIds"),
        row("entityIds").values().concatMap((arr: RDatum) => arr)
      );
    },
    { multi: true }
  ),
];

const materializedStatsIndexes: IndexDef[] = [
  def("date"),
  def("lastUpdated"),
  def("date_eventType_aggregateBy", [
    r.row("date"),
    r.row("eventType"),
    r.row("aggregateBy"),
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
      await idx.build(r.table(table)).run(conn);
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
 * Indexes the server depends on at request time. If any of these are
 * missing the corresponding route throws a runtime error - we'd rather
 * fail-fast at boot with an actionable message.
 *
 * Adding a new dependency? Add an entry here and make sure the index
 * factory is declared in packages/database/scripts/import/indexes.ts;
 * the operator-run ensureIndexesJob there will create it.
 */
interface RequiredIndex {
  table: string;
  index: string;
  usedBy: string;
}

const REQUIRED: RequiredIndex[] = [
  // The entity-detail response (ResponseEntityDetail.prepare) and the delete
  // guard (Entity.getUsedByEntity) reach all of these via getAll():
  // Entity.findUsedInProps / findUsedInReferences plus
  // Statement.getLinkedEntities / findByDataPropsId / findByDataActantsCI.
  // Reuse the canonical entity-id reference set so any index added there is
  // covered here automatically.
  ...DbEnums.EntityIdReferenceIndexes.map((index) => ({
    table: "entities",
    index,
    usedBy: "entity-detail response / delete guard (getAll)",
  })),
  {
    table: "entities",
    index: DbEnums.Indexes.StatementTerritory,
    usedBy: "Statement.findStatementsInTerritory (territory statements list)",
  },
  {
    table: "documents",
    index: DbEnums.Indexes.DocumentEntityIds,
    usedBy: "Document.findByEntityId (entity tooltip/detail usedInDocuments, delete check)",
  },
  {
    table: "audits",
    index: DbEnums.Indexes.AuditRelationEntityIds,
    usedBy: "Audit.getRelationAuditsForEntity (entity-detail relation audits)",
  },
];

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
