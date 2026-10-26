import { DbEnums, EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, Relation as RelationTypes } from "@inkvisitor/shared/types";
import { TABLE } from "../names";
import { Conn, EntityStore, RelationStore, Row } from "../types";
import { notifyChanged } from "./invalidation";
import { labelMatch, labelPattern, searchWhere } from "./search";
import { Params, encode, ident, indexHolds, indexPredicate } from "./sql";
import { docs, q, tableStore } from "./tables";

/**
 * Entity and relation operations, each one query mirroring the ReQL body of
 * the same operation in ../rethink/tables.ts. Reads are ordered by id so a
 * result is stable across runs.
 */

/** class values are enum constants, so they are spliced as literals */
export const ofClass = (cls: EntityEnums.Class): string => `class = '${cls}'`;
export const STATEMENT = ofClass(EntityEnums.Class.Statement);

async function select<T extends Row>(conn: Conn, table: string, where: string, params: unknown[]): Promise<T[]> {
  return docs<T>(table, await q(conn, `SELECT doc FROM ${ident(table)} WHERE ${where} ORDER BY id`, params));
}

const selectEntities = (conn: Conn, where: string, params: unknown[]) =>
  select<IEntity>(conn, TABLE.entities, where, params);
const selectRelations = (conn: Conn, where: string, params: unknown[]) =>
  select<RelationTypes.IRelation>(conn, TABLE.relations, where, params);

export const entities: EntityStore = {
  ...tableStore<IEntity>(TABLE.entities),

  byClass(conn, entityClass) {
    return entities.byIndex(conn, DbEnums.Indexes.Class, [entityClass]);
  },

  statementsByIndex(conn, index, key) {
    const pred = indexPredicate(TABLE.entities, index, [key]);
    return selectEntities(conn, `${pred.sql} AND ${STATEMENT}`, pred.params);
  },

  resourcesByDocumentId(conn, documentId) {
    return selectEntities(
      conn,
      `${ofClass(EntityEnums.Class.Resource)} AND document_id = $1`,
      [documentId]
    );
  },

  async resourcesByDocumentIds(conn, documentIds) {
    if (!documentIds.length) {
      return [];
    }
    // a resource without a document matches an empty string in the list, as
    // the ReQL `.default("")` makes it
    return selectEntities(
      conn,
      `${ofClass(EntityEnums.Class.Resource)} AND coalesce(document_id, '') = ANY($1::text[])`,
      [documentIds]
    );
  },

  territoryChildren(conn, parentId) {
    return selectEntities(
      conn,
      // the root's `parent: false` has no parent_id, so it never matches
      `${ofClass(EntityEnums.Class.Territory)} AND parent_id = $1`,
      [parentId]
    );
  },

  async statementTerritoryPairs(conn, entityIds, indexes) {
    if (!entityIds.length || !indexes.length) {
      return [];
    }
    // one block per index, so a statement found under two indexes or two ids
    // is reported once per match, as the ReQL union of passes reports it.
    // `->>` yields NULL for a territory that is missing, null or not an object.
    const blocks = indexes.map(
      (index) => `SELECT e.id AS "entityId", territory_id AS "territoryId"
        FROM unnest($1::text[]) AS e(id)
        JOIN ${ident(TABLE.entities)} ON ${indexHolds(TABLE.entities, index, "e.id")}
        WHERE ${STATEMENT}`
    );
    const res = await q(conn, blocks.join("\nUNION ALL\n"), [entityIds]);
    return res.rows as { entityId: string; territoryId: string | null }[];
  },

  async updateStatementTerritoryOrders(conn, updates, updatedAt) {
    if (!updates.length) {
      return;
    }
    const rows = updates.map((u) => ({
      id: u.id,
      patch: { data: { territory: { territoryId: u.territoryId, order: u.order } }, updatedAt },
    }));
    // one atomic statement; an id without a row is skipped, as ReQL skips it
    const res = await q(
      conn,
      `UPDATE ${ident(TABLE.entities)} e SET doc = jsonb_deep_merge(e.doc, u.patch)
         FROM jsonb_to_recordset($1::jsonb) AS u(id text, patch jsonb)
        WHERE e.id = u.id
        RETURNING e.id`,
      [encode(rows)]
    );
    notifyChanged(TABLE.entities, res.rows.map((row: { id: string }) => row.id), "update");
  },

  async idsMatchingLabel(conn, ids, label, leftWildcard, rightWildcard) {
    if (!ids.length) {
      return [];
    }
    const p = new Params();
    const res = await q(
      conn,
      `SELECT id FROM ${ident(TABLE.entities)} WHERE id = ANY(${p.add(ids)}::text[]) AND ${labelMatch(
        p,
        labelPattern(label, leftWildcard, rightWildcard)
      )} ORDER BY id`,
      p.list
    );
    return res.rows.map((row: { id: string }) => row.id);
  },

  // a row without the field comes back without the key, as pluck gives it
  async labelsOf(conn, ids) {
    if (!ids.length) {
      return [];
    }
    const res = await q(
      conn,
      `SELECT id, doc->'labels' AS labels FROM ${ident(TABLE.entities)} WHERE id = ANY($1::text[]) ORDER BY id`,
      [ids]
    );
    return res.rows.map((row: { id: string; labels: string[] | null }) =>
      row.labels !== null ? { id: row.id, labels: row.labels } : { id: row.id }
    );
  },

  search(conn, filters, opts) {
    const p = new Params();
    return selectEntities(conn, searchWhere(filters, opts?.seedIds, p), p.list);
  },
};

export const relations: RelationStore = {
  ...tableStore<RelationTypes.IRelation>(TABLE.relations),

  byType(conn, type) {
    return type ? selectRelations(conn, "type = $1", [type]) : selectRelations(conn, "TRUE", []);
  },

  async forEntities(conn, entityIds, type) {
    if (!entityIds.length) {
      return [];
    }
    // one row per relation whatever the number of matching ids, which is what
    // the ReQL `.distinct()` after the multi-index getAll produces
    const touching = "entity_ids && $1::text[]";
    return type
      ? selectRelations(conn, `${touching} AND type = $2`, [entityIds, type])
      : selectRelations(conn, touching, [entityIds]);
  },
};
