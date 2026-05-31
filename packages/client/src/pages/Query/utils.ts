import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { Query, Relation } from "@inkvisitor/shared/types";

export const SUPERCLASS_ENTITY_CLASSES = [
  EntityEnums.Class.Action,
  EntityEnums.Class.Concept,
];

/** Superclass relations only allow Action↔Action or Concept↔Concept pairs. */
export const getSuperclassAllowedClasses = (
  rootEntityClasses: EntityEnums.Class[] | undefined
): EntityEnums.Class[] => {
  const rootClasses = rootEntityClasses ?? [];
  return SUPERCLASS_ENTITY_CLASSES.filter((c) => rootClasses.includes(c));
};

/** Target classes allowed for a Superordinate Entity picker given root entity classes. */
export const getSuperordinateEntityAllowedClasses = (
  rootEntityClasses: EntityEnums.Class[] | undefined
): EntityEnums.Class[] => {
  const pattern =
    Relation.RelationRules[RelationEnums.Type.SuperordinateEntity]
      ?.allowedEntitiesPattern ?? [];
  const rootClasses = rootEntityClasses ?? [];
  const allowed = new Set<EntityEnums.Class>();

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
  rootEntityClasses: EntityEnums.Class[] | undefined
): EntityEnums.Class[] | null => {
  if (edgeType === Query.EdgeType["R:SCL"] || edgeType === Query.EdgeType["I_R:SCL"]) {
    return getSuperclassAllowedClasses(rootEntityClasses);
  }
  if (edgeType === Query.EdgeType["R:SOE"] || edgeType === Query.EdgeType["I_R:SOE"]) {
    return getSuperordinateEntityAllowedClasses(rootEntityClasses);
  }
  return null;
};

export const findValidEdgeTypesForSourceNode = (node: Query.INode): Query.EdgeType[] => {
  const validEdges = Object.entries(Query.EdgeTypeNodeRules)
    .filter(([, [ruleFrom, ruleTo]]) => {
      const validType = ruleFrom.nodeType === node.type;
      const validClass =
        node.params?.entityClasses?.length && ruleFrom.params.entityClass?.length
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

// Builds a deterministic signature for the current query + explore configuration
// that affects identity and ordering of results. Explicitly excludes the window
// controls (offset, limit) so different windows share the same stable signature.
//
// Note: This is deliberately conservative and simple. If sort/filters/columns semantics
// evolve, revisit this to ensure the signature captures the ordering identity.

type Jsonish = Record<string, unknown> | unknown[] | string | number | boolean | null | undefined;

export const buildStableSignature = (queryState: Jsonish, exploreState: Jsonish): string => {
  const normalizedExplore = normalizeExplore(exploreState);
  // Deterministic stringify by sorting object keys
  const stableString = stableStringify({
    query: queryState,
    explore: normalizedExplore,
  });
  return hashString(stableString);
};

const normalizeExplore = (exploreState: Jsonish): Jsonish => {
  if (!exploreState || typeof exploreState !== "object" || Array.isArray(exploreState)) {
    return exploreState;
  }
  const e = exploreState as Record<string, unknown>;
  const { offset: _omitOffset, limit: _omitLimit, ...rest } = e;
  return rest;
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
