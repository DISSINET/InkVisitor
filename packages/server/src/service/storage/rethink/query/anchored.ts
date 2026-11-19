import { EntityEnums } from "@inkvisitor/shared/enums";
import { IAnchorsNode } from "@inkvisitor/shared/types/document";

/**
 * Ids of the entities anchored inside the span of a territory anchor: every
 * node below a Territory node of the anchors trees, at any depth. With
 * `territoryIds` only the spans of those territories count, null counts the
 * span of every territory. ReQL cannot walk a tree of unknown depth, so the
 * EAT: edge reads the trees and walks them here.
 */
export function anchoredUnder(trees: (IAnchorsNode[] | undefined)[], territoryIds: string[] | null): string[] {
  const targets = territoryIds && new Set(territoryIds);
  const anchored = new Set<string>();
  const walk = (nodes: IAnchorsNode[] | undefined, inSpan: boolean) => {
    for (const node of nodes ?? []) {
      if (inSpan) {
        anchored.add(node.anchor);
      }
      const opensSpan = node.class === EntityEnums.Class.Territory && (!targets || targets.has(node.anchor));
      walk(node.children, inSpan || opensSpan);
    }
  };
  for (const tree of trees) {
    walk(tree, false);
  }
  return [...anchored];
}
