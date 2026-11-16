import { DbEnums, EntityEnums } from "@inkvisitor/shared/enums";
import { IAudit, IProp, IStatement } from "@inkvisitor/shared/types";
import { AuditScope } from "@inkvisitor/shared/types/audit";
import { Query } from "@inkvisitor/shared/types/query";
import { EventType } from "@inkvisitor/shared/types/stats";
import { Connection, r, RDatum, RStream } from "rethinkdb-ts";
import { nodeLabel } from "../../../../common/searchLabel";
import { nodeFilters } from "../../postgres/query/filters";
import { Conn } from "../../types";
import { unwrap, wrap } from "../conn";
import { searchWordByWord } from "../search";
import { audits, TABLE } from "../tables";
import { QUERY_RUN_OPTIONS } from "./run-options";

const asDate = (iso: string | undefined): Date | undefined => (iso ? new Date(iso) : undefined);

const entityIdsOf = (list: IAudit[]): Set<string> =>
  new Set(list.filter((a) => a.auditScope === AuditScope.Entity).map((a) => a.modelId));

function addPropIds(held: (string | undefined)[], props: IProp[] = []): void {
  for (const prop of props) {
    held.push(prop.type?.entityId, prop.value?.entityId);
    addPropIds(held, prop.children);
  }
}

/** the ids a statement holds, the same ones the StatementEntities and StatementDataProps indexes key it by */
function heldIds(s: IStatement): string[] {
  const held: (string | undefined)[] = [s.id, s.data.territory?.territoryId, ...(s.data.tags ?? [])];
  for (const action of s.data.actions ?? []) {
    held.push(action.actionId);
    addPropIds(held, action.props);
  }
  for (const actant of s.data.actants ?? []) {
    held.push(actant.entityId);
    addPropIds(held, actant.props);
  }
  return [...new Set(held.filter((id): id is string => !!id))];
}

/**
 * the ids sharing a statement with one of `ids`, as Statement.getCoOccurrentEntityIds reads it.
 * A listed id is one only on a statement with another listed id
 */
async function coOccurrentIds(db: Connection, ids: string[]): Promise<Set<string>> {
  const byIndex = (index: DbEnums.Indexes) =>
    r.table(TABLE.entities).getAll(r.args(ids), { index });
  // both indexes are multi indexes, so one statement can arrive several times
  const statements: IStatement[] = await byIndex(DbEnums.Indexes.StatementEntities)
    .union(byIndex(DbEnums.Indexes.StatementDataProps) as unknown as RStream)
    .filter((e: RDatum) => e("class").eq(EntityEnums.Class.Statement))
    .distinct()
    .run(db, QUERY_RUN_OPTIONS);

  const listed = new Set(ids);
  const out = new Set<string>();
  for (const s of statements) {
    const held = heldIds(s);
    const listedHere = held.filter((id) => listed.has(id));
    for (const id of held) {
      if (listedHere.some((l) => l !== id)) {
        out.add(id);
      }
    }
  }
  return out;
}

/**
 * The ids passing a node's date, user and co-occurrence filters, null when none of them is set.
 * The dates and users read the audits as the Explorer's filters do. The params are parsed by
 * PostgreSQL's nodeFilters, so both stores reject the same malformed params with 400.
 */
export async function auditAndCoOccurrenceIds(
  db: Connection,
  params: Query.INodeParams
): Promise<string[] | null> {
  const f = nodeFilters(params);
  const conn = wrap(db);
  const sets: Set<string>[] = [];

  if (f.createdAfter || f.createdBefore) {
    const first = await audits.firstPerEntityInRange(
      conn,
      asDate(f.createdAfter),
      asDate(f.createdBefore)
    );
    sets.push(entityIdsOf(first));
  }
  if (f.updatedAfter || f.updatedBefore) {
    const last = await audits.lastPerEntityInRange(
      conn,
      asDate(f.updatedAfter),
      asDate(f.updatedBefore)
    );
    sets.push(entityIdsOf(last));
  }
  if (f.createdBy) {
    sets.push(entityIdsOf(await audits.byTypeAndUser(conn, EventType.CREATE, f.createdBy)));
  }
  if (f.updatedBy) {
    sets.push(entityIdsOf(await audits.byTypeAndUser(conn, EventType.EDIT, f.updatedBy)));
  }
  if (f.editedBy.length) {
    const edited: IAudit[] = [];
    for (const user of f.editedBy) {
      edited.push(...(await audits.byTypeAndUser(conn, EventType.CREATE, user)));
      edited.push(...(await audits.byTypeAndUser(conn, EventType.EDIT, user)));
    }
    sets.push(entityIdsOf(edited));
  }
  if (f.coOccurrence.length) {
    sets.push(await coOccurrentIds(db, f.coOccurrence));
  }

  if (!sets.length) {
    return null;
  }
  const [first, ...rest] = sets;
  return [...first].filter((id) => rest.every((set) => set.has(id)));
}

/** `stream` kept to the entities whose id is in `ids`; null keeps it whole */
export const withinIds = (stream: RStream, ids: string[] | null): RStream =>
  ids ? stream.filter((row: RDatum) => r.expr(ids).contains(row("id"))) : stream;

/**
 * `stream` kept to the entities whose data carries one of the node's logical types and one of
 * its parts of speech; an empty list keeps it whole. An entity without the field matches no list
 */
export function withinDataFields(stream: RStream, params: Query.INodeParams): RStream {
  let q = stream;
  const logicalTypes = params.entityLogicalTypes ?? [];
  const partsOfSpeech = params.entityPartsOfSpeech ?? [];
  if (logicalTypes.length) {
    q = q.filter((row: RDatum) =>
      r.expr(logicalTypes).contains(row("data")("logicalType").default(null))
    );
  }
  if (partsOfSpeech.length) {
    q = q.filter((row: RDatum) =>
      r.expr(partsOfSpeech).contains(row("data")("pos").default(null))
    );
  }
  return q;
}

/** the ids among `ids` whose entities pass the node filters in `params` */
export async function idsPassingFilters(
  conn: Conn,
  ids: string[],
  params: Query.INodeParams
): Promise<string[]> {
  if (!ids.length) {
    return [];
  }
  const db = unwrap(conn);
  const statuses = params.entityStatuses ?? [];
  const languages = params.entityLanguages ?? [];
  const label = nodeLabel(params.label);
  let q: RStream = r.table(TABLE.entities).getAll(r.args(ids));
  if (statuses.length) {
    q = q.filter((row: RDatum) => r.expr(statuses).contains(row("status")));
  }
  if (languages.length) {
    q = q.filter((row: RDatum) => r.expr(languages).contains(row("language")));
  }
  if (label) {
    q = q.filter((row: RDatum) => searchWordByWord(row, ...label));
  }
  q = withinIds(withinDataFields(q, params), await auditAndCoOccurrenceIds(db, params));
  return (q as unknown as RDatum)("id").run(db, QUERY_RUN_OPTIONS);
}
