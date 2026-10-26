import { IResponseTree, IResponseUser } from "@inkvisitor/shared/types";
import { searchTree } from "utils/utils";

interface DefaultTerritoryContext {
  user: IResponseUser | undefined;
  tree: IResponseTree | undefined;
  /** No territory, statement or detail tab came in from the url. */
  isCleanLoad: boolean;
}

/**
 * Pure decision: which territory should open on its own?
 *
 * The default territory from user customization, on a load that asked for
 * nothing else - a url carrying params says where the user wants to be, and
 * that outranks a standing preference. Null when there is nothing to open, or
 * when the default is not in the tree the user can see: it may have been
 * deleted, or their rights to it withdrawn, and opening it would leave the tree
 * with nothing to select and the statement list with nothing to load.
 */
export const resolveDefaultTerritory = ({
  user,
  tree,
  isCleanLoad,
}: DefaultTerritoryContext): string | null => {
  if (!isCleanLoad || !user || !tree) {
    return null;
  }

  const defaultTerritory = user.options?.defaultTerritory;
  if (!defaultTerritory || !searchTree(tree, defaultTerritory)) {
    return null;
  }

  return defaultTerritory;
};

/**
 * Does the territory hold statements of its own?
 *
 * The statement list shows one territory at a time, so statements sitting in
 * child territories are not statements this one has. A territory the tree does
 * not carry counts as having none.
 */
export const territoryHasStatements = (
  tree: IResponseTree | undefined,
  territoryId: string,
): boolean => {
  if (!tree || !territoryId) {
    return false;
  }

  return (searchTree(tree, territoryId)?.statementsCount ?? 0) > 0;
};
