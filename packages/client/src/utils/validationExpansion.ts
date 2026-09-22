import {
  EValidationExpansionField,
  EValidationExpansionKind,
  ITerritoryValidation,
  ITerritoryValidationExpansion,
  validationExpansionKind,
} from "@inkvisitor/shared/types/territory";

/**
 * What the downward box is called on a given rule field. The word follows the
 * relation the field stands for, so the label, the rule's sentence and the
 * warning text all name the same thing.
 */
export const expansionKindLabel = (
  kind: EValidationExpansionKind | null
): string =>
  kind === EValidationExpansionKind.Subordinates ? "subordinates" : "subclasses";

export const expansionKindTooltip = (
  kind: EValidationExpansionKind | null
): string =>
  kind === EValidationExpansionKind.Subordinates
    ? "Also accept anything below on the superordinate-entity path, all levels - and for a Territory, its child Territories."
    : "Also accept anything below on the superclass path, all levels.";

export const EQUIVALENTS_TOOLTIP =
  "Also accept entities recorded as equivalent: the synonym cloud, identifications and action-event equivalents.";

/**
 * Trailing note stating what a rule field accepts beyond the entities named in
 * it, e.g. " (incl. subclasses)". Empty when the field takes only what it names,
 * so a rule reads exactly as it did before anyone touched the boxes.
 */
export const expansionNote = (
  expansion: ITerritoryValidationExpansion | undefined,
  kind: EValidationExpansionKind | null
): string => {
  const parts: string[] = [];

  if (expansion?.equivalents) {
    parts.push("equivalents");
  }
  if (expansion?.subordinates && kind) {
    parts.push(expansionKindLabel(kind));
  }

  return parts.length ? ` (incl. ${parts.join(" and ")})` : "";
};

/**
 * The same note taken straight from a rule, for a field that carries a list of
 * entities. Empty while that list is empty, so nothing is ever appended to a
 * condition nobody set.
 */
export const validationFieldNote = (
  validation: ITerritoryValidation | undefined,
  field: EValidationExpansionField
): string => {
  if (!validation || !validation[field]?.length) {
    return "";
  }

  return expansionNote(
    validation.expansions?.[field],
    validationExpansionKind(field, validation.tieType)
  );
};
