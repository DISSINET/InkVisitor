import { EntityEnums, RelationEnums } from "@shared/enums";
import { Relation } from "@shared/types";

export const getRelationLabel = (type: RelationEnums.Type): string => {
  return Relation.RelationRules[type]?.label || type;
};

export const isRelationTypeEligible = (
  type: RelationEnums.Type,
  entityClasses: Set<EntityEnums.Class>
): boolean => {
  const rule = Relation.RelationRules[type];
  if (!rule) return true;

  if (rule.allowedEntitiesPattern.length === 0) {
    return rule.disabledEntities
      ? [...entityClasses].some((c) => !rule.disabledEntities!.includes(c))
      : true;
  }

  const allowedFirstClasses = new Set(
    rule.allowedEntitiesPattern.map((p) => p[0])
  );
  return [...entityClasses].some((c) => allowedFirstClasses.has(c));
};
