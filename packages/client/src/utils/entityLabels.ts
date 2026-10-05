export const DUPLICATE_LABEL_MESSAGE = "Entity already has this label";

/**
 * Whether `label` already appears among the entity `labels`, skipping the
 * entry at `ownIndex` (the label being edited). Labels are compared trimmed,
 * because surrounding whitespace is invisible in the Detail.
 */
export const isDuplicateLabel = (
  labels: string[],
  label: string,
  ownIndex?: number,
): boolean => {
  const trimmed = label.trim();
  return labels.some((l, index) => index !== ownIndex && l.trim() === trimmed);
};
