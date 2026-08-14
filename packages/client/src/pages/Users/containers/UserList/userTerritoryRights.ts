import { IResponseTree, IUserRight } from "@inkvisitor/shared/types";
import { UserEnums } from "@inkvisitor/shared/enums";
import { collectTerritoryChildren, searchTree } from "utils/utils";

export const rightTerritoryIds = (
  rights: IUserRight[],
  mode: UserEnums.RoleMode,
): string[] =>
  rights.filter((right) => right.mode === mode).map((right) => right.territory);

/**
 * Territories a read right must not be assigned to.
 *
 * A right carries down the tree until a nearer right replaces it, so a write
 * territory already covers its whole subtree, and a read right placed inside
 * that subtree would take write access away from it.
 *
 * A write id the tree does not carry still counts - the assignment is there
 * even when the territory is gone or out of the caller's tree.
 */
export const readBlockedTerritoryIds = (
  tree: IResponseTree | undefined,
  writeTerritoryIds: string[],
): string[] =>
  writeTerritoryIds.flatMap((writeId) => {
    const node = tree ? searchTree(tree, writeId) : null;
    return node ? [writeId, ...collectTerritoryChildren(node)] : [writeId];
  });
