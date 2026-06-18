import { Connection, r } from "rethinkdb-ts";
import { DbEnums } from "@inkvisitor/shared/enums";

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
  // The entity-detail response (ResponseEntityDetail.prepare) reaches all of
  // these via getAll(): Entity.findUsedInProps plus Statement.getLinkedEntities
  // / findByDataPropsId / findByDataActantsCI. Reuse the canonical entity-id
  // reference set so any index added there is covered here automatically.
  ...DbEnums.EntityIdReferenceIndexes.map((index) => ({
    table: "entities",
    index,
    usedBy: "entity-detail response (getAll)",
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
];

/**
 * Verifies every entry in REQUIRED exists on the connected RethinkDB.
 * Throws with operator instructions if anything is missing.
 */
export async function assertRequiredIndexes(conn: Connection): Promise<void> {
  const tableList = (await r.tableList().run(conn)) as string[];
  const indexCache = new Map<string, string[]>();
  const missing: RequiredIndex[] = [];

  for (const req of REQUIRED) {
    if (!tableList.includes(req.table)) {
      missing.push(req);
      continue;
    }
    let indexes = indexCache.get(req.table);
    if (!indexes) {
      indexes = (await r.table(req.table).indexList().run(conn)) as string[];
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
