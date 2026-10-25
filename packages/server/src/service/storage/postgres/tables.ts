import { v4 as uuid } from "uuid";
import {
  AuditScope,
  IAudit,
  IDocument,
  IDocumentMeta,
  IResponsePermission,
  ISavedQuery,
  IUser,
} from "@inkvisitor/shared/types";
import { DbEnums, HttpMethods, UserEnums } from "@inkvisitor/shared/enums";
import { InternalServerError } from "@inkvisitor/shared/types/errors";
import { ISetting } from "@inkvisitor/shared/types/settings";
import { EventType, TimeUnit } from "@inkvisitor/shared/types/stats";
import { TABLE } from "../names";
import {
  AclStore,
  AuditCountParams,
  AuditStore,
  Conn,
  DocumentStore,
  MaterializedStatsStore,
  Row,
  SavedQueryStore,
  SettingStore,
  TableStore,
  UserStore,
  WriteChange,
  WriteOpts,
  WriteResult,
} from "../types";
import { query } from "./conn";
import { notifyChanged, notifyCleared } from "./invalidation";
import { COLUMNS, col, pgIndexName } from "./provision";
import { encode, ident, indexPredicate, revive } from "./sql";

const EMPTY: WriteResult = { deleted: 0, errors: 0, inserted: 0, replaced: 0, skipped: 0, unchanged: 0 };

/** a WriteResult in the driver's shape: every counter present, zero when unused */
export const result = (partial: Partial<WriteResult>): WriteResult => ({ ...EMPTY, ...partial });

export const q = query;

/** rows of a `SELECT doc ...` result, dates revived */
export function docs<T extends Row>(table: string, res: { rows: { doc: Row }[] }): T[] {
  return res.rows.map((row) => revive<T>(table, row.doc));
}

/** the first row of a `SELECT doc ...` result, or null */
export function firstDoc<T extends Row>(table: string, res: { rows: { doc: Row }[] }): T | null {
  return res.rows.length ? revive<T>(table, res.rows[0].doc) : null;
}

/**
 * One round trip that tells a missing row from an unchanged one: `found`
 * counts the target row, `replaced` counts the write, which only happens when
 * the new document differs (jsonb equality, so key order and number formatting
 * do not count as changes, as in RethinkDB). `merged` is evaluated inside the
 * UPDATE, where `doc` is the row version being written, so a concurrent update
 * of the same row that commits first is merged into rather than overwritten.
 */
async function write(conn: Conn, table: string, id: string, merged: string, value: Row): Promise<WriteResult> {
  const t = ident(table);
  const res = await q(
    conn,
    `WITH written AS (UPDATE ${t} SET doc = ${merged}
                      WHERE id = $1 AND doc IS DISTINCT FROM ${merged}
                      RETURNING id)
     SELECT (SELECT count(*) FROM ${t} WHERE id = $1)::int AS found,
            (SELECT count(*) FROM written)::int AS replaced`,
    [id, encode(value)]
  );
  const { found, replaced } = res.rows[0] as { found: number; replaced: number };
  if (!found) {
    return result({ skipped: 1 });
  }
  if (replaced) {
    notifyChanged(table, [id], "update");
    return result({ replaced: 1 });
  }
  return result({ unchanged: 1 });
}

const hasId = (row: Row): boolean => row.id !== undefined && row.id !== null && row.id !== "";

/**
 * ReQL's change entries of an insert that refuses duplicates, in input order:
 * a written row has its new document, a refused one an error and the row as
 * stored in both values - the row already there, or the one an earlier copy of
 * its id in the same batch wrote
 */
async function insertChanges(
  conn: Conn,
  table: string,
  rows: Row[],
  inserted: { id: string; doc?: Row }[]
): Promise<WriteChange[]> {
  const fresh = new Map(inserted.map((row) => [row.id, row.doc]));
  // a written id is claimed by its first row; a later row with that id was refused
  const written = rows.map((row) => {
    const doc = fresh.get(String(row.id));
    fresh.delete(String(row.id));
    return doc;
  });
  const refused = rows.filter((_, i) => !written[i]).map((row) => String(row.id));
  const stored = new Map<string, Row>();
  if (refused.length) {
    const res = await q(conn, `SELECT id, doc FROM ${ident(table)} WHERE id = ANY($1::text[])`, [refused]);
    for (const row of res.rows as { id: string; doc: Row }[]) {
      stored.set(row.id, row.doc);
    }
  }
  return rows.map((row, i) => {
    const doc = written[i];
    if (doc) {
      return { new_val: revive(table, doc), old_val: null };
    }
    const kept = stored.get(String(row.id));
    const prior = kept ? revive(table, kept) : null;
    return { new_val: prior, old_val: prior, error: `Duplicate primary key \`id\`: ${String(row.id)}` };
  });
}

/** ReQL refuses a patch that changes the primary key, per row */
function idMoveRefused(rows: number, opts?: WriteOpts): WriteResult {
  const out = result({ errors: rows, first_error: "Primary key `id` cannot be changed" });
  if (opts?.returnChanges) {
    out.changes = Array.from({ length: rows }, () => ({ new_val: null, old_val: null, error: out.first_error }));
  }
  return out;
}

/** counters and change entries of a bulk merge; `skipped` is what the caller addressed but no row answered */
function bulkOutcome(
  table: string,
  rows: { id: string; old_doc: Row; new_doc: Row; replaced: boolean }[],
  skipped: number,
  opts?: WriteOpts
): WriteResult {
  const replacedIds = rows.filter((row) => row.replaced).map((row) => row.id);
  notifyChanged(table, replacedIds, "update");
  const out = result({ replaced: replacedIds.length, unchanged: rows.length - replacedIds.length, skipped });
  if (opts?.returnChanges) {
    out.changes = rows.map((row) => ({ new_val: revive(table, row.new_doc), old_val: revive(table, row.old_doc) }));
  }
  return out;
}

export function tableStore<T extends Row>(name: string): TableStore<T> {
  const t = ident(name);
  return {
    async get(conn, id) {
      return firstDoc<T>(name, await q(conn, `SELECT doc FROM ${t} WHERE id = $1`, [id]));
    },
    async getMany(conn, ids) {
      if (!ids.length) {
        return [];
      }
      return docs<T>(name, await q(conn, `SELECT doc FROM ${t} WHERE id = ANY($1::text[]) ORDER BY id`, [ids]));
    },
    async all(conn) {
      return docs<T>(name, await q(conn, `SELECT doc FROM ${t} ORDER BY id`));
    },
    async byIndex(conn, index, keys) {
      if (!keys.length) {
        return [];
      }
      const where = indexPredicate(name, index, keys);
      return docs<T>(name, await q(conn, `SELECT doc FROM ${t} WHERE ${where.sql} ORDER BY id`, where.params));
    },
    async insert(conn, input, opts) {
      const list = Array.isArray(input) ? input : [input];
      if (!list.length) {
        return result({});
      }
      // RethinkDB generates the primary key for rows without one and reports
      // them in generated_keys; here the key is a uuid v4 minted in-process
      const generated: string[] = [];
      const rows = list.map((row) => {
        if (hasId(row)) {
          return row;
        }
        const id = uuid();
        generated.push(id);
        return { ...row, id };
      });
      const conflict = opts?.conflict ?? "error";
      // ON CONFLICT ... DO UPDATE ... WHERE returns written rows only, so the
      // "always" changes contract (unchanged rows and old_val included) cannot be met
      if (opts?.returnChanges && conflict !== "error") {
        throw new InternalServerError("postgres insert: returnChanges with conflict replace/update is not implemented");
      }
      const returning = opts?.returnChanges ? "id, doc" : "id";
      let written: WriteResult;
      if (conflict === "error") {
        const res = await q(
          conn,
          `INSERT INTO ${t} (doc) SELECT jsonb_array_elements($1::jsonb) ON CONFLICT (id) DO NOTHING RETURNING ${returning}`,
          [encode(rows)]
        );
        const outcome = res.rows as { id: string; doc?: Row }[];
        const inserted = outcome.map((row) => row.id);
        const errors = rows.length - inserted.length;
        written = result({ inserted: inserted.length, errors });
        if (opts?.returnChanges) {
          written.changes = await insertChanges(conn, name, rows, outcome);
        }
        if (errors) {
          const done = new Set(inserted);
          // an id repeated inside the batch leaves every id in `done`
          const seen = new Set<string>();
          const repeated = rows.find((row) => {
            const id = String(row.id);
            if (seen.has(id)) {
              return true;
            }
            seen.add(id);
            return false;
          });
          const duplicate = rows.find((row) => !done.has(String(row.id))) ?? repeated;
          written.first_error = `Duplicate primary key \`id\`: ${duplicate ? String(duplicate.id) : ""}`;
        }
        notifyChanged(name, inserted, "insert");
      } else {
        // ON CONFLICT DO UPDATE refuses a batch that touches one row twice;
        // ReQL applies the rows in order, so the last one wins
        const byId = new Map<string, Row>();
        for (const row of rows) {
          byId.set(String(row.id), row);
        }
        const unique = [...byId.values()];
        const merged = conflict === "update" ? `jsonb_deep_merge(${t}.doc, EXCLUDED.doc)` : "EXCLUDED.doc";
        const res = await q(
          conn,
          `INSERT INTO ${t} (doc) SELECT jsonb_array_elements($1::jsonb)
           ON CONFLICT (id) DO UPDATE SET doc = ${merged}
           WHERE ${t}.doc IS DISTINCT FROM ${merged}
           RETURNING id, (xmax = 0) AS inserted`,
          [encode(unique)]
        );
        const outcome = res.rows as { id: string; inserted: boolean }[];
        const inserted = outcome.filter((row) => row.inserted).map((row) => row.id);
        const replaced = outcome.filter((row) => !row.inserted).map((row) => row.id);
        written = result({
          inserted: inserted.length,
          replaced: replaced.length,
          unchanged: unique.length - outcome.length,
        });
        notifyChanged(name, inserted, "insert");
        notifyChanged(name, replaced, "update");
      }
      if (generated.length) {
        written.generated_keys = generated;
      }
      return written;
    },
    update(conn, id, patch) {
      // the `id` column is generated from the document, so a differing id
      // would move the row to another key; ReQL refuses it, and callers
      // branch on `replaced || unchanged`
      if (patch.id !== undefined && String(patch.id) !== id) {
        return Promise.resolve(result({ errors: 1, first_error: "Primary key `id` cannot be changed" }));
      }
      return write(conn, name, id, "jsonb_deep_merge(doc, $2::jsonb)", patch);
    },
    async updateMany(conn, ids, patch, opts) {
      const unique = [...new Set(ids)];
      if (!unique.length) {
        return result({});
      }
      if (patch.id !== undefined) {
        return idMoveRefused(unique.length, opts);
      }
      // the target rows are read once for their old document; the UPDATE merges
      // into the row version it locks, so a concurrent write that commits first
      // is merged into, and an unchanged row is reported without being rewritten
      const res = await q(
        conn,
        `WITH target AS (SELECT id, doc FROM ${t} WHERE id = ANY($1::text[])),
              written AS (UPDATE ${t} AS u SET doc = jsonb_deep_merge(u.doc, $2::jsonb)
                          FROM target WHERE u.id = target.id
                            AND u.doc IS DISTINCT FROM jsonb_deep_merge(u.doc, $2::jsonb)
                          RETURNING u.id)
         SELECT target.id, target.doc AS old_doc, jsonb_deep_merge(target.doc, $2::jsonb) AS new_doc,
                (written.id IS NOT NULL) AS replaced
         FROM target LEFT JOIN written ON written.id = target.id`,
        [unique, encode(patch)]
      );
      return bulkOutcome(name, res.rows, 0, opts);
    },
    async updateEach(conn, updates, opts) {
      if (!updates.length) {
        return result({});
      }
      const moves = updates.filter((u) => u.patch.id !== undefined && String(u.patch.id) !== u.id);
      const applied = updates.filter((u) => !moves.includes(u));
      let out = result({});
      if (applied.length) {
        const res = await q(
          conn,
          `WITH patch AS (SELECT id, patch FROM jsonb_to_recordset($1::jsonb) AS p(id text, patch jsonb)),
                target AS (SELECT u.id, u.doc, patch.patch FROM ${t} u JOIN patch ON patch.id = u.id),
                written AS (UPDATE ${t} AS u SET doc = jsonb_deep_merge(u.doc, target.patch)
                            FROM target WHERE u.id = target.id
                              AND u.doc IS DISTINCT FROM jsonb_deep_merge(u.doc, target.patch)
                            RETURNING u.id)
           SELECT target.id, target.doc AS old_doc, jsonb_deep_merge(target.doc, target.patch) AS new_doc,
                  (written.id IS NOT NULL) AS replaced
           FROM target LEFT JOIN written ON written.id = target.id`,
          [encode(applied.map((u) => ({ id: u.id, patch: u.patch })))]
        );
        out = bulkOutcome(name, res.rows, applied.length - res.rows.length, opts);
      }
      if (moves.length) {
        const refused = idMoveRefused(moves.length, opts);
        out.errors += refused.errors;
        out.first_error = out.first_error ?? refused.first_error;
        if (opts?.returnChanges) {
          out.changes = [...(out.changes ?? []), ...(refused.changes ?? [])];
        }
      }
      return out;
    },
    replace(conn, id, row) {
      if (row.id === undefined || row.id === null) {
        return Promise.resolve(result({ errors: 1, first_error: "Inserted object must have primary key `id`" }));
      }
      if (String(row.id) !== id) {
        return Promise.resolve(result({ errors: 1, first_error: "Primary key `id` cannot be changed" }));
      }
      return write(conn, name, id, "$2::jsonb", row);
    },
    async delete(conn, id) {
      const res = await q(conn, `DELETE FROM ${t} WHERE id = $1 RETURNING id`, [id]);
      notifyChanged(name, res.rows.map((row: { id: string }) => row.id), "delete");
      return result({ deleted: res.rows.length });
    },
    async deleteMany(conn, ids, opts) {
      if (!ids.length) {
        return result({});
      }
      const res = await q(conn, `DELETE FROM ${t} WHERE id = ANY($1::text[]) RETURNING id, doc`, [ids]);
      notifyChanged(name, res.rows.map((row: { id: string }) => row.id), "delete");
      const out = result({ deleted: res.rows.length });
      if (opts?.returnChanges) {
        out.changes = res.rows.map((row: { doc: Row }) => ({ new_val: null, old_val: revive(name, row.doc) }));
      }
      return out;
    },
    async deleteAll(conn) {
      const res = await q(conn, `DELETE FROM ${t}`);
      notifyCleared(name);
      return result({ deleted: res.rowCount ?? 0 });
    },
  };
}

// ---- stores ---------------------------------------------------------------

const NOT_TRASHED = `NOT (doc ? 'deletedAt')`;

export const users: UserStore = {
  ...tableStore<IUser>(TABLE.users),

  async owner(conn) {
    return firstDoc<IUser>(
      TABLE.users,
      await q(conn, `SELECT doc FROM users WHERE ${NOT_TRASHED} AND doc->>'role' = $1 ORDER BY id LIMIT 1`, [UserEnums.Role.Owner])
    );
  },

  async byEmail(conn, email) {
    return firstDoc<IUser>(
      TABLE.users,
      await q(conn, `SELECT doc FROM users WHERE ${NOT_TRASHED} AND doc->>'email' = $1 ORDER BY id LIMIT 1`, [email])
    );
  },

  async byHash(conn, hash) {
    return firstDoc<IUser>(
      TABLE.users,
      await q(conn, `SELECT doc FROM users WHERE ${NOT_TRASHED} AND doc->>'hash' = $1 ORDER BY id LIMIT 1`, [hash])
    );
  },

  async allActive(conn) {
    return docs<IUser>(
      TABLE.users,
      await q(conn, `SELECT doc FROM users WHERE ${NOT_TRASHED} ORDER BY doc->>'role', doc->>'name', id`)
    );
  },

  async byLogin(conn, login, includeTrashed) {
    const trashed = includeTrashed ? "" : `AND ${NOT_TRASHED}`;
    return firstDoc<IUser>(
      TABLE.users,
      await q(
        conn,
        `SELECT doc FROM users WHERE (doc->>'name' = $1 OR doc->>'email' = $1) ${trashed} ORDER BY id LIMIT 1`,
        [login]
      )
    );
  },

  async byBookmarkedEntity(conn, entityId) {
    return docs<IUser>(
      TABLE.users,
      await q(
        conn,
        `SELECT doc FROM users
         WHERE jsonb_path_exists(doc, '$.bookmarks[*].entityIds[*] ? (@ == $id)', jsonb_build_object('id', $1::text))
         ORDER BY id`,
        [entityId]
      )
    );
  },

  async byStoredTerritory(conn, territoryId) {
    return docs<IUser>(
      TABLE.users,
      await q(
        conn,
        `SELECT doc FROM users
         WHERE jsonb_path_exists(doc, '$.storedTerritories[*].territoryId ? (@ == $id)', jsonb_build_object('id', $1::text))
         ORDER BY id`,
        [territoryId]
      )
    );
  },

  async deleteAllExceptName(conn, name) {
    // a row without a name is kept, as the ReQL filter skips the row whose field read fails
    const res = await q(conn, `DELETE FROM users WHERE doc->>'name' <> $1 RETURNING id`, [name]);
    notifyChanged(TABLE.users, res.rows.map((row: { id: string }) => row.id), "delete");
    return result({ deleted: res.rows.length });
  },
};

export const acl: AclStore = {
  ...tableStore<IResponsePermission>(TABLE.acl),

  async byRoute(conn, controller, method: HttpMethods, route) {
    return docs<IResponsePermission>(
      TABLE.acl,
      await q(
        conn,
        `SELECT doc FROM acl_permissions
         WHERE doc->>'controller' = $1 AND doc->>'method' = $2 AND doc->>'route' = $3 ORDER BY id`,
        [controller, method, route]
      )
    );
  },
};

export const settings: SettingStore = tableStore<ISetting>(TABLE.settings);

export const savedQueries: SavedQueryStore = {
  ...tableStore<ISavedQuery>(TABLE.savedQueries),

  async idsWithName(conn, normalizedName, shared, ownerId) {
    // unindexed scan: one row per saved query, and this runs only on create and on rename
    const folder = shared
      ? `(doc->>'shared')::boolean`
      : `NOT (doc->>'shared')::boolean AND doc->>'ownerId' = $2`;
    const params = shared ? [normalizedName] : [normalizedName, ownerId];
    const res = await q(
      conn,
      `SELECT id FROM saved_queries WHERE lower(doc->>'name') = $1 AND ${folder} ORDER BY id`,
      params
    );
    return res.rows.map((row: { id: string }) => row.id);
  },

  async visibleFor(conn, userId) {
    return docs<ISavedQuery>(
      TABLE.savedQueries,
      await q(
        conn,
        `SELECT doc FROM saved_queries
         WHERE (doc->>'shared')::boolean OR doc->>'ownerId' = $1
         ORDER BY doc->>'createdAt' DESC, id`,
        [userId]
      )
    );
  },
};

const documentsEntityIds = pgIndexName(TABLE.documents, DbEnums.Indexes.DocumentEntityIds);

export const documents: DocumentStore = {
  ...tableStore<IDocument>(TABLE.documents),

  async byEntityId(conn, entityId) {
    return documents.byEntityIds(conn, [entityId]);
  },

  async byEntityIds(conn, entityIds) {
    if (!entityIds.length) {
      return [];
    }
    // one row is one match, so a document listing an id twice comes back once;
    // content is dropped: no caller needs the blob
    return docs<IDocumentMeta>(
      TABLE.documents,
      await q(
        conn,
        `SELECT doc - 'content' AS doc FROM documents WHERE ${documentsEntityIds}(doc) && $1::text[] ORDER BY id`,
        [entityIds]
      )
    );
  },

  async allByCreatedAt(conn) {
    return docs<IDocument>(
      TABLE.documents,
      await q(conn, `SELECT doc FROM documents ORDER BY doc->>'createdAt', id`)
    );
  },

  async listMeta(conn) {
    return docs<IDocument>(
      TABLE.documents,
      await q(conn, `SELECT doc - 'content' - 'anchors' AS doc FROM documents ORDER BY doc->>'createdAt', id`)
    );
  },
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** audit document field -> generated column, for the fields a group key may read */
const AUDIT_COLUMN_OF_FIELD: Record<string, string> = {};
for (const [column, path] of Object.entries(COLUMNS.audits)) {
  AUDIT_COLUMN_OF_FIELD[path] = col(column);
}

function auditColumn(field: string): string {
  const column = AUDIT_COLUMN_OF_FIELD[field];
  if (!column) {
    throw new Error(`postgres: audits has no generated column for ${field}`);
  }
  return column;
}

/** the audit's UTC timestamp bucketed as ReQL does it: yyyy / yyyy-mm / yyyy-mm-dd / the Monday of its ISO week */
function bucketSql(timeUnit: TimeUnit): string {
  switch (timeUnit) {
    case TimeUnit.DAY:
      return `left(date, 10)`;
    case TimeUnit.WEEK:
      return `to_char(date_trunc('week', date::timestamptz AT TIME ZONE 'UTC'), 'YYYY-MM-DD')`;
    case TimeUnit.MONTH:
      return `left(date, 7)`;
    case TimeUnit.YEAR:
      return `left(date, 4)`;
    default:
      throw new Error("Invalid time unit");
  }
}

const auditsRelationEntityIds = pgIndexName(TABLE.audits, DbEnums.Indexes.AuditRelationEntityIds);

const byScopeAndModel = (scope: AuditScope, modelId: string) =>
  indexPredicate(TABLE.audits, DbEnums.Indexes.AuditScopeModelId, [[scope, modelId]]);

export const audits: AuditStore = {
  ...tableStore<IAudit>(TABLE.audits),

  async firstFor(conn, scope, modelId) {
    const where = byScopeAndModel(scope, modelId);
    return firstDoc<IAudit>(
      TABLE.audits,
      await q(conn, `SELECT doc FROM audits WHERE ${where.sql} ORDER BY date, id LIMIT 1`, where.params)
    );
  },

  async lastFor(conn, scope, modelId) {
    const where = byScopeAndModel(scope, modelId);
    return firstDoc<IAudit>(
      TABLE.audits,
      await q(conn, `SELECT doc FROM audits WHERE ${where.sql} ORDER BY date DESC, id LIMIT 1`, where.params)
    );
  },

  async lastNFor(conn, scope, modelId, n) {
    const where = byScopeAndModel(scope, modelId);
    return docs<IAudit>(
      TABLE.audits,
      await q(conn, `SELECT doc FROM audits WHERE ${where.sql} ORDER BY date DESC, id LIMIT $3`, [
        ...where.params,
        n,
      ])
    );
  },

  async relationAuditsForEntity(conn, entityId, n) {
    return docs<IAudit>(
      TABLE.audits,
      await q(
        conn,
        `SELECT doc FROM audits
         WHERE ${auditsRelationEntityIds}(doc) && $1::text[] AND audit_scope = $2
         ORDER BY date DESC, id LIMIT $3`,
        [[entityId], AuditScope.Relation, n]
      )
    );
  },

  async earliestDate(conn) {
    const res = await q(conn, `SELECT min(date) AS d FROM audits`);
    const d = res.rows[0]?.d as string | null;
    return d ? new Date(d) : null;
  },

  async onDate(conn, date) {
    // an audit's day is a midnight instant, so any other instant matches nothing
    if (date.getTime() % DAY_MS !== 0) {
      return [];
    }
    return docs<IAudit>(
      TABLE.audits,
      await q(conn, `SELECT doc FROM audits WHERE date >= $1 AND date < $2 ORDER BY id`, [
        date.toISOString(),
        new Date(date.getTime() + DAY_MS).toISOString(),
      ])
    );
  },

  async entityScopedInRange(conn, after, before) {
    const params: unknown[] = [AuditScope.Entity];
    let sql = `SELECT doc FROM audits WHERE audit_scope = $1`;
    if (after) {
      params.push(after.toISOString());
      sql += ` AND date >= $${params.length}`;
    }
    if (before) {
      params.push(before.toISOString());
      sql += ` AND date <= $${params.length}`;
    }
    return docs<IAudit>(TABLE.audits, await q(conn, `${sql} ORDER BY id`, params));
  },

  async byTypeAndUser(conn, type: EventType, user) {
    return docs<IAudit>(
      TABLE.audits,
      await q(conn, `SELECT doc FROM audits WHERE type = $1 AND "user" = $2 ORDER BY id`, [type, user])
    );
  },

  async page(conn, filter) {
    return docs<IAudit>(
      TABLE.audits,
      await q(
        conn,
        `SELECT doc FROM audits WHERE date >= $1 ORDER BY date, id OFFSET $2 LIMIT $3`,
        // audits whose UTC day-midnight is >= from: from rounded up to a midnight
        [new Date(Math.ceil(filter.from.getTime() / DAY_MS) * DAY_MS).toISOString(), filter.skip, filter.take]
      )
    );
  },

  async countByBucket(conn, params: AuditCountParams) {
    const values: unknown[] = [params.eventTypes];
    const where = [`type = ANY($1::text[])`];
    if (params.from !== undefined && params.to !== undefined) {
      values.push(params.from.toISOString(), params.to.toISOString());
      // ReQL between: left-closed, right-open
      where.push(`date >= $2 AND date < $3`);
    }
    if (params.entityIds) {
      values.push(AuditScope.Entity, params.entityIds);
      where.push(`audit_scope = $${values.length - 1} AND model_id = ANY($${values.length}::text[])`);
    }
    const keys = [bucketSql(params.timeUnit), ...params.groupBy.map(auditColumn)];
    const positions = keys.map((_, i) => i + 1).join(", ");
    const res = await q(
      conn,
      `SELECT ${keys.map((key, i) => `${key} AS k${i}`).join(", ")}, count(*)::int AS n
       FROM audits WHERE ${where.join(" AND ")}
       GROUP BY ${positions} ORDER BY ${positions}`,
      values
    );
    return res.rows.map((row: Record<string, unknown>) => ({
      group: keys.map((_, i) => row[`k${i}`] as string),
      reduction: row.n as number,
    }));
  },
};

export function stats(timeUnit: string): MaterializedStatsStore {
  const name = `${TABLE.statsPrefix}${timeUnit}`;
  const t = ident(name);
  return {
    ...tableStore<Row>(name),

    async byDateRange(conn, fromDate, toDate, eventTypes, aggregateBy) {
      return docs<Row>(
        name,
        await q(
          conn,
          `SELECT doc FROM ${t}
           WHERE doc->>'date' >= $1 AND doc->>'date' < $2
             AND doc->>'eventType' = ANY($3::text[]) AND doc->>'aggregateBy' = $4
           ORDER BY doc->>'date', id`,
          [fromDate, toDate, eventTypes, aggregateBy]
        )
      );
    },

    async latestUpdate(conn) {
      try {
        const res = await q(conn, `SELECT max(doc->>'lastUpdated') AS d FROM ${t}`);
        const d = res.rows[0]?.d as string | null;
        return d ? new Date(d) : null;
      } catch {
        // table might not exist yet
        return null;
      }
    },
  };
}
