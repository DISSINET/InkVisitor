import { UserEnums } from "@shared/enums";
import { IResponseTree } from "@shared/types";
import { IExtendedResponseTree, ITerritoryFilter } from "types";

// Filter WITH STATEMENTS
export function filterTreeWithStatements(
  node: IResponseTree | null
): IResponseTree | null {
  if (!node) {
    return null;
  }

  const hasDescendantWithStatements = node.children.some((child) =>
    hasNodeWithStatementsRecursively(child)
  );

  if (node.statementsCount > 0 || hasDescendantWithStatements) {
    const filteredChildren = node.children
      .map((child) =>
        // stop recursion with this condition to keep children of filtered nodes
        child.statementsCount > 0 ? child : filterTreeWithStatements(child)
      )
      .filter((filteredChild) => filteredChild !== null);

    return {
      ...node,
      children: filteredChildren,
    } as IResponseTree;
  }

  return null;
}

function hasNodeWithStatementsRecursively(node: IResponseTree | null): boolean {
  if (!node) {
    return false;
  }
  if (node.statementsCount > 0) {
    return true;
  }
  return node.children.some((child) => hasNodeWithStatementsRecursively(child));
}

// Filter EDITOR RIGHTS
export function filterTreeWithWriteRights(
  node: IResponseTree | null
): IResponseTree | null {
  if (!node) {
    return null;
  }

  const hasWriteDescendant = node.children.some((child) =>
    hasWriteRightRecursively(child)
  );

  if (node.right === UserEnums.RoleMode.Write || hasWriteDescendant) {
    const filteredChildren = node.children
      .map((child) =>
        child.right === UserEnums.RoleMode.Write
          ? child
          : filterTreeWithWriteRights(child)
      )
      .filter((filteredChild) => filteredChild !== null);

    return { ...node, children: filteredChildren } as IResponseTree;
  }

  return null;
}

function hasWriteRightRecursively(node: IResponseTree | null): boolean {
  if (!node) {
    return false;
  }
  if (node.right === UserEnums.RoleMode.Write) {
    return true;
  }
  return node.children.some((child) => hasWriteRightRecursively(child));
}

// filter FAVORITED
export function filterTreeByFavorites(
  node: IResponseTree | null,
  favoriteIds: string[]
): IResponseTree | null {
  if (!node) {
    return null;
  }

  const hasFavoriteDescendant = node.children.some((child) =>
    hasFavoriteRecursively(child, favoriteIds)
  );

  if (favoriteIds.includes(node.territory.id) || hasFavoriteDescendant) {
    const filteredChildren = node.children
      .map((child) =>
        favoriteIds.includes(child.territory.id)
          ? child
          : filterTreeByFavorites(child, favoriteIds)
      )
      .filter((filteredChild) => filteredChild !== null);

    return { ...node, children: filteredChildren } as IResponseTree;
  }

  return null;
}

function hasFavoriteRecursively(
  node: IResponseTree | null,
  favoriteIds: string[]
): boolean {
  if (!node) {
    return false;
  }

  if (favoriteIds.includes(node.territory.id)) {
    return true;
  }

  return node.children.some((child) =>
    hasFavoriteRecursively(child, favoriteIds)
  );
}

// Filter BY LABEL
export function filterTreeByLabel(
  node: IResponseTree | null,
  targetLabel: string
): IResponseTree | null {
  if (!node) {
    return null;
  }

  const hasLabelDescendant = node.children.some((child) =>
    hasLabelRecursively(child, targetLabel)
  );

  if (
    node.territory.labels[0]
      .toLowerCase()
      .includes(targetLabel.toLowerCase()) ||
    hasLabelDescendant
  ) {
    const filteredChildren = node.children
      .map((child) =>
        child.territory.labels[0]
          .toLowerCase()
          .includes(targetLabel.toLowerCase())
          ? child
          : filterTreeByLabel(child, targetLabel)
      )
      .filter((filteredChild) => filteredChild !== null);

    return { ...node, children: filteredChildren } as IResponseTree;
  }

  return null;
}

function hasLabelRecursively(
  node: IResponseTree | null,
  targetLabel: string
): boolean {
  if (!node) {
    return false;
  }

  if (
    node.territory.labels[0].toLowerCase().includes(targetLabel.toLowerCase())
  ) {
    return true;
  }

  return node.children.some((child) => hasLabelRecursively(child, targetLabel));
}

// Filter WITH SUBTERRITORIES (first level only)
export function filterTreeWithSubterritories(
  node: IResponseTree | null
): IResponseTree | null {
  if (!node) {
    return null;
  }

  // For first level territories (direct children of root), check if they have sub-territories
  const filteredChildren = node.children
    .map((child) => {
      // If this child has sub-territories, keep it with all its children
      if (child.children.length > 0) {
        return child;
      }
      // If this child has no sub-territories, filter it out
      return null;
    })
    .filter((filteredChild) => filteredChild !== null);

  return {
    ...node,
    children: filteredChildren,
  } as IResponseTree;
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
