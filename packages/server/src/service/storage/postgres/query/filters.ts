import { EntityEnums } from "@inkvisitor/shared/enums";
import { AuditScope } from "@inkvisitor/shared/types/audit";
import { Query } from "@inkvisitor/shared/types/query";
import { EventType } from "@inkvisitor/shared/types/stats";
import { nodeLabel } from "../../../../common/searchLabel";
import { TABLE } from "../../names";
import { Conn } from "../../types";
import { Params, ident } from "../sql";
import { labelMatch, labelPattern } from "../search";
import { q } from "../tables";

/** a node's filters, read from its params; nodeLabel's parts for the label, ISO strings for the dates */
export type NodeFilters = {
  statuses: EntityEnums.Status[];
  languages: EntityEnums.Language[];
  label: [string, string, string] | undefined;
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;
  createdBy?: string;
  updatedBy?: string;
  editedBy: string[];
  coOccurrence: string[];
  /** the co-occurrence filter resolved to its ids, by withCoOccurrentIds */
  coOccurrentIds?: string[];
};

export const NO_FILTERS: NodeFilters = {
  statuses: [],
  languages: [],
  label: undefined,
  editedBy: [],
  coOccurrence: [],
};

/** an ISO date as the audits store it, undefined when missing or unreadable */
const isoDate = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

export const nodeFilters = (params: Query.INodeParams): NodeFilters => ({
  statuses: params.entityStatuses ?? [],
  languages: params.entityLanguages ?? [],
  label: nodeLabel(params.label),
  createdAfter: isoDate(params.createdAfter),
  createdBefore: isoDate(params.createdBefore),
  updatedAfter: isoDate(params.updatedAfter),
  updatedBefore: isoDate(params.updatedBefore),
  createdBy: params.createdBy || undefined,
  updatedBy: params.updatedBy || undefined,
  editedBy: params.editedBy ?? [],
  coOccurrence: params.coOccurrence ?? [],
});

/** some filter constrains: filterParts emits a condition for it */
export const hasFilters = (f: NodeFilters): boolean =>
  filterParts(new Params(), "e", [], f).length > 0;

export const ENTITIES = ident(TABLE.entities);
const AUDITS = ident(TABLE.audits);

export const anyOf = (p: Params, values: unknown[]): string => `ANY(${p.add(values)}::text[])`;

/**
 * the first (min) or last (max) audit date of entity `alias` within [after, before]; the
 * (audit_scope, model_id, date) index answers it per entity. An entity without audits fails
 */
function auditDateInRange(
  p: Params,
  alias: string,
  edge: "min" | "max",
  after: string | undefined,
  before: string | undefined
): string {
  const bounds: string[] = [];
  if (after) {
    bounds.push(`d >= ${p.add(after)}`);
  }
  if (before) {
    bounds.push(`d <= ${p.add(before)}`);
  }
  const date = `SELECT ${edge}(a.date) AS d FROM ${AUDITS} a WHERE a.audit_scope = ${p.add(
    AuditScope.Entity
  )} AND a.model_id = ${alias}.id`;
  return `EXISTS (SELECT 1 FROM (${date}) f WHERE ${bounds.join(" AND ")})`;
}

/** entity `alias` has an audit of one of the types by one of the users */
function auditedBy(p: Params, alias: string, types: EventType[], users: string[]): string {
  return `EXISTS (SELECT 1 FROM ${AUDITS} a WHERE a.audit_scope = ${p.add(
    AuditScope.Entity
  )} AND a.model_id = ${alias}.id AND a.type = ${anyOf(p, types)} AND a.user_id = ${anyOf(
    p,
    users
  )})`;
}

/**
 * the ids sharing a statement with one of `ids`, as Statement.getCoOccurrentEntityIds reads it:
 * the statements the entity-keyed indexes find for `ids`, each holding its own id, actions,
 * actants, tags, territory and prop entities. A listed id is one only on a statement with
 * another listed id
 */
function coOccurrentSelect(p: Params, ids: string[]): string {
  const listed = `${p.add(ids)}::text[]`;
  const held = `ARRAY[s.id] || s.statement_entity_ids || s.statement_prop_entity_ids`;
  return `SELECT DISTINCT x FROM ${ENTITIES} s, unnest(${held}) x
    WHERE s.class = '${EntityEnums.Class.Statement}'
      AND (s.statement_entity_ids && ${listed} OR s.statement_prop_entity_ids && ${listed})
      AND EXISTS (SELECT 1 FROM unnest(${held}) l WHERE l = ANY(${listed}) AND l <> x)`;
}

/**
 * resolves the co-occurrence filter to its ids. An edge does it before run(): a per-partner
 * check nests the filter in a subquery run per relation, which would rebuild the set each time
 */
export async function withCoOccurrentIds(conn: Conn, filters: NodeFilters): Promise<NodeFilters> {
  if (!filters.coOccurrence.length) {
    return filters;
  }
  const p = new Params();
  const res = await q(conn, coOccurrentSelect(p, filters.coOccurrence), p.list);
  return { ...filters, coOccurrentIds: res.rows.map((row: { x: string }) => row.x) };
}

/**
 * entity `alias` shares a statement with one of the listed ids; a top-level subquery runs once.
 * The resolved ids are tested on `alias.id || ''`, an expression the primary key cannot serve,
 * so the planner hashes the list as a filter: as an index condition every per-partner check
 * would probe the key once per listed id, and that cost moves it off the relations index
 */
function coOccurs(p: Params, alias: string, filters: NodeFilters): string {
  return filters.coOccurrentIds
    ? `${alias}.id || '' = ${anyOf(p, filters.coOccurrentIds)}`
    : `${alias}.id = ANY(ARRAY(${coOccurrentSelect(p, filters.coOccurrence)}))`;
}

/**
 * the conditions an entity row `alias` meets to be of the classes and pass the filters, one per
 * constraint; empty lists do not constrain. Every node filter is checked here: for a node's
 * own rows, the id set an edge's prepare() selects and the per-partner checks alike
 */
export function filterParts(
  p: Params,
  alias: string,
  classes: EntityEnums.Class[],
  filters: NodeFilters
): string[] {
  const parts: string[] = [];
  if (classes.length) {
    parts.push(`${alias}.class = ${anyOf(p, classes)}`);
  }
  if (filters.statuses.length) {
    parts.push(`${alias}.status = ${anyOf(p, filters.statuses)}`);
  }
  if (filters.languages.length) {
    parts.push(`${alias}.language = ${anyOf(p, filters.languages)}`);
  }
  if (filters.label) {
    parts.push(labelMatch(p, labelPattern(...filters.label), `${alias}.labels`));
  }
  if (filters.createdAfter || filters.createdBefore) {
    parts.push(auditDateInRange(p, alias, "min", filters.createdAfter, filters.createdBefore));
  }
  if (filters.updatedAfter || filters.updatedBefore) {
    parts.push(auditDateInRange(p, alias, "max", filters.updatedAfter, filters.updatedBefore));
  }
  if (filters.createdBy) {
    parts.push(auditedBy(p, alias, [EventType.CREATE], [filters.createdBy]));
  }
  if (filters.updatedBy) {
    parts.push(auditedBy(p, alias, [EventType.EDIT], [filters.updatedBy]));
  }
  if (filters.editedBy.length) {
    parts.push(auditedBy(p, alias, [EventType.CREATE, EventType.EDIT], filters.editedBy));
  }
  if (filters.coOccurrence.length) {
    parts.push(coOccurs(p, alias, filters));
  }
  return parts;
}
