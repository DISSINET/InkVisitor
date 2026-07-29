export type TerritoryCreateModalType = false | "child-T" | "sibling-T";

/** A node in the in-document subT hierarchy the annotator selection sits inside. */
export interface AnnotatorPositionTNode {
  /** Territory anchor (entity) id. */
  id: string;
  /** Nesting depth within the position hierarchy (0 = outermost). */
  depth: number;
}

export const W_SCROLL = 20;

export const RATIO = 2;
