import { RelationEnums } from "@inkvisitor/shared/enums";
import { Relation as RelationTypes } from "@inkvisitor/shared/types";

type Rel = RelationTypes.IRelation;

const isAsymmetrical = (type: RelationEnums.Type): boolean =>
  RelationTypes.RelationRules[type]?.asymmetrical ?? false;

/** The selected row a relation of `type` ties to `other`, if any. An
 * asymmetrical relation counts only with the row as source and `other` as
 * target; `other` itself is never a row. */
function rowOf(
  type: RelationEnums.Type,
  other: string,
  rowIds: Set<string>,
  { entityIds: [a, b] }: Pick<Rel, "entityIds">
): string | undefined {
  let row: string | undefined;
  if (isAsymmetrical(type)) {
    row = b === other ? a : undefined;
  } else {
    row = a === other ? b : b === other ? a : undefined;
  }
  return row !== undefined && row !== other && rowIds.has(row) ? row : undefined;
}

/** The stored relations of `type` from each selected row to X, keyed by row id.
 * `touchingFrom` is every relation of the type that names X. */
export function matchRelationsToReplace(
  type: RelationEnums.Type,
  fromId: string,
  rowIds: Set<string>,
  touchingFrom: Rel[]
): Map<string, Rel[]> {
  const matches = new Map<string, Rel[]>();
  for (const relation of touchingFrom) {
    if (relation.type !== type) {
      continue;
    }
    const row = rowOf(type, fromId, rowIds, relation);
    if (row !== undefined) {
      matches.set(row, [...(matches.get(row) ?? []), relation]);
    }
  }
  return matches;
}

/** Ids of the selected rows that already hold a relation of `type` to Y. */
export function rowsRelatedTo(
  type: RelationEnums.Type,
  toId: string,
  rowIds: Set<string>,
  touchingTo: Rel[]
): Set<string> {
  const related = new Set<string>();
  for (const relation of touchingTo) {
    if (relation.type !== type) {
      continue;
    }
    const row = rowOf(type, toId, rowIds, relation);
    if (row !== undefined) {
      related.add(row);
    }
  }
  return related;
}

/** The relation that takes the place of `stored`: every stored field, a new
 * id, and Y in the slot X had. */
export function replacementOf(stored: Rel, fromId: string, toId: string, id: string): Rel {
  return {
    ...stored,
    id,
    entityIds: stored.entityIds.map((e) => (e === fromId ? toId : e)),
  };
}

/** Whether relations of this type can form a cycle. */
export function canFormCycle(type: RelationEnums.Type): boolean {
  const patterns = RelationTypes.RelationRules[type]?.allowedEntitiesPattern ?? [];
  if (!isAsymmetrical(type)) {
    return false;
  }
  const sources = new Set(patterns.map((p) => p[0]));
  return patterns.some((p) => sources.has(p[1]));
}

/** Whether a path leads from `from` to `to` along entityIds[0] -> entityIds[1]. */
export function leadsTo(relations: Pick<Rel, "entityIds">[], from: string, to: string): boolean {
  const next = new Map<string, string[]>();
  for (const [source, target] of relations.map((r) => r.entityIds)) {
    next.set(source, [...(next.get(source) ?? []), target]);
  }
  const visited = new Set<string>();
  const stack = [from];
  while (stack.length) {
    for (const target of next.get(stack.pop() as string) ?? []) {
      if (target === to) {
        return true;
      }
      if (!visited.has(target)) {
        visited.add(target);
        stack.push(target);
      }
    }
  }
  return false;
}
