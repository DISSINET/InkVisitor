import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IStatement } from "@inkvisitor/shared/types";

interface RestoreNavigators {
  setTerritoryId: (id: string) => void;
  setStatementId: (id: string) => void;
  appendDetailId: (id: string) => void;
}

export type RestoreTarget =
  | { kind: "territory"; id: string }
  | { kind: "statement"; id: string; territoryId?: string }
  | { kind: "detail"; id: string };

/**
 * Pure decision: where should the UI land for a restored entity?
 * Territories open in the tree, statements in their parent territory's editor,
 * every other class in a detail tab.
 */
export const resolveRestoreTarget = (
  entity: IEntity | undefined
): RestoreTarget | null => {
  if (!entity?.id) {
    return null;
  }
  switch (entity.class) {
    case EntityEnums.Class.Territory:
      return { kind: "territory", id: entity.id };
    case EntityEnums.Class.Statement:
      return {
        kind: "statement",
        id: entity.id,
        territoryId: (entity as IStatement).data?.territory?.territoryId,
      };
    default:
      return { kind: "detail", id: entity.id };
  }
};

/**
 * Navigates the UI to a freshly restored entity so the user lands on it instead
 * of an empty view.
 *
 * The navigation is deferred to a fresh macrotask on purpose: restore runs in an
 * async toast callback, and setting territory/statement synchronously there
 * races the search-params <-> URL sync, so the hash push gets swallowed and the
 * URL stays unchanged. Deferring lets the URL actually update (this mirrors how
 * appendDetailId defers its own selection).
 */
export const openRestoredEntity = (
  entity: IEntity | undefined,
  nav: RestoreNavigators
): void => {
  const target = resolveRestoreTarget(entity);
  if (!target) {
    return;
  }
  setTimeout(() => {
    switch (target.kind) {
      case "territory":
        nav.setTerritoryId(target.id);
        break;
      case "statement":
        if (target.territoryId) {
          nav.setTerritoryId(target.territoryId);
        }
        nav.setStatementId(target.id);
        break;
      default:
        nav.appendDetailId(target.id);
    }
  }, 0);
};
