import { Explore } from "@inkvisitor/shared/types/query";
import { Conn, storage } from "@service/storage";
import { prepareLabel } from "@common/searchLabel";

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

export const entityLabelMatchesRegex = (entityLabels: string[], input: string): boolean => {
  const pattern = parseUserRegex(input);
  return !!pattern && entityLabels.some((label) => pattern.test(label));
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
  // matching unless the user typed explicit * wildcards.
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

  // regex mode goes through findMatchingIdsWithRegex, so the text here is literal
  return new Set(
    await storage.entities.idsMatchingLabel(
      db,
      ids,
      escapeRegExp(preparedLabel),
      leftWildcard,
      rightWildcard
    )
  );
};

const findMatchingIdsWithRegex = async (
  db: Conn,
  ids: string[],
  filter: Explore.IExploreLabelFilter
): Promise<Set<string>> => {
  const matching = new Set<string>();

  for (const row of await storage.entities.labelsOf(db, ids)) {
    if (entityLabelMatchesRegex(row.labels ?? [], filter.label)) {
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
