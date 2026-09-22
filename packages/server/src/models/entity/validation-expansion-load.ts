import {
  SUBORDINATE_MAX_NODES,
  getEquivalentEntityIds,
  getSubordinateEntityIds,
} from "@models/relation/functions";
import { RelationEnums } from "@inkvisitor/shared/enums";
import { ITerritory } from "@inkvisitor/shared/types";
import { EValidationExpansionKind } from "@inkvisitor/shared/types/territory";
import { Connection } from "rethinkdb-ts";

import {
  ValidationExpansionMap,
  listValidationExpansionKeys,
} from "./validation-expansion";

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

  await Promise.all(
    keys.map(async (key) => {
      const separator = key.indexOf(":");
      const kind = key.slice(0, separator) as EValidationExpansionKind;
      const entityId = key.slice(separator + 1);

      if (kind === EValidationExpansionKind.Equivalents) {
        map.set(key, await getEquivalentEntityIds(conn, [entityId]));
        return;
      }

      const ids = await getSubordinateEntityIds(conn, [entityId], {
        relationTypes:
          kind === EValidationExpansionKind.Subclasses
            ? [RelationEnums.Type.Superclass]
            : [RelationEnums.Type.SuperordinateEntity],
        // a Territory target stands for its whole subtree, which is what lets
        // the "having superordinate entity" condition reach Territories
        includeChildTerritories:
          kind === EValidationExpansionKind.Subordinates,
      });

      if (ids.length >= SUBORDINATE_MAX_NODES) {
        // the collected set was cut short, so entities below the cut are judged
        // against a smaller set than the rule describes and may be warned about
        console.warn(
          `[validation] subordinate expansion of ${entityId} hit the ${SUBORDINATE_MAX_NODES} id limit; entities below the cut may be reported as invalid`
        );
      }

      map.set(key, ids);
    })
  );

  return map;
};
