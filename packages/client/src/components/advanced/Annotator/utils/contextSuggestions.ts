import { EntityEnums } from "@inkvisitor/shared/enums";
import {
  IEntity,
  IProp,
  IResponseStatement,
  IResponseTree,
  IStatement,
} from "@inkvisitor/shared/types";
import { IAnchorsNode } from "@inkvisitor/shared/types/document";
import { collectStatementAnchors, searchTree } from "utils/utils";

// how many context entities the Annotator suggester lists above the search hits
export const CONTEXT_SUGGESTIONS_LIMIT = 10;

const collectPropEntityIds = (props: IProp[] | undefined, ids: string[]) => {
  props?.forEach((prop) => {
    ids.push(prop.type.entityId, prop.value.entityId);
    collectPropEntityIds(prop.children, ids);
  });
};

// entities used in the statement: actions, actants with their classifications
// and identifications, then the props of all of them
export const getStatementEntityIds = (statement: IStatement): string[] => {
  const ids: string[] = [];
  statement.data.actions.forEach((action) => ids.push(action.actionId));
  statement.data.actants.forEach((actant) => {
    ids.push(actant.entityId);
    actant.classifications?.forEach((c) => ids.push(c.entityId));
    actant.identifications?.forEach((i) => ids.push(i.entityId));
  });
  statement.data.actions.forEach((action) => collectPropEntityIds(action.props, ids));
  statement.data.actants.forEach((actant) => collectPropEntityIds(actant.props, ids));
  collectPropEntityIds(statement.props, ids);
  return [...new Set(ids.filter(Boolean))];
};

/**
 * For the statements anchored in the document: the text distance of each one's
 * nearest anchor from the index (0 when an anchor contains it), and the ids of
 * those containing the index, innermost first.
 */
export const getStatementAnchorContext = (
  anchors: IAnchorsNode[],
  index: number
): { containingIds: string[]; distances: Map<string, number> } => {
  const distances = new Map<string, number>();
  const containing: IAnchorsNode[] = [];
  collectStatementAnchors(anchors).forEach((anchor) => {
    const distance =
      index < anchor.indexStart
        ? anchor.indexStart - index
        : index > anchor.indexEnd
          ? index - anchor.indexEnd
          : 0;
    if (distance === 0) {
      containing.push(anchor);
    }
    const known = distances.get(anchor.anchor);
    if (known === undefined || distance < known) {
      distances.set(anchor.anchor, distance);
    }
  });
  containing.sort((a, b) => a.indexEnd - a.indexStart - (b.indexEnd - b.indexStart));
  return { containingIds: [...new Set(containing.map((a) => a.anchor))], distances };
};

// the territory and its ancestors, nearest first, leaving out those without
// statements of their own
export const getTerritoryChain = (tree: IResponseTree, territoryId: string): string[] => {
  const node = searchTree(tree, territoryId);
  if (!node) {
    return [territoryId];
  }
  return [territoryId, ...[...node.path].reverse()].filter(
    (id) => (searchTree(tree, id)?.statementsCount ?? 0) > 0
  );
};

// nearest anchored statements first; statements not anchored in the document
// follow in their territory order (the sort is stable)
export const sortStatementsByDistance = <T extends { id: string }>(
  statements: T[],
  distances: Map<string, number>
): T[] =>
  [...statements].sort(
    (a, b) => (distances.get(a.id) ?? Infinity) - (distances.get(b.id) ?? Infinity)
  );

// The entities used in the statements, in statement order, up to `limit`.
// Territories are never suggested.
export const collectContextEntities = (
  statements: IResponseStatement[],
  limit: number = CONTEXT_SUGGESTIONS_LIMIT
): IEntity[] => {
  const picked = new Map<string, IEntity>();
  for (const statement of statements) {
    for (const id of getStatementEntityIds(statement)) {
      if (picked.size >= limit) {
        return [...picked.values()];
      }
      const entity = statement.entities[id];
      if (entity && entity.class !== EntityEnums.Class.Territory) {
        picked.set(id, entity);
      }
    }
  }
  return [...picked.values()];
};
