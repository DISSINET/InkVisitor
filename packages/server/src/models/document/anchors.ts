import { EntityEnums } from "@shared/enums";
import { IAnchorsNode } from "@shared/types/document";
import { createOpeningTagRegex, closingTagRegex } from "@common/regex";

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
    const openingTagPattern = createOpeningTagRegex();
    const closingTagPattern = closingTagRegex;
    const rootNodes: AnchorsNode[] = []; // List of root nodes
    const nodeStack: AnchorsNode[] = []; // Stack to keep track of the current node

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // Process opening tags
    while ((match = openingTagPattern.exec(content)) !== null) {
      const tag = match[1];

      // Add text content between tags to the parent node
      if (match.index > lastIndex) {
        const text = content.slice(lastIndex, match.index);
        if (text.length > 0 && nodeStack.length > 0) {
          nodeStack[nodeStack.length - 1].content += text;
        }
      }

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

      lastIndex = openingTagPattern.lastIndex;
    }

    // Reset lastIndex for closing tags
    lastIndex = 0;

    // Process closing tags
    while ((match = closingTagPattern.exec(content)) !== null) {
      const tag = match[1];

      // Add text content between tags to the parent node
      if (match.index > lastIndex) {
        const text = content.slice(lastIndex, match.index);
        if (text.length > 0 && nodeStack.length > 0) {
          nodeStack[nodeStack.length - 1].content += text;
        }
      }

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

      lastIndex = closingTagPattern.lastIndex;
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
} 