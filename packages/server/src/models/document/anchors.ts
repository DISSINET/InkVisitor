import { EntityEnums } from "@shared/enums";
import { IAnchorsNode } from "@shared/types/document";
import { IDocumentAuditAnchorChanges, IAnchorUpdate } from "@shared/types";
import { createOpeningTagRegex, createAnyTagRegex } from "@common/regex";

export function getEntityIdsFromContent(content: string): Record<EntityEnums.Class, string[]> {
  const regex = createOpeningTagRegex();
  const tagNames = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    tagNames.add(match[1].split(/\s+/)[0]);
  }
  const result: Record<EntityEnums.Class, string[]> = {
    [EntityEnums.Class.Action]: [],
    [EntityEnums.Class.Resource]: [],
    [EntityEnums.Class.Concept]: Array.from(tagNames),
    [EntityEnums.Class.Person]: [],
    [EntityEnums.Class.Location]: [],
    [EntityEnums.Class.Event]: [],
    [EntityEnums.Class.Object]: [],
    [EntityEnums.Class.Territory]: [],
    [EntityEnums.Class.Statement]: [],
    [EntityEnums.Class.Value]: [],
    [EntityEnums.Class.Being]: [],
    [EntityEnums.Class.Group]: [],
  };
  return result;
}

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

  static getOrderedAnchorList(
    content: string,
    entityIds: Record<EntityEnums.Class, string[]>
  ): IOrderedAnchorItem[] {
    const tree = AnchorsNode.buildAnchorsTree(content, entityIds);
    const list: IOrderedAnchorItem[] = [];
    const countByAnchor: Record<string, number> = {};
    const traverse = (nodes: AnchorsNode[], path: string[] = []) => {
      for (const node of nodes) {
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
        traverse(node.children, nodePath);
      }
    };
    traverse(tree);
    return list;
  }

  static compareAnchors(
    oldContent: string,
    oldEntityIds: Record<EntityEnums.Class, string[]>,
    newContent: string,
    newEntityIds: Record<EntityEnums.Class, string[]>
  ): IDocumentAuditAnchorChanges {
    const oldList = AnchorsNode.getOrderedAnchorList(oldContent, oldEntityIds);
    const newList = AnchorsNode.getOrderedAnchorList(newContent, newEntityIds);
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