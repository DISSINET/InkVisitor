import { SUBORDINATE_MAX_NODES } from "@models/relation/functions";
import { resolveExpansionIds } from "@service/query/node-expansion";
import { RelationEnums } from "@inkvisitor/shared/enums";
import { ITerritory } from "@inkvisitor/shared/types";
import { EValidationExpansionKind } from "@inkvisitor/shared/types/territory";
import { Connection } from "rethinkdb-ts";

import {
  ValidationExpansionMap,
  listValidationExpansionKeys,
} from "./validation-expansion";

// how many entity walks may be in flight at once; each walk is a chain of
// queries of its own, so a rule naming a long list must not open one per id
const EXPANSIONS_IN_PARALLEL = 8;

/**
 * Resolves the id sets the active validation rules ask for, once per request.
 *
 * Kept apart from the synchronous check in Entity.getTBasedWarnings the same
 * way SearchEdge.prepare() is kept apart from its run(): the check itself
 * issues no queries, so everything it compares against is resolved here first.
 * The result depends only on the rules, never on the entity being validated, so
 * one map serves every entity in the request.
 *
 * @param conn db connection
 * @param territories territories whose validations will be evaluated
 * @returns expansion ids per (kind, entity id); empty when no rule asks for any
 */
export const buildValidationExpansionMap = async (
  conn: Connection,
  territories: ITerritory[]
): Promise<ValidationExpansionMap> => {
  const map: ValidationExpansionMap = new Map();
  const keys = listValidationExpansionKeys(territories);

  if (!keys.length) {
    return map;
  }

  // Each key is walked on its own: a rule accepts what lies below the entities
  // IT names, so a walk that started from several entities at once could not be
  // split back per entity and a second rule naming only one of them would
  // inherit the others' subtrees. The walks run in bounded groups rather than
  // all at once, because each one is itself a multi-level chain of queries and
  // a rule may name a long list.
  const resolveKey = async (key: string): Promise<void> => {
    const separator = key.indexOf(":");
    const kind = key.slice(0, separator) as EValidationExpansionKind;
    const entityId = key.slice(separator + 1);

    if (kind === EValidationExpansionKind.Equivalents) {
      map.set(key, await resolveExpansionIds(conn, entityId, "equivalents"));
      return;
    }

    const ids = await resolveExpansionIds(conn, entityId, "subordinates", {
      relationTypes:
        kind === EValidationExpansionKind.Subclasses
          ? [RelationEnums.Type.Superclass]
          : [RelationEnums.Type.SuperordinateEntity],
      // a Territory target stands for its whole subtree, which is what lets
      // the "having superordinate entity" condition reach Territories
      includeChildTerritories: kind === EValidationExpansionKind.Subordinates,
    });

    if (ids.length >= SUBORDINATE_MAX_NODES) {
      // the collected set was cut short, so entities below the cut are judged
      // against a smaller set than the rule describes and may be warned about
      console.warn(
        `[validation] subordinate expansion of ${entityId} hit the ${SUBORDINATE_MAX_NODES} id limit; entities below the cut may be reported as invalid`
      );
    }

    map.set(key, ids);
  };

  for (let i = 0; i < keys.length; i += EXPANSIONS_IN_PARALLEL) {
    await Promise.all(keys.slice(i, i + EXPANSIONS_IN_PARALLEL).map(resolveKey));
  }

  return map;
};
