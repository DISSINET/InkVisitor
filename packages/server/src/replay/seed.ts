import fs from "fs";
import path from "path";
import { r } from "rethinkdb-ts";
import { hashPassword } from "@common/auth";
import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { connectAdmin, getTestDbName } from "../test/db";
import { provisionTables } from "../test/schema";

/**
 * Builds the replay database from the tracked datasets: the `relationstest`
 * composition of packages/database/scripts/import.ts (relationstest entities
 * and relations, default users / acl / settings / documents), provisioned
 * through the same table + index list the jest harness uses.
 *
 * The seeder is interactive, so its four transforms are repeated here. Where
 * the seeder is non-deterministic the replay pins the value, because two seeds
 * of the same code must produce identical API responses:
 * - rows the dataset ships without ids (relations, acl rows) get fixed ids;
 *   RethinkDB would generate random ones and unordered reads follow the
 *   primary key
 * - the `createdAt = new Date()` fill uses a fixed date
 * - editor1 gets write and editor2 read on `t1`; the seeder filters their
 *   rights down to nothing because their territories are not in this dataset
 * - statements without a labels key get [""], the value every production
 *   statement has (search sorts by labels[0].length and would crash)
 */
type Row = Record<string, any>;

const DATASETS = path.resolve(__dirname, "../../../database/datasets");
const SEED_DATE = new Date("2020-01-01T00:00:00.000Z");
const REPLAY_RIGHTS: Record<string, Row[]> = {
  editor1: [{ territory: "t1", mode: "write" }],
  editor2: [{ territory: "t1", mode: "read" }],
};

function load(rel: string): Row[] {
  return JSON.parse(fs.readFileSync(path.join(DATASETS, rel), "utf8"));
}

// mirror of checkRelation in packages/database/scripts/import/common.ts
function isUsableRelation(rel: Row, entityIds: Set<string>): boolean {
  const ids: unknown[] = rel.entityIds;
  if (ids.length !== 2 && rel.type !== RelationEnums.Type.Synonym) return false;
  if (ids.length === 2 && ids[0] === ids[1]) return false;
  return ids.every(
    (id) => typeof id === "string" && id.length > 0 && entityIds.has(id)
  );
}

export async function seedReplayDb(): Promise<void> {
  const dbName = getTestDbName();
  const conn = await connectAdmin();
  try {
    await r.dbDrop(dbName).run(conn).catch(() => undefined);
    await r.dbCreate(dbName).run(conn);
    conn.use(dbName);
    await provisionTables(conn);

    const entities = load("relationstest/entities.json").map((e): Row => ({
      ...e,
      createdAt: e.createdAt ?? SEED_DATE,
      // the dataset's statements have no labels key; every production
      // statement carries [""] and search sorts by labels[0].length
      labels: e.labels ?? [""],
    }));
    const entityIds = new Set<string>(entities.map((e) => e.id));
    const territoryIds = entities
      .filter((e) => e.class === EntityEnums.Class.Territory)
      .map((e) => e.id);

    const users = load("default/users.json").map((u) => ({
      ...u,
      password: hashPassword(u.password || ""),
      rights:
        REPLAY_RIGHTS[u.name] ??
        (u.rights as Row[]).filter((right) =>
          territoryIds.includes(right.territory)
        ),
    }));

    const relations = load("relationstest/relations.json")
      .map((rel, i) => ({ id: `rel-${i + 1}`, ...rel, order: rel.order || 1 }))
      .filter((rel) => isUsableRelation(rel, entityIds));

    const tables: Record<string, Row[]> = {
      settings: load("default/settings.json"),
      users,
      acl_permissions: load("default/acl_permissions.json").map((row, i) => ({
        id: `acl-${i + 1}`,
        ...row,
      })),
      entities,
      relations,
      documents: load("default/documents.json"),
    };
    for (const [table, rows] of Object.entries(tables)) {
      await r.table(table).insert(rows).run(conn);
    }
  } finally {
    await conn.close();
  }
}

export async function dropReplayDb(): Promise<void> {
  const conn = await connectAdmin();
  try {
    await r.dbDrop(getTestDbName()).run(conn).catch(() => undefined);
  } finally {
    await conn.close();
  }
}
