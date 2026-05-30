import Entity from "@models/entity/entity";
import { SearchQuery } from "@models/entity/response-search";
import { IEntity } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import { Connection, RDatum, r as rethink } from "rethinkdb-ts";

const EXPLORE_LABEL_FILTER_CHUNK_SIZE = 4000;

const chunkArray = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
    (f): f is Explore.IExploreRowLabelFilter => f.type === Explore.EExploreFilterType.RowLabel
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
  db: Connection,
  ids: string[],
  label: string
): Promise<Set<string>> => {
  const [preparedLabel, leftFromPrepare, rightFromPrepare] = SearchQuery.prepareLabel(label);
  const [leftWildcard, rightWildcard] = exploreLabelWildcards(
    label,
    leftFromPrepare,
    rightFromPrepare
  );
  const matching = new Set<string>();

  await Promise.all(
    chunkArray(ids, EXPLORE_LABEL_FILTER_CHUNK_SIZE).map(async (chunk) => {
      const matched = (await rethink
        .table(Entity.table)
        .getAll(rethink.args(chunk))
        .filter(function (row: RDatum) {
          return SearchQuery.searchWordByWord(row, preparedLabel, leftWildcard, rightWildcard);
        })("id")
        .run(db)) as string[];

      matched.forEach((id) => matching.add(id));
    })
  );

  return matching;
};

const findMatchingIdsWithRegex = async (
  db: Connection,
  ids: string[],
  filter: Explore.IExploreRowLabelFilter
): Promise<Set<string>> => {
  const matching = new Set<string>();

  await Promise.all(
    chunkArray(ids, EXPLORE_LABEL_FILTER_CHUNK_SIZE).map(async (chunk) => {
      const rows = (await rethink
        .table(Entity.table)
        .getAll(rethink.args(chunk))
        .pluck("id", "labels")
        .run(db)) as { id: string; labels?: string[] }[];

      for (const row of rows) {
        if (entityLabelMatchesFilter(row.labels ?? [], filter)) {
          matching.add(row.id);
        }
      }
    })
  );

  return matching;
};

/**
 * Filters entity ids by row label filter while preserving input order.
 * Uses RethinkDB for wildcard search; regex mode loads only id + labels per chunk.
 */
export const filterEntityIdsByRowLabelFilter = async (
  db: Connection,
  ids: string[],
  filter: Explore.IExploreRowLabelFilter
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
