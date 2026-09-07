import { classesAll } from "@inkvisitor/shared/dictionaries/entity";
import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { Query, Relation } from "@inkvisitor/shared/types";

export const SUPERCLASS_ENTITY_CLASSES = [EntityEnums.Class.Action, EntityEnums.Class.Concept];

/** Superclass relations only allow Action↔Action or Concept↔Concept pairs. */
export const getSuperclassAllowedClasses = (
  rootEntityClasses: EntityEnums.Class[] | undefined,
): EntityEnums.Class[] => {
  const rootClasses = rootEntityClasses ?? [];
  // an unset root class is the wildcard, so the edge constrains on its own
  if (rootClasses.length === 0) {
    return [...SUPERCLASS_ENTITY_CLASSES];
  }
  return SUPERCLASS_ENTITY_CLASSES.filter((c) => rootClasses.includes(c));
};

/** Target classes allowed for a Superordinate Entity picker given root entity classes. */
export const getSuperordinateEntityAllowedClasses = (
  rootEntityClasses: EntityEnums.Class[] | undefined,
): EntityEnums.Class[] => {
  const pattern =
    Relation.RelationRules[RelationEnums.Type.SuperordinateEntity]?.allowedEntitiesPattern ?? [];
  const rootClasses = rootEntityClasses ?? [];
  const allowed = new Set<EntityEnums.Class>();

  // an unset root class is the wildcard: every source class of the relation is
  // still in play, so the targets of all of them are allowed
  if (rootClasses.length === 0) {
    for (const [, targetClass] of pattern) {
      allowed.add(targetClass);
    }
    return [...allowed];
  }

  for (const rootClass of rootClasses) {
    for (const [sourceClass, targetClass] of pattern) {
      if (sourceClass === rootClass) {
        allowed.add(targetClass);
      }
    }
  }

  return [...allowed];
};

export const getRelationConstrainedCategoryTypes = (
  edgeType: Query.EdgeType | undefined,
  rootEntityClasses: EntityEnums.Class[] | undefined,
): EntityEnums.Class[] | null => {
  if (edgeType === Query.EdgeType["R:SCL"] || edgeType === Query.EdgeType["I_R:SCL"]) {
    return getSuperclassAllowedClasses(rootEntityClasses);
  }
  if (edgeType === Query.EdgeType["R:SOE"] || edgeType === Query.EdgeType["I_R:SOE"]) {
    return getSuperordinateEntityAllowedClasses(rootEntityClasses);
  }
  return null;
};

export interface IRelationSuggesterConfig {
  showSuggester: boolean;
  categoryTypes: EntityEnums.Class[];
}

/** Target entity classes allowed in a relation suggester for a given source entity. */
export const getSuggesterCategoryTypes = (
  rule: Relation.RelationRule,
  sourceEntityClass: EntityEnums.Class,
  allEntityClasses: EntityEnums.Class[] = classesAll,
): EntityEnums.Class[] => {
  const { allowedEntitiesPattern, cloudType, disabledEntities } = rule;

  if (allowedEntitiesPattern.length > 0) {
    if (cloudType) {
      const sourceAllowed = allowedEntitiesPattern.some(
        (pattern) => pattern[0] === sourceEntityClass,
      );
      return sourceAllowed ? [sourceEntityClass] : [];
    }

    const targets = allowedEntitiesPattern
      .filter((pattern) => pattern[0] === sourceEntityClass)
      .map((pattern) => pattern[1]);
    return [...new Set(targets)];
  }

  if (disabledEntities?.includes(sourceEntityClass)) {
    return [];
  }

  if (disabledEntities?.length) {
    return allEntityClasses.filter((c) => !disabledEntities.includes(c));
  }

  return [...allEntityClasses];
};

export interface IRelationSuggesterConfigOptions {
  /** When true, non-cloud relations with `multiple: false` hide the suggester. */
  hasExistingRelation?: boolean;
  allEntityClasses?: EntityEnums.Class[];
}

export const getRelationSuggesterConfig = (
  relationType: RelationEnums.Type,
  sourceEntityClass: EntityEnums.Class,
  options: IRelationSuggesterConfigOptions = {},
): IRelationSuggesterConfig => {
  const { hasExistingRelation = false, allEntityClasses = classesAll } = options;
  const rule = Relation.RelationRules[relationType];
  if (!rule) {
    return { showSuggester: false, categoryTypes: [] };
  }

  const categoryTypes = getSuggesterCategoryTypes(rule, sourceEntityClass, allEntityClasses);

  const blockedBySingleRelation =
    hasExistingRelation && !rule.cloudType && !rule.multiple;

  return {
    showSuggester: categoryTypes.length > 0 && !blockedBySingleRelation,
    categoryTypes,
  };
};

export const findValidEdgeTypesForSourceNode = (
  node: Query.INode,
  filterByClass = false,
): Query.EdgeType[] => {
  const validEdges = Object.entries(Query.EdgeTypeNodeRules)
    .filter(([, [ruleFrom]]) => {
      const validType = ruleFrom.nodeType === node.type;
      const validClass =
        filterByClass &&
        node.params?.entityClasses?.length &&
        ruleFrom.params.entityClass?.length
          ? node.params.entityClasses.some((cl) => ruleFrom.params.entityClass?.includes(cl))
          : true;
      return validType && validClass;
    })
    .map(([type]) => type as Query.EdgeType);
  return validEdges;
};

export const findValidEdgeTypesForTargetNode = (node: Query.INode): Query.EdgeType[] => {
  const validEdges = Object.entries(Query.EdgeTypeNodeRules)
    .filter(([, [from, to]]) => {
      // TODO
      return (
        node.type === to.nodeType && to.params.entityClass?.includes(node.params.entityClasses![0])
      );
    })
    .map(([type]) => type as Query.EdgeType);
  return validEdges;
};

export const isEdgeValid = (sourceNode: Query.INode, edge: Query.IEdge): Query.EdgeValidity => {
  const targetNode = edge.node;
  const edgeRule = Query.EdgeTypeNodeRules[edge.type];
  const [ruleFrom, ruleTo] = edgeRule;

  const sourceValid = isNodeValid(sourceNode, ruleFrom);
  const targetValid = isNodeValid(targetNode, ruleTo);
  const edgeValid = sourceValid && targetValid;

  const problems: Query.EdgeProblemSource[] = [];
  if (!sourceValid) {
    problems.push(Query.EdgeProblemSource.Source);
  }
  if (!targetValid) {
    problems.push(Query.EdgeProblemSource.Target);
  }

  return {
    valid: edgeValid,
    problems,
  };
};

export const isNodeValid = (node: Query.INode, rule: Query.EdgeRule): boolean => {
  if (node.type !== rule.nodeType) {
    return false;
  }
  if (rule.params.entityClass === undefined || rule.params.entityClass.length === 0) {
    return true;
  }
  // a concrete picked entity already fixes the node's class - the entity picker
  // enforced the allowed classes at selection time, and picking clears
  // entityClasses to [] (see updateNodeEntityId), so fall back to trusting it
  if (node.params.entityId !== undefined) {
    return true;
  }
  if (node.params.entityClasses === undefined || node.params.entityClasses.length === 0) {
    return false;
  }

  return node.params.entityClasses.every((nodeClass) => {
    return rule.params.entityClass?.includes(nodeClass) || false;
  });
};

// Lightweight helpers for windowed caching and signature-based IDs.
// These utilities are used by both React Query write-through and the Explorer read path.
// They are intentionally framework-agnostic and can be used with TanStack DB collections.
export interface WindowSlice {
  id: string;
  signature: string;
  offset: number;
  limit: number;
  total: number;
  ids: string[];
}

export const buildWindowId = (signature: string, offset: number, limit: number): string => {
  return `${signature}:${offset}:${limit}`;
};

export const clampWindow = (
  total: number,
  offset: number,
  limit: number,
): { offset: number; limit: number } => {
  const safeOffset = Math.max(0, Math.min(offset, Math.max(0, total - 1)));
  const safeLimit = Math.max(1, Math.min(limit, Math.max(1, total - safeOffset)));
  return { offset: safeOffset, limit: safeLimit };
};

export interface WindowUpdateInput {
  /** First row index currently rendered by the virtual list. */
  visibleStart: number;
  total: number;
  /** Offset/limit currently in the explore state (the last requested window). */
  currentOffset: number;
  currentLimit: number;
  viewportHeight: number;
  rowHeight: number;
  overscan: number;
  /** Row granularity of the fetch window (see WINDOW_CHUNK_ROWS). */
  chunkSize?: number;
}

/**
 * Row granularity of the paginated fetch window. Both the offset and the size of
 * the requested window are snapped to this grid, so scrolling only triggers a
 * refetch once per `WINDOW_CHUNK_ROWS` rows instead of continuously.
 */
export const WINDOW_CHUNK_ROWS = 25;

export interface WindowUpdate {
  shouldUpdate: boolean;
  offset: number;
  limit: number;
}

// Decides whether the windowed query needs to refetch a new (offset, limit) slice
// for the rows currently in view (plus overscan).
//
// The requested window is snapped to a `chunkSize` grid and sized one whole chunk
// larger than the visible range needs. Scrolling therefore leaves the requested
// window unchanged until the viewport crosses a chunk boundary, which is what
// keeps pagination from firing on every single row. The previous version derived
// the window straight from the visible range, so any scroll moved `targetEnd`
// past the loaded end and refetched continuously.
export const computeWindowUpdate = (input: WindowUpdateInput): WindowUpdate => {
  const {
    visibleStart,
    total,
    currentOffset,
    currentLimit,
    viewportHeight,
    rowHeight,
    overscan,
  } = input;
  const chunkSize = Math.max(1, input.chunkSize ?? WINDOW_CHUNK_ROWS);

  if (total <= 0) {
    return { shouldUpdate: false, offset: currentOffset, limit: currentLimit };
  }

  // Rows the viewport plus overscan can show at once, rounded up to whole chunks
  // and padded by one more chunk so there is slack on both sides of the viewport.
  const approxVisible = Math.ceil(viewportHeight / rowHeight);
  const needed = approxVisible + 2 * overscan;
  const pageSize = Math.min(total, (Math.ceil(needed / chunkSize) + 1) * chunkSize);

  // Snap the start down to the chunk grid, then pull it back from the tail so the
  // last page is full rather than truncated.
  const gridStart = Math.max(0, Math.floor((visibleStart - overscan) / chunkSize) * chunkSize);
  const targetOffset = Math.min(gridStart, Math.max(0, total - pageSize));
  const targetLimit = Math.min(pageSize, total - targetOffset);

  // Only the grid-aligned window matters: within a chunk the visible range still
  // moves but the request does not change, so nothing is dispatched.
  const shouldUpdate = targetOffset !== currentOffset || targetLimit !== currentLimit;

  return { shouldUpdate, offset: targetOffset, limit: targetLimit };
};

// Builds a deterministic signature for the current query + explore configuration
// that affects identity and ordering of results. Explicitly excludes the window
// controls (offset, limit) so different windows share the same stable signature.
//
// Note: This is deliberately conservative and simple. If sort/filters/columns semantics
// evolve, revisit this to ensure the signature captures the ordering identity.

type Jsonish = Record<string, unknown> | unknown[] | string | number | boolean | null | undefined;

/**
 * Page-level settings that affect the query result but live outside
 * queryState/exploreState (e.g. the global expansion toggles). They must be part
 * of both signatures, otherwise toggling them would neither mark the search as
 * pending nor change the react-query cache key.
 */
export interface SignatureGlobalParams {
  includeEquivalents: boolean;
  includeSubordinates: boolean;
}

export const buildStableSignature = (
  queryState: Jsonish,
  exploreState: Jsonish,
  globalParams: SignatureGlobalParams,
): string => {
  const normalizedExplore = normalizeExplore(exploreState);
  // Deterministic stringify by sorting object keys
  const stableString = stableStringify({
    query: queryState,
    explore: normalizedExplore,
    global: globalParams,
  });
  return hashString(stableString);
};

/**
 * Sorts the columns by id so that column ORDER stays out of the signature.
 *
 * Order is presentational only: the server returns columnData as a Record keyed
 * by column id and the table renders it by mapping over the columns in state.
 * Order must also stay out because a header drag dispatches a move on every
 * hover event, and each cache key change evicts the row cache and refetches.
 *
 * Adding, removing or editing a column still changes the signature — the set of
 * ids, or their contents, differ.
 */
const normalizeExploreColumns = (view: unknown): unknown => {
  if (!view || typeof view !== "object" || Array.isArray(view)) {
    return view;
  }
  const v = view as Record<string, unknown>;
  if (!Array.isArray(v.columns)) {
    return view;
  }
  const sortedColumns = [...(v.columns as Array<Record<string, unknown>>)].sort((a, b) =>
    String(a?.id ?? "").localeCompare(String(b?.id ?? "")),
  );
  return { ...v, columns: sortedColumns };
};

const normalizeExplore = (exploreState: Jsonish): Jsonish => {
  if (!exploreState || typeof exploreState !== "object" || Array.isArray(exploreState)) {
    return exploreState;
  }
  const e = exploreState as Record<string, unknown>;
  const { offset: _omitOffset, limit: _omitLimit, ...rest } = e;
  return "view" in rest ? { ...rest, view: normalizeExploreColumns(rest.view) } : rest;
};

const normalizeExploreForSearch = (exploreState: Jsonish): Jsonish => {
  if (!exploreState || typeof exploreState !== "object" || Array.isArray(exploreState)) {
    return exploreState;
  }
  const e = exploreState as Record<string, unknown>;
  const { offset: _o, limit: _l, view: _v, ...rest } = e;
  return rest;
};

export const buildSearchSignature = (
  queryState: Jsonish,
  exploreState: Jsonish,
  globalParams: SignatureGlobalParams,
): string => {
  const normalizedExplore = normalizeExploreForSearch(exploreState);
  const stableString = stableStringify({
    query: queryState,
    explore: normalizedExplore,
    global: globalParams,
  });
  return hashString(stableString);
};

const stableStringify = (value: Jsonish): string => {
  return JSON.stringify(value, replacer, 0);
};

const replacer = (_key: string, value: unknown): unknown => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  const obj = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  Object.keys(obj)
    .sort()
    .forEach((k) => {
      sorted[k] = obj[k];
    });
  return sorted;
};

const hashString = (s: string): string => {
  // Simple, fast, stable 32-bit hash converted to base36 for compactness.
  // Not cryptographic; just to keep query keys short.
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Convert to unsigned and base36
  return (h >>> 0).toString(36);
};

/**
 * Parses space-, tab-, line-break-, or comma-separated entity UUIDs from pasted text.
 * Invalid tokens are ignored; duplicates are removed (first occurrence order preserved).
 */
const ENTITY_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Entity uuid trimmed for display: first 8 and last 5 characters. Ids shorter
 * than the elision itself are returned unchanged.
 */
export const shortenUuid = (id: string): string =>
  id.length > 13 ? `${id.slice(0, 8)}\u2026${id.slice(-5)}` : id;

export const parseEntityIdsFromText = (text: string): string[] => {
  const seen = new Set<string>();
  const ids: string[] = [];

  for (const token of text.split(/[\s,\t\n\r]+/)) {
    const trimmed = token.trim();
    if (!trimmed || !ENTITY_ID_RE.test(trimmed)) {
      continue;
    }
    const normalized = trimmed.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    ids.push(trimmed);
  }

  return ids;
};

export const entityIdsEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  const setB = new Set(b.map((id) => id.toLowerCase()));
  return a.every((id) => setB.has(id.toLowerCase()));
};

/**
 * Merges valid UUIDs parsed from `rawText` into `existingIds`, appending any not
 * already present (case-insensitive) in their parsed order. Existing order is
 * preserved; invalid tokens and duplicates are dropped. Returns the same array
 * reference when nothing new is added.
 */
export const mergeTokensIntoIds = (existingIds: string[], rawText: string): string[] => {
  const present = new Set(existingIds.map((id) => id.toLowerCase()));
  const toAdd = parseEntityIdsFromText(rawText).filter((id) => !present.has(id.toLowerCase()));
  return toAdd.length > 0 ? [...existingIds, ...toAdd] : existingIds;
};

/**
 * Returns the text left over after removing every valid-UUID token, space-joined.
 * Used to keep a half-typed / non-UUID draft in the input instead of clearing it
 * once the complete UUIDs have been extracted into chips.
 */
export const unparsedRemainder = (text: string): string =>
  text
    .split(/[\s,\t\n\r]+/)
    .map((token) => token.trim())
    .filter((token) => token !== "" && !ENTITY_ID_RE.test(token))
    .join(" ");

/**
 * Applies a paste to `draft` the way a normal text input would: the text between
 * `selectionStart` and `selectionEnd` is replaced by `pasted` (so select-all then
 * paste replaces everything, and an empty selection inserts at the cursor).
 */
export const applyPasteToDraft = (
  draft: string,
  selectionStart: number,
  selectionEnd: number,
  pasted: string,
): string => draft.slice(0, selectionStart) + pasted + draft.slice(selectionEnd);

// UUID slot template: x = hex, V = version [1-5], R = variant [89ab], - = literal.
const UUID_TEMPLATE = "xxxxxxxx-xxxx-Vxxx-Rxxx-xxxxxxxxxxxx";

/**
 * True when `text` could still become a valid entity UUID by typing more chars
 * (i.e. it matches the UUID template up to its length). Empty text is viable;
 * anything that breaks the pattern (bad char, wrong version/variant, too long,
 * or contains spaces) is not. Used to flag clearly-invalid draft input.
 */
export const isViableUuidPrefix = (text: string): boolean => {
  if (text.length > UUID_TEMPLATE.length) {
    return false;
  }
  for (let i = 0; i < text.length; i++) {
    const slot = UUID_TEMPLATE[i];
    const ch = text[i];
    const ok =
      slot === "-"
        ? ch === "-"
        : slot === "V"
          ? /[1-5]/.test(ch)
          : slot === "R"
            ? /[89ab]/i.test(ch)
            : /[0-9a-f]/i.test(ch);
    if (!ok) {
      return false;
    }
  }
  return true;
};
