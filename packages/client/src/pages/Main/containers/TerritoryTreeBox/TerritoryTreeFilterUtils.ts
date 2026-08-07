import { UserEnums } from "@inkvisitor/shared/enums";
import { IResponseTree } from "@inkvisitor/shared/types";
import { IExtendedResponseTree, ITerritoryFilter } from "types";

/**
 * Prunes the tree to the nodes the filter settings select, honouring the AND/OR
 * operator through the same predicate that drives highlighting. A match is kept
 * with its subtree intact; a non-match survives only while it still has a
 * surviving descendant, so the path to a match stays walkable.
 */
export function filterTreeByFilters(
  node: IResponseTree | null,
  filters: ITerritoryFilter,
  favoriteIds: string[]
): IResponseTree | null {
  if (!node) {
    return null;
  }

  // the match test belongs to the child, not to the node itself: the walk starts
  // at the root, which satisfies the structural filters and would carry the whole
  // tree through as a single hit
  const filteredChildren = node.children
    .map((child) =>
      // a match keeps its subtree whole, so the children under a hit stay browsable
      isNodeMatchingFilters(child, filters, favoriteIds)
        ? child
        : filterTreeByFilters(child, filters, favoriteIds)
    )
    .filter((child): child is IResponseTree => child !== null);

  if (filteredChildren.length > 0) {
    return { ...node, children: filteredChildren } as IResponseTree;
  }

  return null;
}

export function markNodesWithFilters(
  node: IResponseTree,
  filters: ITerritoryFilter,
  favoriteIds: string[]
): IExtendedResponseTree {
  const extendedNode: IExtendedResponseTree = {
    ...node,
    foundByRecursion: isNodeMatchingFilters(node, filters, favoriteIds),
    children: [],
  };

  extendedNode.children = node.children.map((child) =>
    markNodesWithFilters(child, filters, favoriteIds)
  );

  return extendedNode;
}

function isNodeMatchingFilters(
  node: IResponseTree,
  filters: ITerritoryFilter,
  favoriteIds: string[]
): boolean {
  const {
    starred,
    editorRights,
    withSubterritories,
    withStatements,
    filter: targetLabel,
    operator = "and", // default to "and" if not specified
  } = filters;

  const meetsWithStatementsCondition = withStatements
    ? node.statementsCount > 0
    : true;
  const meetsWithSubterritoriesCondition = withSubterritories
    ? node.children.length > 0
    : true;
  const meetsStarredCondition = starred
    ? favoriteIds.includes(node.territory.id)
    : true;
  const meetsEditorRightsCondition = editorRights
    ? node.right === UserEnums.RoleMode.Write
    : true;
  const meetsFilterCondition =
    targetLabel.length === 0 ||
    node.territory.labels[0].toLowerCase().includes(targetLabel.toLowerCase());

  // Apply AND/OR logic based on operator
  if (operator === "or") {
    // For OR logic, at least one condition must be true (excluding conditions that are always true)
    const activeConditions = [
      withStatements ? meetsWithStatementsCondition : null,
      withSubterritories ? meetsWithSubterritoriesCondition : null,
      starred ? meetsStarredCondition : null,
      editorRights ? meetsEditorRightsCondition : null,
      targetLabel.length > 0 ? meetsFilterCondition : null,
    ].filter((condition) => condition !== null);

    // If no active conditions, return false (no filters applied, so no highlighting)
    if (activeConditions.length === 0) {
      return false;
    }

    // Return true if any active condition is true
    return activeConditions.some((condition) => condition === true);
  } else {
    // Default AND logic - all conditions must be true
    return (
      meetsWithStatementsCondition &&
      meetsWithSubterritoriesCondition &&
      meetsStarredCondition &&
      meetsEditorRightsCondition &&
      meetsFilterCondition
    );
  }
}
