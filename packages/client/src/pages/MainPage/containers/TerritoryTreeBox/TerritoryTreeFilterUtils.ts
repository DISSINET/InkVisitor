import { UserEnums } from "@shared/enums";
import { IResponseTree } from "@shared/types";
import { IExtendedResponseTree } from "types";

// Filter NON EMPTY
export function filterTreeNonEmpty(
  node: IResponseTree | null
): IResponseTree | null {
  if (!node) {
    return null;
  }

  const hasNonEmptyDescendant = node.children.some((child) =>
    hasNonEmptyRecursively(child)
  );

  if (node.statementsCount > 0 || hasNonEmptyDescendant) {
    const filteredChildren = node.children
      .map((child) =>
        // stop recursion with this condition to keep children of filtered nodes
        child.statementsCount > 0 ? child : filterTreeNonEmpty(child)
      )
      .filter((filteredChild) => filteredChild !== null);

    return {
      ...node,
      children: filteredChildren,
    } as IResponseTree;
  }

  return null;
}

function hasNonEmptyRecursively(node: IResponseTree | null): boolean {
  if (!node) {
    return false;
  }
  if (node.statementsCount > 0) {
    return true;
  }
  return node.children.some((child) => hasNonEmptyRecursively(child));
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
    node.territory.label.toLowerCase().includes(targetLabel.toLowerCase()) ||
    hasLabelDescendant
  ) {
    const filteredChildren = node.children
      .map((child) =>
        child.territory.label.toLowerCase().includes(targetLabel.toLowerCase())
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

  if (node.territory.label.toLowerCase().includes(targetLabel.toLowerCase())) {
    return true;
  }

  return node.children.some((child) => hasLabelRecursively(child, targetLabel));
}

export function markNodesWithFilters(
  node: IResponseTree,
  filters: {
    nonEmpty: boolean;
    starred: boolean;
    editorRights: boolean;
    filter: string;
  },
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
  filters: {
    nonEmpty: boolean;
    starred: boolean;
    editorRights: boolean;
    filter: string;
  },
  favoriteIds: string[]
): boolean {
  const { nonEmpty, starred, editorRights, filter: targetLabel } = filters;

  const meetsNonEmptyCondition = nonEmpty ? node.statementsCount > 0 : true;
  const meetsStarredCondition = starred
    ? favoriteIds.includes(node.territory.id)
    : true;
  const meetsEditorRightsCondition = editorRights
    ? node.right === UserEnums.RoleMode.Write
    : true;
  const meetsFilterCondition =
    targetLabel.length === 0 ||
    node.territory.label.toLowerCase().includes(targetLabel.toLowerCase());

  return (
    meetsNonEmptyCondition &&
    meetsStarredCondition &&
    meetsEditorRightsCondition &&
    meetsFilterCondition
  );
}
