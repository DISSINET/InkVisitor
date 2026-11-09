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

/**
 * A query request is "empty" when nothing constrains the search: no edges, no
 * explore filters, and the root node neither targets a specific entity / label
 * nor narrows the entity classes (an empty or full class set means "any class").
 * Such a request would scan the whole database, so the explorer skips it instead
 * of firing it automatically (e.g. on page load with the default root node).
 */
/**
 * A stats view with every event type switched off aggregates nothing, so the
 * request can only come back empty - there is no point sending it.
 */
export const isStatsRequestEmpty = (explore: Explore.IExplore): boolean =>
  explore.view.mode === Explore.EViewMode.Stats &&
  explore.view.stats.eventType.length === 0;

export const isQueryRequestEmpty = (
  query: Query.INode,
  explore: Explore.IExplore,
): boolean => {
  if (getAllEdges(query).length > 0) {
    return false;
  }
  if (explore.filters.length > 0) {
    return false;
  }

  const { entityId, label, entityClasses } = query.params;
  if (entityId) {
    return false;
  }
  if (label && label.trim().length > 0) {
    return false;
  }

  const classes = entityClasses ?? [];
  const narrowsClasses =
    classes.length > 0 && classes.length < classesAll.length;
  if (narrowsClasses) {
    return false;
  }

  return true;
};

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
