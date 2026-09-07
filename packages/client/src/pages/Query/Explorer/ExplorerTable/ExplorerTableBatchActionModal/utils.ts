import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { Relation } from "@inkvisitor/shared/types";

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

/** Above this count the selected entities are not fetched, so the modal cannot
 * count matches or tell which classes are in play. */
export const ATTRIBUTE_PREVIEW_FETCH_MAX = 1000;

/** true when an entity holding `current` is rewritten to `to`; a null `from`
 * matches every current value */
export const batchAttributeMatches = (
  current: string,
  from: string | null,
  to: string
): boolean => (from === null || current === from) && current !== to;

/** dropdown options for a "change from" control: every value of the attribute,
 * the empty one named as the missing value */
export const batchAttributeFromOptions = <T extends string>(
  dict: { value: T; label: string }[]
): { value: T; label: string }[] =>
  dict.map((option) =>
    option.value === ("" as T)
      ? { value: option.value, label: "(empty / missing)" }
      : { value: option.value, label: option.label }
  );
