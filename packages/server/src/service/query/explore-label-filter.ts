import { IEntity } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import { Conn, storage } from "@service/storage";
import { prepareLabel } from "@common/searchLabel";

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Same diacritic folding as searchWordByWord in the storage adapter (service/storage/rethink/search.ts) */
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
  filter: Pick<Explore.IExploreLabelFilter, "label" | "useRegex">
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
  filter: Explore.IExploreLabelFilter
): boolean => {
  return entityLabelMatchesFilter(entity.labels ?? [], filter);
};

export const getRowLabelFilter = (
  filters: Explore.IExploreSearchFilter[]
): Explore.IExploreLabelFilter | undefined => {
  return filters.find(
    (f): f is Explore.IExploreLabelFilter => f.type === Explore.SearchOption.Label
  );
};

const exploreLabelWildcards = (label: string, left: string, right: string): [string, string] => {
  // prepareLabel defaults to ^/$ (whole-word). Explorer row filter uses substring
  // matching (same as labelFilterToRegExp) unless the user typed explicit * wildcards.
  const trimmed = label.trim();
  const useLeadingWildcard = trimmed.startsWith("*");
  const useTrailingWildcard = trimmed.endsWith("*");

  return [
    useLeadingWildcard ? left : left === "^" ? "" : left,
    useTrailingWildcard ? right : right === "$" ? "" : right,
  ];
};

const findMatchingIdsWithDbSearch = async (
  db: Conn,
  ids: string[],
  label: string
): Promise<Set<string>> => {
  const [preparedLabel, leftFromPrepare, rightFromPrepare] = prepareLabel(label);
  const [leftWildcard, rightWildcard] = exploreLabelWildcards(
    label,
    leftFromPrepare,
    rightFromPrepare
  );

  return new Set(
    await storage.entities.idsMatchingLabel(db, ids, preparedLabel, leftWildcard, rightWildcard)
  );
};

const findMatchingIdsWithRegex = async (
  db: Conn,
  ids: string[],
  filter: Explore.IExploreLabelFilter
): Promise<Set<string>> => {
  const matching = new Set<string>();

  for (const row of await storage.entities.labelsOf(db, ids)) {
    if (entityLabelMatchesFilter(row.labels ?? [], filter)) {
      matching.add(row.id);
    }
  }

  return matching;
};

export const filterEntityIdsByRowLabelFilter = async (
  db: Conn,
  ids: string[],
  filter: Explore.IExploreLabelFilter
): Promise<string[]> => {
  const trimmed = filter.label?.trim();
  if (!trimmed || !ids.length) {
    return ids;
  }

  const validIds = ids.filter(Boolean);
  if (!validIds.length) {
    return [];
  }

  const matchingIds = filter.useRegex
    ? await findMatchingIdsWithRegex(db, validIds, filter)
    : await findMatchingIdsWithDbSearch(db, validIds, trimmed);

  if (!matchingIds.size) {
    return [];
  }

  return ids.filter((id) => id && matchingIds.has(id));
};
