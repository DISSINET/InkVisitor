import { IEntity } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Same diacritic folding as SearchQuery.searchWordByWord in response-search.ts */
const DIACRITIC_CHAR_MAP: Record<string, string> = {
  a: "[aàáâãäå]",
  e: "[eèéêëě]",
  i: "[iìíîï]",
  o: "[oòóôõö]",
  u: "[uùúûüů]",
  y: "[yýÿ]",
  n: "[nñň]",
  c: "[cç]",
  r: "[rř]",
  d: "[dď]",
  t: "[tť]",
  s: "[sš]",
  z: "[zž]",
};

const toDiacriticPattern = (text: string): string =>
  text
    .toLowerCase()
    .split("")
    .map((char) => DIACRITIC_CHAR_MAP[char] ?? escapeRegExp(char))
    .join("");

/**
 * Parses user input as a JavaScript RegExp.
 * Supports `/pattern/flags` or a raw pattern (default flag: i).
 */
export const parseUserRegex = (input: string): RegExp | null => {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const literalMatch = trimmed.match(/^\/(.+)\/([gimsuy]*)$/);
  const patternSource = literalMatch ? literalMatch[1] : trimmed;
  const flags = literalMatch ? literalMatch[2] : "i";

  try {
    const regex = new RegExp(patternSource, flags);
    regex.test("");
    return regex;
  } catch {
    return null;
  }
};

/**
 * Builds a case-insensitive RegExp aligned with entity label search (searchWordByWord).
 */
export const labelFilterToRegExp = (label: string): RegExp => {
  let left = "^";
  let right = "$";
  let cleaned = label.trim();

  if (cleaned.startsWith("*")) {
    left = "";
    cleaned = cleaned.slice(1).trimStart();
  } else {
    left = "";
  }
  if (cleaned.endsWith("*")) {
    right = "";
    cleaned = cleaned.slice(0, -1).trimEnd();
  } else {
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
  filter: Pick<Explore.IExploreRowLabelFilter, "label" | "useRegex">
): boolean => {
  const trimmed = filter.label.trim();
  if (!trimmed) {
    return true;
  }
  if (!entityLabels.length) {
    return false;
  }

  if (filter.useRegex) {
    const pattern = parseUserRegex(trimmed);
    if (!pattern) {
      return false;
    }
    return entityLabels.some((label) => pattern.test(label));
  }

  const pattern = labelFilterToRegExp(trimmed);
  return entityLabels.some((label) => pattern.test(label));
};

export const entityMatchesRowLabelFilter = (
  entity: IEntity,
  filter: Explore.IExploreRowLabelFilter
): boolean => {
  return entityLabelMatchesFilter(entity.labels ?? [], filter);
};

export const getRowLabelFilter = (
  filters: Explore.IExploreColumnFilter[]
): Explore.IExploreRowLabelFilter | undefined => {
  return filters.find(
    (f): f is Explore.IExploreRowLabelFilter =>
      f.type === Explore.EExploreFilterType.RowLabel
  );
};
