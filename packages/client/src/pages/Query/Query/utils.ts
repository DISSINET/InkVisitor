import { Query } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import { classesAll, entitiesDictKeys } from "@inkvisitor/shared/dictionaries/entity";

export const getAllEdges = (node: Query.INode): Query.IEdge[] => {
  const edges: Query.IEdge[] = [];
  const traverse = (node: Query.INode) => {
    node.edges.forEach((edge) => {
      edges.push(edge);
      traverse(edge.node);
    });
  };
  traverse(node);
  return edges;
};

export const getAllNodes = (node: Query.INode): Query.INode[] => {
  const nodes: Query.INode[] = [];
  const traverse = (node: Query.INode) => {
    nodes.push(node);
    node.edges.forEach((edge) => {
      traverse(edge.node);
    });
  };
  traverse(node);
  return nodes;
};

/** The node the edge hangs off, which is the source side of the edge. */
export const getEdgeSourceNode = (root: Query.INode, edgeId: string): Query.INode | undefined =>
  getAllNodes(root).find((node) => node.edges.some((edge) => edge.id === edgeId));

/**
 * A stats view with every event type switched off aggregates nothing, so the
 * request can only come back empty - there is no point sending it.
 */
export const isStatsRequestEmpty = (explore: Explore.IExplore): boolean =>
  explore.view.mode === Explore.EViewMode.Stats &&
  explore.view.stats.eventType.length === 0;

/**
 * Whether anything narrows the entities a node stands for: a pinned entity, a
 * subset of the classes (an empty or full class set means "any class"), a node
 * filter, or its edges - any of them under And, each of them under any other
 * operator, which the server evaluates as Or. An SE edge says the entity is
 * its target node, so a positive one narrows only when that node is narrowed.
 */
const isNodeNarrowed = (node: Query.INode): boolean => {
  const entityClasses = node.params.entityClasses ?? [];
  if (node.params.entityId || countNodeFilters(node.params) > 0) {
    return true;
  }
  if (entityClasses.length > 0 && entityClasses.length < classesAll.length) {
    return true;
  }
  const narrows = (edge: Query.IEdge) =>
    edge.type !== Query.EdgeType.SE ||
    edge.logic === Query.EdgeLogic.Negative ||
    isNodeNarrowed(edge.node);
  return node.operator === Query.NodeOperator.And
    ? node.edges.some(narrows)
    : node.edges.length > 0 && node.edges.every(narrows);
};

/**
 * A query request is "empty" when nothing constrains the search: no explore
 * filters and a root node nothing narrows. Such a request would scan the whole
 * database, so the explorer skips it instead of firing it automatically (e.g.
 * on page load with the default root node).
 */
export const isQueryRequestEmpty = (query: Query.INode, explore: Explore.IExplore): boolean =>
  explore.filters.length === 0 && !isNodeNarrowed(query);

/** the params the node filters panel sets, cleared together and dropped when an entity is pinned */
export const NODE_FILTER_KEYS = [
  "entityStatuses",
  "entityLanguages",
  "label",
  "createdAfter",
  "createdBefore",
  "updatedAfter",
  "updatedBefore",
  "createdBy",
  "updatedBy",
  "editedBy",
  "coOccurrence",
] as const satisfies readonly (keyof Query.INodeParams)[];

/** how many node filters a node applies; a date range counts once, whichever ends are set */
export const countNodeFilters = (params: Query.INodeParams): number =>
  [
    params.entityStatuses?.length,
    params.entityLanguages?.length,
    params.label?.trim(),
    params.createdAfter || params.createdBefore,
    params.updatedAfter || params.updatedBefore,
    params.createdBy,
    params.updatedBy,
    params.editedBy?.length,
    params.coOccurrence?.length,
  ].filter(Boolean).length;

// keeps saved query names within the two lines the query rows show (see
// StyledQueryName); matters most for shared queries, which every user sees in their list
export const QUERY_NAME_MAX_LENGTH = 80;

/**
 * A saved query name read off the tree: the root's pinned entity or classes,
 * then each edge's label and target, NOT for a negative edge, "or" between
 * the edges of an OR node, and a node's nested conditions in brackets. A name
 * over the limit is cut with an ellipsis. `labelOf` returns a pinned entity's
 * label, undefined while it is not loaded.
 */
export const suggestQueryName = (
  root: Query.INode,
  labelOf: (entityId: string) => string | undefined,
): string => {
  const target = (node: Query.INode, isRoot: boolean): string => {
    const { entityId, entityClasses = [] } = node.params;
    if (entityId) {
      return labelOf(entityId) ?? "entity";
    }
    if (entityClasses.length && entityClasses.length < classesAll.length) {
      return entityClasses.map((c) => entitiesDictKeys[c]?.label ?? c).join(" or ");
    }
    return isRoot ? "Any entity" : "";
  };
  const conditions = (node: Query.INode): string =>
    node.edges
      .map((edge) => {
        const negation = edge.logic === Query.EdgeLogic.Negative ? "NOT " : "";
        const parts = [Query.EdgeTypeLabels[edge.type] ?? edge.type, target(edge.node, false)];
        const nested = edge.node.edges.length ? ` (${conditions(edge.node)})` : "";
        return `${negation}${parts.filter(Boolean).join(" ")}${nested}`;
      })
      .join(node.operator === Query.NodeOperator.Or ? " or " : ", ");

  const edges = conditions(root);
  const name = edges ? `${target(root, true)}, ${edges}` : target(root, true);
  return name.length > QUERY_NAME_MAX_LENGTH
    ? `${name.slice(0, QUERY_NAME_MAX_LENGTH - 1).trimEnd()}…`
    : name;
};
