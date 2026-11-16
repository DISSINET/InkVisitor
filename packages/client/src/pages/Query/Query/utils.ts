import { EntityEnums } from "@inkvisitor/shared/enums";
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

/** levels of nodes in the tree, the root being the first, as the server counts them for MAX_SAVED_QUERY_DEPTH */
export const queryDepth = (node: Query.INode): number =>
  1 + Math.max(0, ...node.edges.map((edge) => queryDepth(edge.node)));

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
export const isNodeNarrowed = (node: Query.INode): boolean => {
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
  "entityLogicalTypes",
  "entityPartsOfSpeech",
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

const C = EntityEnums.Class;

/** the classes whose entities carry data.logicalType */
export const LOGICAL_TYPE_CLASSES = [
  C.Person,
  C.Group,
  C.Being,
  C.Object,
  C.Location,
  C.Event,
  C.Value,
];

/** the classes whose entities carry data.pos */
export const PART_OF_SPEECH_CLASSES = [C.Concept, C.Action];

/** an entity of one of `classes` (empty for any class) can be of one of `carriers` */
export const classesReach = (
  classes: EntityEnums.Class[],
  carriers: EntityEnums.Class[],
): boolean => classes.length === 0 || classes.some((c) => carriers.includes(c));

/** how many node filters a node applies; a date range counts once, whichever ends are set */
export const countNodeFilters = (params: Query.INodeParams): number =>
  [
    params.entityStatuses?.length,
    params.entityLanguages?.length,
    params.entityLogicalTypes?.length,
    params.entityPartsOfSpeech?.length,
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
 * the edges of an OR node, and a node's nested conditions in brackets. Each
 * start node is named as a root would be, the start nodes joined by "or"; one
 * with conditions next to other start nodes goes in brackets, so its
 * conditions read as its own. A name over the limit is cut with an ellipsis.
 * `labelOf` returns a pinned entity's label, undefined while it is not loaded.
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
  const negation = (edge: Query.IEdge) => (edge.logic === Query.EdgeLogic.Negative ? "NOT " : "");
  const conditions = (node: Query.INode): string =>
    node.edges
      .map((edge) => {
        const parts = [Query.EdgeTypeLabels[edge.type] ?? edge.type, target(edge.node, false)];
        const nested = edge.node.edges.length ? ` (${conditions(edge.node)})` : "";
        return `${negation(edge)}${parts.filter(Boolean).join(" ")}${nested}`;
      })
      .join(node.operator === Query.NodeOperator.Or ? " or " : ", ");
  const asRoot = (node: Query.INode): string => {
    const edges = conditions(node);
    return edges ? `${target(node, true)}, ${edges}` : target(node, true);
  };

  const asStartNode = (edge: Query.IEdge): string => {
    const named = asRoot(edge.node);
    const bracketed = root.edges.length > 1 && edge.node.edges.length ? `(${named})` : named;
    return `${negation(edge)}${bracketed}`;
  };

  const name = Query.hasStartNodes(root)
    ? root.edges.map(asStartNode).join(" or ")
    : asRoot(root);
  return name.length > QUERY_NAME_MAX_LENGTH
    ? `${name.slice(0, QUERY_NAME_MAX_LENGTH - 1).trimEnd()}…`
    : name;
};
