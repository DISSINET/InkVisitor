import { EntityEnums } from "@shared/enums";
import { IAnchorsNode } from "@shared/types/document";
import { IDocumentAuditAnchorChanges, IAnchorUpdate } from "@shared/types";
import { EventType } from "@shared/types/stats";
import { createAnyTagRegex, createOpeningTagRegex } from "@common/regex";

interface IOrderedAnchorItem {
  anchor: string;
  occurrence: number;
  content: string;
  path: string[];
}

function key(a: IAnchorUpdate): string {
  return `${a.anchor}:${a.occurrence}`;
}

export class AnchorsNode implements IAnchorsNode {
  anchor: string;
  children: AnchorsNode[] = [];
  content = "";
  class: EntityEnums.Class;
  indexStart: number;
  indexEnd: number;
  static MAX_CONTENT_LENGTH = 400;

  constructor(anchor: string, content: string, children: IAnchorsNode[], anchorClass: EntityEnums.Class) {
    this.anchor = anchor;
    this.content = content;
    this.children = (children || []).map((child) => new AnchorsNode(child.anchor, child.content, child.children, child.class));
    this.class = anchorClass;
    this.indexStart = -1;
    this.indexEnd = -1;
  }

  /**
   * Returns sanitized content - shortened to MAX_CONTENT_LENGTH chars
   * @returns
   */
  getShortContent(): string {
    if (this.content.length > AnchorsNode.MAX_CONTENT_LENGTH) {
      return this.content.slice(0, AnchorsNode.MAX_CONTENT_LENGTH) + "...";
    }
    return this.content;
  }

  /**
  * Builds the anchors tree
  * @returns
  */
  static buildAnchorsTree(content: string, entityIds: Record<EntityEnums.Class, string[]>): AnchorsNode[] {
    const anyTagPattern = createAnyTagRegex(); // Regex to match any tag with optional attributes
    const rootNodes: AnchorsNode[] = []; // List of root nodes
    const nodeStack: AnchorsNode[] = []; // Stack to keep track of the current node

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = anyTagPattern.exec(content)) !== null) {
      const tagContent = match[1];
      // Extract only the tag name (first word before any attributes or spaces)
      const tag = tagContent.split(/\s+/)[0];
      const isClosingTag = content[match.index + 1] === "/";

      // Add text content between tags to the parent node
      if (match.index > lastIndex) {
        const text = content.slice(lastIndex, match.index);
        if (text.length > 0 && nodeStack.length > 0) {
          nodeStack[nodeStack.length - 1].content += text;
        }
      }

      if (!isClosingTag) {
        // Open tag: Create a new node for the tag
        let anchorClass: EntityEnums.Class | undefined;
        for (const classType of Object.keys(entityIds)) {
          if (entityIds[classType as EntityEnums.Class].includes(tag)) {
            anchorClass = classType as EntityEnums.Class;
            break;
          }
        }

        if (anchorClass) {
          const newNode = new AnchorsNode(tag, "", [], anchorClass);
          newNode.indexStart = match.index; // Set the start index when opening tag is found
          if (nodeStack.length > 0) {
            nodeStack[nodeStack.length - 1].children.push(newNode);
          } else {
            // Root level node
            rootNodes.push(newNode);
          }
          // Push the new node onto the stack (start processing its children)
          nodeStack.push(newNode);
        }
      } else {
        // Close tag: Pop the node off the stack
        const closedNode = nodeStack.pop();

        // Set the end index when closing tag is found
        if (closedNode) {
          closedNode.indexEnd = match.index + match[0].length;
        }

        // If there's a parent node, merge the content of the closed node into its parent (remove tag, keep content)
        if (closedNode && nodeStack.length > 0) {
          nodeStack[nodeStack.length - 1].content += closedNode.content;
        }
      }

      lastIndex = anyTagPattern.lastIndex;
    }

    // Handle any remaining text after the last tag
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex).trim();
      if (remainingText.length > 0 && nodeStack.length > 0) {
        nodeStack[nodeStack.length - 1].content += remainingText;
      }
    }

    return rootNodes;
  }

  /**
   * Counts occurrences of each anchor opening tag in raw document content.
   * Operates on the content tags directly, independent of whether the tagged
   * entity exists in the database yet.
   */
  static countAnchorTags(content: string): Map<string, number> {
    const regex = createOpeningTagRegex();
    const counts = new Map<string, number>();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      const tag = match[1].split(/\s+/)[0];
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return counts;
  }

  /**
   * Detects whether anchors were added and/or removed between two versions of
   * raw document content, based on anchor opening tags. Unlike the
   * entity-resolved anchor diff, this catches anchors whose entity does not yet
   * exist in the database (e.g. a freshly anchored statement saved before its
   * entity is created).
   */
  static diffAnchorTagsInContent(
    oldContent: string,
    newContent: string
  ): { added: boolean; removed: boolean } {
    const oldCounts = AnchorsNode.countAnchorTags(oldContent);
    const newCounts = AnchorsNode.countAnchorTags(newContent);

    let added = false;
    let removed = false;
    const tags = new Set([...oldCounts.keys(), ...newCounts.keys()]);
    for (const tag of tags) {
      const oldCount = oldCounts.get(tag) ?? 0;
      const newCount = newCounts.get(tag) ?? 0;
      if (newCount > oldCount) {
        added = true;
      }
      if (newCount < oldCount) {
        removed = true;
      }
    }

    return { added, removed };
  }

  /**
   * Lists anchor tags newly opened in content (by occurrence index).
   * Works for tags whose entity is not in the DB yet (e.g. new Statement).
   */
  static getAnchorTagAdditions(
    oldContent: string,
    newContent: string
  ): IAnchorUpdate[] {
    const oldCounts = AnchorsNode.countAnchorTags(oldContent);
    const newCounts = AnchorsNode.countAnchorTags(newContent);
    const additions: IAnchorUpdate[] = [];
    for (const [tag, newCount] of newCounts) {
      const oldCount = oldCounts.get(tag) ?? 0;
      for (let occurrence = oldCount; occurrence < newCount; occurrence++) {
        additions.push({ anchor: tag, occurrence });
      }
    }
    return additions;
  }

  /**
   * Lists anchor tags removed from content (by occurrence index).
   */
  static getAnchorTagRemovals(
    oldContent: string,
    newContent: string
  ): IAnchorUpdate[] {
    const oldCounts = AnchorsNode.countAnchorTags(oldContent);
    const newCounts = AnchorsNode.countAnchorTags(newContent);
    const removals: IAnchorUpdate[] = [];
    for (const [tag, oldCount] of oldCounts) {
      const newCount = newCounts.get(tag) ?? 0;
      for (let occurrence = newCount; occurrence < oldCount; occurrence++) {
        removals.push({ anchor: tag, occurrence });
      }
    }
    return removals;
  }

  static mergeAnchorUpdates(...lists: IAnchorUpdate[][]): IAnchorUpdate[] {
    const seen = new Set<string>();
    const merged: IAnchorUpdate[] = [];
    for (const list of lists) {
      for (const item of list) {
        const k = key(item);
        if (!seen.has(k)) {
          seen.add(k);
          merged.push(item);
        }
      }
    }
    return merged;
  }

  /**
   * Drops "changed" parent anchors whose content only shifted because a child was added.
   */
  static filterChangesObsoletedByAdditions(
    changes: IAnchorUpdate[],
    additions: IAnchorUpdate[],
    newList: IOrderedAnchorItem[]
  ): IAnchorUpdate[] {
    if (additions.length === 0) {
      return changes;
    }
    const newByKey = new Map(newList.map((item) => [key(item), item]));
    const isAncestorOf = (
      ancestor: IOrderedAnchorItem,
      descendant: IOrderedAnchorItem
    ) =>
      descendant.path.length > ancestor.path.length &&
      ancestor.path.every((v, i) => v === descendant.path[i]);

    return changes.filter((change) => {
      const changeItem = newByKey.get(key(change));
      if (!changeItem) {
        return true;
      }
      return !additions.some((addition) => {
        const additionItem = newByKey.get(key(addition));
        return (
          additionItem !== undefined && isAncestorOf(changeItem, additionItem)
        );
      });
    });
  }

  /**
   * Merges tree-based anchor diff with raw-tag diff and trims misleading parent
   * "changes" when the audit event is anchor add/remove.
   */
  static finalizeDocumentAuditChanges(params: {
    auditType: EventType;
    oldContent: string;
    newContent: string;
    treeDiff: IDocumentAuditAnchorChanges;
    newOrderedList: IOrderedAnchorItem[];
  }): IDocumentAuditAnchorChanges {
    const { auditType, oldContent, newContent, treeDiff, newOrderedList } =
      params;
    const tagAdditions = AnchorsNode.getAnchorTagAdditions(
      oldContent,
      newContent
    );
    const tagRemovals = AnchorsNode.getAnchorTagRemovals(oldContent, newContent);

    let additions = AnchorsNode.mergeAnchorUpdates(
      treeDiff.additions,
      tagAdditions
    );
    let removals = AnchorsNode.mergeAnchorUpdates(treeDiff.removals, tagRemovals);
    let changes = [...treeDiff.changes];

    if (auditType === EventType.ANCHOR_ADD) {
      changes = AnchorsNode.filterChangesObsoletedByAdditions(
        changes,
        additions,
        newOrderedList
      );
      if (tagAdditions.length > 0) {
        changes = [];
      }
    } else if (auditType === EventType.ANCHOR_REMOVE) {
      if (tagRemovals.length > 0) {
        changes = [];
      }
    }

    return { changes, additions, removals };
  }

  static getOrderedAnchorListFromTree(nodes: IAnchorsNode[]): IOrderedAnchorItem[] {
    const list: IOrderedAnchorItem[] = [];
    const countByAnchor: Record<string, number> = {};
    const traverse = (treeNodes: IAnchorsNode[], path: string[] = []) => {
      for (const node of treeNodes) {
        const occ = countByAnchor[node.anchor] ?? 0;
        countByAnchor[node.anchor] = occ + 1;
        const k = `${node.anchor}:${occ}`;
        const nodePath = path.concat(k);
        list.push({
          anchor: node.anchor,
          occurrence: occ,
          content: node.content,
          path: nodePath,
        });
        traverse(node.children || [], nodePath);
      }
    };
    traverse(nodes);
    return list;
  }

  static compareAnchorTrees(
    oldTree: IAnchorsNode[],
    newTree: IAnchorsNode[]
  ): IDocumentAuditAnchorChanges {
    const oldList = AnchorsNode.getOrderedAnchorListFromTree(oldTree);
    const newList = AnchorsNode.getOrderedAnchorListFromTree(newTree);
    return AnchorsNode.diffOrderedAnchorLists(oldList, newList);
  }

  static diffOrderedAnchorLists(
    oldList: IOrderedAnchorItem[],
    newList: IOrderedAnchorItem[]
  ): IDocumentAuditAnchorChanges {
    const oldByKey = new Map<string, IOrderedAnchorItem>();
    const newByKey = new Map<string, IOrderedAnchorItem>();
    for (const x of oldList) {
      oldByKey.set(key(x), x);
    }
    for (const x of newList) {
      newByKey.set(key(x), x);
    }
    const additions: IAnchorUpdate[] = [];
    const removals: IAnchorUpdate[] = [];
    const allChanges: IOrderedAnchorItem[] = [];
    for (const n of newList) {
      const k = key(n);
      if (!oldByKey.has(k)) {
        additions.push({ anchor: n.anchor, occurrence: n.occurrence });
      } else if (oldByKey.get(k)!.content !== n.content) {
        allChanges.push(n);
      }
    }
    const isAncestorOf = (ancestor: IOrderedAnchorItem, descendant: IOrderedAnchorItem) =>
      descendant.path.length > ancestor.path.length &&
      ancestor.path.every((v, i) => v === descendant.path[i]);
    const changes: IAnchorUpdate[] = allChanges
      .filter(
        (c) => !allChanges.some((other) => other !== c && isAncestorOf(c, other))
      )
      .map((c) => ({ anchor: c.anchor, occurrence: c.occurrence }));
    for (const o of oldList) {
      const k = key(o);
      if (!newByKey.has(k)) {
        removals.push({ anchor: o.anchor, occurrence: o.occurrence });
      }
    }
    return { changes, additions, removals };
  }
} 