import { r, RDatum, RTable, RStream } from "rethinkdb-ts";
import {
  IAudit,
  IDocument,
  IDocumentMeta,
  IEntity,
  IResponsePermission,
  ISavedQuery,
  IUser,
  Relation as RelationTypes,
  AuditScope,
} from "@inkvisitor/shared/types";
import { DbEnums, EntityEnums, HttpMethods, RelationEnums, UserEnums } from "@inkvisitor/shared/enums";
import { ISetting } from "@inkvisitor/shared/types/settings";
import { EventType, TimeUnit } from "@inkvisitor/shared/types/stats";
import {
  AclStore,
  AuditCountParams,
  AuditStore,
  Conn,
  ConflictMode,
  DocumentStore,
  EntityStore,
  MaterializedStatsStore,
  RelationStore,
  Row,
  SavedQueryStore,
  SearchFilters,
  SettingStore,
  TableStore,
  UserStore,
  WriteResult,
} from "../types";
import { unwrap } from "./conn";
import { SearchQuery, searchWordByWord } from "./search";

export const TABLE = {
  entities: "entities",
  relations: "relations",
  audits: "audits",
  users: "users",
  acl: "acl_permissions",
  documents: "documents",
  settings: "settings",
  savedQueries: "saved_queries",
  sessions: "sessions",
  statsPrefix: "stats_materialized_",
} as const;

// entity ids are looked up in chunks so one ReQL union stays bounded
const USED_IN_LOOKUP_CHUNK_SIZE = 200;
const LABEL_FILTER_CHUNK_SIZE = 4000;

function tableStore<T extends Row>(name: string): TableStore<T> {
  const t = (): RTable<any> => r.table(name);
  return {
    async get(conn, id) {
      return (await t().get(id).run(unwrap(conn))) ?? null;
    },
    async getMany(conn, ids) {
      return t().getAll(r.args(ids)).run(unwrap(conn));
    },
    async all(conn) {
      return t().run(unwrap(conn));
    },
    async byIndex(conn, index, keys) {
      return t().getAll(r.args(keys as any[]), { index }).run(unwrap(conn));
    },
    async insert(conn, rows, opts) {
      const query = opts?.conflict ? t().insert(rows, { conflict: opts.conflict }) : t().insert(rows);
      return query.run(unwrap(conn));
    },
    async update(conn, id, patch) {
      return t().get(id).update(patch).run(unwrap(conn));
    },
    async replace(conn, id, row) {
      return t().get(id).replace(row).run(unwrap(conn));
    },
    async delete(conn, id) {
      return t().get(id).delete().run(unwrap(conn));
    },
    async deleteMany(conn, ids, opts) {
      const rows = t().getAll(r.args(ids));
      const query = opts?.returnChanges ? rows.delete({ returnChanges: true }) : rows.delete();
      return query.run(unwrap(conn));
    },
    async deleteAll(conn) {
      return t().delete().run(unwrap(conn));
    },
  };
}

const notTrashed = (user: RDatum) => r.not(user.hasFields("deletedAt"));

export const entities: EntityStore = {
  ...tableStore<IEntity>(TABLE.entities),

  byClass(conn, entityClass) {
    return r
      .table(TABLE.entities)
      .getAll(entityClass, { index: DbEnums.Indexes.Class })
      .run(unwrap(conn));
  },

  statementsByIndex(conn, index, key) {
    return r
      .table(TABLE.entities)
      .getAll(key, { index })
      .filter({ class: EntityEnums.Class.Statement })
      .run(unwrap(conn));
  },

  resourcesByDocumentId(conn, documentId) {
    return r
      .table(TABLE.entities)
      .filter({
        class: EntityEnums.Class.Resource,
        data: { documentId },
      })
      .run(unwrap(conn));
  },

  resourcesByDocumentIds(conn, documentIds) {
    // data.documentId is not indexed, so this walks the whole entity table -
    // one walk for the whole list instead of one per document id
    return r
      .table(TABLE.entities)
      .filter({ class: EntityEnums.Class.Resource })
      .filter((row: RDatum) =>
        r.expr(documentIds).contains(row("data")("documentId").default(""))
      )
      .run(unwrap(conn));
  },

  territoryChildren(conn, parentId) {
    return r
      .table(TABLE.entities)
      .filter({ class: EntityEnums.Class.Territory })
      .filter((territory: RDatum) =>
        r.and(
          territory("data")("parent").typeOf().eq("OBJECT"),
          territory("data")("parent")("territoryId").eq(parentId)
        )
      )
      .run(unwrap(conn));
  },

  async statementTerritoryPairs(conn, entityIds, indexes) {
    const out: { entityId: string; territoryId: string | null }[] = [];

    for (let offset = 0; offset < entityIds.length; offset += USED_IN_LOOKUP_CHUNK_SIZE) {
      const chunk = entityIds.slice(offset, offset + USED_IN_LOOKUP_CHUNK_SIZE);

      // each index pass walks the id list and tags every hit with the id it
      // was looked up under; only the territory id crosses the wire
      const passes = indexes.map((index) =>
        r.expr(chunk).concatMap(function (entityId: RDatum) {
          return r
            .table(TABLE.entities)
            .getAll(entityId, { index })
            .filter({ class: EntityEnums.Class.Statement })
            .map(function (statement: RDatum) {
              return {
                entityId,
                // reading a missing attribute raises, and one raised error
                // aborts the whole query rather than skipping the document.
                // The outer default covers a territory that is absent or
                // null, the inner one a territory object without territoryId.
                territoryId: statement("data")("territory")
                  .default(r.expr({}))
                  .getField("territoryId")
                  .default(null),
              };
            });
        })
      );

      let query: any = passes[0];
      for (const pass of passes.slice(1)) {
        query = query.union(pass);
      }

      out.push(...(await query.run(unwrap(conn))));
    }

    return out;
  },

  async updateStatementTerritoryOrders(conn, updates, updatedAt) {
    await r
      .expr(updates)
      .forEach((u: RDatum) =>
        r
          .table(TABLE.entities)
          .get(u("id"))
          .update({
            data: { territory: { territoryId: u("territoryId"), order: u("order") } },
            updatedAt,
          })
      )
      .run(unwrap(conn));
  },

  async idsMatchingLabel(conn, ids, label, leftWildcard, rightWildcard) {
    const matching: string[] = [];
    await Promise.all(
      chunk(ids, LABEL_FILTER_CHUNK_SIZE).map(async (part) => {
        const matched = (await r
          .table(TABLE.entities)
          .getAll(r.args(part))
          .filter(function (row: RDatum) {
            return searchWordByWord(row, label, leftWildcard, rightWildcard);
          })("id")
          .run(unwrap(conn))) as string[];
        matching.push(...matched);
      })
    );
    return matching;
  },

  async labelsOf(conn, ids) {
    const rows: { id: string; labels?: string[] }[] = [];
    await Promise.all(
      chunk(ids, LABEL_FILTER_CHUNK_SIZE).map(async (part) => {
        rows.push(
          ...((await r
            .table(TABLE.entities)
            .getAll(r.args(part))
            .pluck("id", "labels")
            .run(unwrap(conn))) as { id: string; labels?: string[] }[])
        );
      })
    );
    return rows;
  },

  search(conn, filters, opts) {
    const query = new SearchQuery();
    if (opts?.seedIds) {
      query.seed(opts.seedIds);
    }
    query.fromFilters(filters);
    return query.run(unwrap(conn));
  },
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export const relations: RelationStore = {
  ...tableStore<RelationTypes.IRelation>(TABLE.relations),

  byType(conn, type) {
    return r
      .table(TABLE.relations)
      .filter(type ? { type } : {})
      .run(unwrap(conn));
  },

  forEntities(conn, entityIds, type) {
    return r
      .table(TABLE.relations)
      .getAll.call(undefined, ...entityIds, { index: DbEnums.Indexes.RelationsEntityIds })
      .filter(type ? { type } : {})
      .distinct()
      .run(unwrap(conn));
  },
};

/** ReQL that buckets an audit row's `date` into the requested time unit
 * (yyyy / yyyy-mm / yyyy-mm-dd / week start). */
function timeBucketFor(timeUnit: TimeUnit): (doc: RDatum) => RDatum {
  switch (timeUnit) {
    case TimeUnit.DAY:
      return (doc: RDatum) => doc("date").toISO8601().slice(0, 10);
    case TimeUnit.WEEK:
      return (doc: RDatum) => {
        const date = doc("date");
        return date.sub(date.dayOfWeek().sub(1).mul(86400)).toISO8601().slice(0, 10);
      };
    case TimeUnit.MONTH:
      return (doc: RDatum) => doc("date").toISO8601().slice(0, 7);
    case TimeUnit.YEAR:
      return (doc: RDatum) => doc("date").toISO8601().slice(0, 4);
    default:
      throw new Error("Invalid time unit");
  }
}

const byScopeAndModel = (scope: AuditScope, modelId: string) =>
  r.table(TABLE.audits).getAll([scope, modelId], { index: DbEnums.Indexes.AuditScopeModelId });

export const audits: AuditStore = {
  ...tableStore<IAudit>(TABLE.audits),

  async firstFor(conn, scope, modelId) {
    const result = await byScopeAndModel(scope, modelId)
      .orderBy(r.asc("date"))
      .limit(1)
      .run(unwrap(conn));
    return result && result.length ? result[0] : null;
  },

  async lastFor(conn, scope, modelId) {
    const result = await byScopeAndModel(scope, modelId)
      .orderBy(r.desc("date"))
      .limit(1)
      .run(unwrap(conn));
    return result && result.length ? result[0] : null;
  },

  lastNFor(conn, scope, modelId, n) {
    return byScopeAndModel(scope, modelId).orderBy(r.desc("date")).limit(n).run(unwrap(conn));
  },

  relationAuditsForEntity(conn, entityId, n) {
    return r
      .table(TABLE.audits)
      .getAll(entityId, { index: DbEnums.Indexes.AuditRelationEntityIds })
      .filter({ auditScope: AuditScope.Relation })
      .orderBy(r.desc("date"))
      .limit(n)
      .run(unwrap(conn));
  },

  async earliestDate(conn) {
    const result = await r.table(TABLE.audits).min("date").run(unwrap(conn));
    return result ? new Date((result as any).date) : null;
  },

  onDate(conn, date) {
    return r
      .table(TABLE.audits)
      .filter(r.row("date").date().eq(date))
      .run(unwrap(conn));
  },

  entityScopedInRange(conn, after, before) {
    let query = r.table(TABLE.audits).filter(r.row("auditScope").eq(AuditScope.Entity));
    if (after) {
      query = query.filter(r.row("date").ge(after));
    }
    if (before) {
      query = query.filter(r.row("date").le(before));
    }
    return query.run(unwrap(conn));
  },

  byTypeAndUser(conn, type, user) {
    return r
      .table(TABLE.audits)
      .filter(r.row("type").eq(type))
      .filter(r.row("user").eq(user))
      .run(unwrap(conn));
  },

  page(conn, filter) {
    return r
      .table(TABLE.audits)
      .orderBy(r.asc("date"))
      .filter(r.row("date").date().ge(filter.from))
      .skip(filter.skip)
      .limit(filter.take)
      .run(unwrap(conn));
  },

  async countByBucket(conn, params: AuditCountParams) {
    const matchesEventType = (doc: RDatum) => r.expr(params.eventTypes).contains(doc("type"));

    // the `date` index narrows the scan only when a window is given
    let query =
      params.from !== undefined && params.to !== undefined
        ? r
            .table(TABLE.audits)
            .between(params.from, params.to, { index: "date" })
            .filter(matchesEventType)
        : r.table(TABLE.audits).filter(matchesEventType);

    if (params.entityIds) {
      const entityIds = params.entityIds;
      query = query.filter((doc: RDatum) =>
        doc("auditScope")
          .eq(AuditScope.Entity)
          .and(r.expr(entityIds).contains(doc("modelId")))
      );
    }

    const keys = params.groupBy.map((field) => (doc: RDatum) => doc(field));
    const grouped = (query as any).group(timeBucketFor(params.timeUnit), ...keys);

    return (await grouped.count().run(unwrap(conn))) as unknown as {
      group: string[];
      reduction: number;
    }[];
  },
};

export const users: UserStore = {
  ...tableStore<IUser>(TABLE.users),

  async owner(conn) {
    const data = await r
      .table(TABLE.users)
      .filter({ role: UserEnums.Role.Owner })
      .run(unwrap(conn));
    return data && data.length > 0 ? data[0] : null;
  },

  async byEmail(conn, email) {
    const data = await r
      .table(TABLE.users)
      .filter(notTrashed)
      .filter({ email })
      .limit(1)
      .run(unwrap(conn));
    return data && data.length ? data[0] : null;
  },

  async byHash(conn, hash) {
    const data = await r
      .table(TABLE.users)
      .filter(notTrashed)
      .filter({ hash })
      .run(unwrap(conn));
    return data && data.length ? data[0] : null;
  },

  allActive(conn) {
    return r
      .table(TABLE.users)
      .filter(notTrashed)
      .orderBy(r.asc("role"), r.asc("name"))
      .run(unwrap(conn));
  },

  async byLogin(conn, login, includeTrashed) {
    let query: RStream = r.table(TABLE.users);
    if (!includeTrashed) {
      query = query.filter(notTrashed);
    }
    const data = await query
      // the parameter is unused but load-bearing: the driver only wraps a
      // function with a parameter as a lambda, and r.row is legal in there
      .filter(function (user: RDatum) {
        return r.or(r.row("name").eq(login), r.row("email").eq(login));
      })
      .limit(1)
      .run(unwrap(conn));
    return data.length == 0 ? null : data[0];
  },

  byBookmarkedEntity(conn, entityId) {
    return r
      .table(TABLE.users)
      .filter(function (user: RDatum) {
        return user("bookmarks").contains((bookmark: RDatum) =>
          bookmark("entityIds").contains(entityId)
        );
      })
      .run(unwrap(conn));
  },

  byStoredTerritory(conn, territoryId) {
    return r
      .table(TABLE.users)
      .filter(function (user: RDatum) {
        return user("storedTerritories").contains((stored: RDatum) =>
          stored("territoryId").eq(territoryId)
        );
      })
      .run(unwrap(conn));
  },

  deleteAllExceptName(conn, name) {
    return r
      .table(TABLE.users)
      .filter(function (user: RDatum) {
        return user("name").ne(name);
      })
      .delete()
      .run(unwrap(conn));
  },
};

export const documents: DocumentStore = {
  ...tableStore<IDocument>(TABLE.documents),

  async byEntityId(conn, entityId) {
    // getAll on a multi-index yields one row per matching index key, so a
    // document listing the same id more than once comes back once thanks to
    // distinct(). Content is dropped: no caller needs the blob.
    const entries = await r
      .table(TABLE.documents)
      .getAll(entityId, { index: DbEnums.Indexes.DocumentEntityIds })
      .without("content")
      .distinct()
      .run(unwrap(conn));
    return entries && entries.length ? (entries as IDocumentMeta[]) : [];
  },

  async byEntityIds(conn, entityIds) {
    const entries = await r
      .table(TABLE.documents)
      .getAll(r.args(entityIds), { index: DbEnums.Indexes.DocumentEntityIds })
      .without("content")
      .distinct()
      .run(unwrap(conn));
    return entries && entries.length ? (entries as IDocumentMeta[]) : [];
  },

  allByCreatedAt(conn) {
    return r.table(TABLE.documents).orderBy(r.asc("createdAt")).run(unwrap(conn));
  },

  async listMeta(conn) {
    return (await r
      .table(TABLE.documents)
      .orderBy(r.asc("createdAt"))
      .without("content", "anchors")
      .run(unwrap(conn))) as IDocument[];
  },
};

export const acl: AclStore = {
  ...tableStore<IResponsePermission>(TABLE.acl),

  byRoute(conn, controller, method: HttpMethods, route) {
    return r
      .table(TABLE.acl)
      .filter({ controller, method, route })
      .run(unwrap(conn));
  },
};

export const settings: SettingStore = tableStore<ISetting>(TABLE.settings);

export const savedQueries: SavedQueryStore = {
  ...tableStore<ISavedQuery>(TABLE.savedQueries),

  async idsWithName(conn, normalizedName, shared, ownerId) {
    // unindexed scan: one row per saved query, and this runs only on create
    // and on rename
    const rows = await r
      .table(TABLE.savedQueries)
      .filter((row: RDatum) =>
        (shared
          ? row("shared").eq(true)
          : row("shared").eq(false).and(row("ownerId").eq(ownerId))
        ).and(row("name").downcase().eq(normalizedName))
      )
      .pluck("id")
      .run(unwrap(conn));
    return (rows as { id: string }[]).map((row) => row.id);
  },

  visibleFor(conn, userId) {
    return r
      .table(TABLE.savedQueries)
      .filter((row: RDatum) => row("shared").eq(true).or(row("ownerId").eq(userId)))
      .orderBy(r.desc("createdAt"))
      .run(unwrap(conn));
  },
};

export function stats(timeUnit: string): MaterializedStatsStore {
  const name = `${TABLE.statsPrefix}${timeUnit}`;
  return {
    ...tableStore<Row>(name),

    byDateRange(conn, fromDate, toDate, eventTypes, aggregateBy) {
      return r
        .table(name)
        .between(fromDate, toDate, { index: "date" })
        .filter((doc: any) => r.expr(eventTypes).contains(doc("eventType")))
        .filter((doc: any) => doc("aggregateBy").eq(aggregateBy))
        .orderBy("date")
        .run(unwrap(conn));
    },

    async latestUpdate(conn) {
      try {
        const result = await r.table(name).max("lastUpdated").run(unwrap(conn));
        return result ? new Date((result as any).lastUpdated) : null;
      } catch {
        // table might not exist yet
        return null;
      }
    },
  };
}

// exported for the session table, which shares the generic ops
export { tableStore };
export type { ConflictMode, EventType };
