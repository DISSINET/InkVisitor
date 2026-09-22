import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, ITerritory } from "@inkvisitor/shared/types";
import {
  EValidationExpansionField,
  EValidationExpansionKind,
  ITerritoryValidation,
  ITerritoryValidationExpansion,
  validationExpansionKind,
} from "@inkvisitor/shared/types/territory";

/**
 * Precomputed expansion ids, keyed by kind + source entity id. The values are
 * the ADDED ids only; the source id is never among them. A missing key means
 * "nothing was collected for it", which is why every lookup falls back to the
 * source id alone and a rule without expansion flags never touches this map.
 */
export type ValidationExpansionMap = Map<string, string[]>;

export const expansionKey = (
  kind: EValidationExpansionKind,
  entityId: string
): string => `${kind}:${entityId}`;

const EXPANDABLE_FIELDS: EValidationExpansionField[] = [
  "entityClassifications",
  "entitySOEs",
  "propType",
  "allowedEntities",
];

/**
 * Every (kind, entity id) pair an active rule set needs resolved, deduplicated.
 * Returned as map keys so the loader can fetch each pair exactly once per
 * request however many rules or entities reference it.
 * @param territories territories whose validations are about to be evaluated
 */
export const listValidationExpansionKeys = (
  territories: ITerritory[]
): string[] => {
  const keys = new Set<string>();

  for (const territory of territories) {
    for (const validation of territory.data.validations ?? []) {
      if (validation.active === false || !validation.expansions) {
        continue;
      }

      for (const field of EXPANDABLE_FIELDS) {
        const expansion = validation.expansions[field];
        if (!expansion?.equivalents && !expansion?.subordinates) {
          continue;
        }

        const subordinateKind = validationExpansionKind(
          field,
          validation.tieType
        );

        for (const entityId of validation[field] ?? []) {
          if (expansion.equivalents) {
            keys.add(
              expansionKey(EValidationExpansionKind.Equivalents, entityId)
            );
          }
          if (expansion.subordinates && subordinateKind) {
            keys.add(expansionKey(subordinateKind, entityId));
          }
        }
      }
    }
  }

  return [...keys];
};

/**
 * The ids a rule field accepts: the ids picked in the rule, plus whatever the
 * field's checked expansions add. Widening only - the picked ids always remain,
 * and an empty field stays empty, so a caller can still tell "no condition set"
 * from "condition set" by the length of the result.
 * @param ids ids picked in the rule for this field
 * @param expansion the field's checkboxes, undefined when neither is checked
 * @param subordinateKind the downward path this field follows, null for a field
 * that takes no expansion
 * @param map precomputed expansion ids for the whole request
 */
export const expandValidationIds = (
  ids: string[],
  expansion: ITerritoryValidationExpansion | undefined,
  subordinateKind: EValidationExpansionKind | null,
  map: ValidationExpansionMap
): string[] => {
  if (!ids.length || (!expansion?.equivalents && !expansion?.subordinates)) {
    return ids;
  }

  const out = new Set<string>(ids);

  for (const entityId of ids) {
    if (expansion.equivalents) {
      map
        .get(expansionKey(EValidationExpansionKind.Equivalents, entityId))
        ?.forEach((id) => out.add(id));
    }
    if (expansion.subordinates && subordinateKind) {
      map
        .get(expansionKey(subordinateKind, entityId))
        ?.forEach((id) => out.add(id));
    }
  }

  return [...out];
};

/**
 * Ids that count as the entity's superordinate entities while validating. A
 * Territory carries its parent in data.parent rather than in an SOE relation -
 * the relation admits no Territory on either side - so the parent is added here
 * to let the "having superordinate entity" condition reach Territories (#2527).
 * @param entity the entity being validated
 * @param relationIds far-side ids of its SuperordinateEntity relations
 */
export const soeIdsForValidation = (
  entity: IEntity,
  relationIds: string[]
): string[] => {
  if (entity.class !== EntityEnums.Class.Territory) {
    return relationIds;
  }

  const parent = (entity as ITerritory).data?.parent;
  if (!parent) {
    return relationIds;
  }

  return [...relationIds, parent.territoryId];
};
