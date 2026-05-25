import { IEntity } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Same diacritic folding as SearchQuery.searchWordByWord in response-search.ts */
const DIACRITIC_CHAR_MAP: Record<string, string> = {
  a: "[aàáâãäå]",
  e: "[eèéêë]",
  i: "[iìíîï]",
  o: "[oòóôõö]",
  u: "[uùúûü]",
  y: "[yýÿ]",
  n: "[nñ]",
  c: "[cç]",
};

const toDiacriticPattern = (text: string): string =>
  text
    .toLowerCase()
    .split("")
    .map((char) => DIACRITIC_CHAR_MAP[char] ?? escapeRegExp(char))
    .join("");

/**
 * Builds a case-insensitive RegExp aligned with entity label search (searchWordByWord).
 * - Splits the filter on spaces so multi-word names work.
 * - Implicit trailing wildcard when none is given (prefix match on the last word).
 * - Leading/trailing * in the filter remove the respective boundary.
 */
export const labelFilterToRegExp = (label: string): RegExp => {
  let left = "^";
  let right = "$";
  let cleaned = label.trim();

  if (cleaned.startsWith("*")) {
    left = "";
    cleaned = cleaned.slice(1).trimStart();
  }
  if (cleaned.endsWith("*")) {
    right = "";
    cleaned = cleaned.slice(0, -1).trimEnd();
  } else {
    // Same behaviour as entity search labelOrId + "*"
    right = "";
  }

  if (left === "^") {
    left = "(^|[^a-zA-Z0-9])";
  }
  if (right === "$") {
    right = "($|[^a-zA-Z0-9])";
  }

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (!words.length) {
    return /^/i;
  }

  const regexBody = words
    .map((word) => toDiacriticPattern(word))
    .join("([^a-zA-Z0-9]+[\\w]+)*[^a-zA-Z0-9]+");

  return new RegExp(`${left}${regexBody}${right}`, "i");
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
