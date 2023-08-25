import { UserEnums } from "@shared/enums";
import { IResponseTree } from "@shared/types";

// Filter NON EMPTY
export function filterTreeNonEmpty(root: IResponseTree): IResponseTree | null {
  if (root.empty === true) {
    return null; // Exclude nodes with empty = true
  }

  const filteredChildren = root.children
    .map((child) => filterTreeNonEmpty(child))
    .filter((filteredChild) => filteredChild !== null) as IResponseTree[];

  return { ...root, children: filteredChildren };
}

// Filter EDITOR RIGHTS
export function filterTreeWithWriteRights(
  root: IResponseTree | null
): IResponseTree | null {
  if (!root) {
    return null;
  }

  const hasWriteDescendant = root.children.some((child) =>
    hasWriteRightRecursively(child)
  );

  if (root.right === UserEnums.RoleMode.Write || hasWriteDescendant) {
    const filteredChildren = root.children
      .map((child) => filterTreeWithWriteRights(child))
      .filter((filteredChild) => filteredChild !== null);

    return { ...root, children: filteredChildren } as IResponseTree;
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
  root: IResponseTree | null,
  favoriteIds: string[]
): IResponseTree | null {
  if (!root) {
    return null;
  }

  const hasFavoriteDescendant = root.children.some((child) =>
    hasFavoriteRecursively(child, favoriteIds)
  );

  if (favoriteIds.includes(root.territory.id) || hasFavoriteDescendant) {
    const filteredChildren = root.children
      .map((child) => filterTreeByFavorites(child, favoriteIds))
      .filter((filteredChild) => filteredChild !== null);

    return { ...root, children: filteredChildren } as IResponseTree;
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
  root: IResponseTree | null,
  targetLabel: string
): IResponseTree | null {
  if (!root) {
    return null;
  }

  const hasLabelDescendant = root.children.some((child) =>
    hasLabelRecursively(child, targetLabel)
  );

  if (
    root.territory.label.toLowerCase().includes(targetLabel.toLowerCase()) ||
    hasLabelDescendant
  ) {
    const filteredChildren = root.children
      .map((child) => filterTreeByLabel(child, targetLabel))
      .filter((filteredChild) => filteredChild !== null);

    return { ...root, children: filteredChildren } as IResponseTree;
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
