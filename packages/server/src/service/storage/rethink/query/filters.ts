import { DbEnums, EntityEnums } from "@inkvisitor/shared/enums";
import { IAudit, IProp, IStatement } from "@inkvisitor/shared/types";
import { AuditScope } from "@inkvisitor/shared/types/audit";
import { Query } from "@inkvisitor/shared/types/query";
import { EventType } from "@inkvisitor/shared/types/stats";
import { Connection, r, RDatum, RStream } from "rethinkdb-ts";
import { nodeFilters } from "../../postgres/query/filters";
import { wrap } from "../conn";
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
