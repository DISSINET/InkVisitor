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

/** "change from" option matching every current value, sent as null to the API */
export const BATCH_ATTRIBUTE_ANY = "__any__";

/** Above this count the selected entities are not fetched, so the modal cannot
 * count matches or tell which classes are in play. */
export const ATTRIBUTE_PREVIEW_FETCH_MAX = 1000;

/** the "from" value as the API takes it: null for "any current value" */
export const batchAttributeFrom = <T extends string>(
  value: T | typeof BATCH_ATTRIBUTE_ANY
): T | null => (value === BATCH_ATTRIBUTE_ANY ? null : (value as T));

/** true when an entity holding `current` is rewritten to `to` */
export const batchAttributeMatches = (
  current: string,
  from: string | null,
  to: string
): boolean => (from === null || current === from) && current !== to;

/** dropdown options for a "change from" control: every value of the attribute,
 * the empty one named as the missing value, plus "any value" */
export const batchAttributeFromOptions = <T extends string>(
  dict: { value: T; label: string }[]
): { value: T | typeof BATCH_ATTRIBUTE_ANY; label: string }[] => [
  { value: BATCH_ATTRIBUTE_ANY, label: "(any value)" },
  ...dict.map((option) =>
    option.value === ("" as T)
      ? { value: option.value, label: "(empty / missing)" }
      : { value: option.value, label: option.label }
  ),
];
