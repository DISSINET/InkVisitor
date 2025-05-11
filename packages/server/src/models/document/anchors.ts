import { EntityEnums } from "@shared/enums";
import { IAnchorsNode } from "@shared/types/document";

export class AnchorsNode implements IAnchorsNode {
    anchor: string;
    children: AnchorsNode[] = [];
    content = ""; 
    class: EntityEnums.Class; 
  
    static MAX_CONTENT_LENGTH = 400;
  
    constructor(anchor: string, content: string, children: IAnchorsNode[] , anchorClass: EntityEnums.Class) {
      this.anchor = anchor;
      this.content = content;
      this.children = (children || []).map((child) => new AnchorsNode(child.anchor, child.content, child.children, child.class));
      this.class = anchorClass;
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
  } 