import { Query } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import { classesAll } from "@inkvisitor/shared/dictionaries/entity";

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
