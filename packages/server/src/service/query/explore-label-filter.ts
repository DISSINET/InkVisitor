import { IEntity } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Builds a case-insensitive RegExp from a label filter string.
 * Leading/trailing * remove the respective word-boundary anchor.
 */
export const labelFilterToRegExp = (label: string): RegExp => {
  let left = "^";
  let right = "$";
  let cleaned = label.trim();

  if (cleaned.startsWith("*")) {
    left = "";
    cleaned = cleaned.slice(1);
  }
  if (cleaned.endsWith("*")) {
    right = "";
    cleaned = cleaned.slice(0, -1);
  }

  if (left === "^") {
    left = "(^|[^a-zA-Z0-9])";
  }
  if (right === "$") {
    right = "($|[^a-zA-Z0-9])";
  }

  const escaped = escapeRegExp(cleaned.toLowerCase());
  return new RegExp(`${left}${escaped}${right}`, "i");
};

export const entityLabelMatchesFilter = (
  entityLabels: string[],
  filterLabel: string
): boolean => {
  const trimmed = filterLabel.trim();
  if (!trimmed) {
    return true;
  }
  if (!entityLabels.length) {
    return false;
  }

  const pattern = labelFilterToRegExp(trimmed);
  return entityLabels.some((label) => pattern.test(label));
};

export const entityMatchesRowLabelFilter = (
  entity: IEntity,
  filter: Explore.IExploreRowLabelFilter
): boolean => {
  return entityLabelMatchesFilter(entity.labels ?? [], filter.label);
};

export const getRowLabelFilter = (
  filters: Explore.IExploreColumnFilter[]
): Explore.IExploreRowLabelFilter | undefined => {
  return filters.find(
    (f): f is Explore.IExploreRowLabelFilter =>
      f.type === Explore.EExploreFilterType.RowLabel
  );
};
