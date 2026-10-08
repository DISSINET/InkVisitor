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

/**
 * Stacking layers for the annotator overlays that are portalled or appended to
 * `document.body` rather than to the canvas wrapper.
 *
 * They follow the app's floating scale: tooltips and suggesters at 10000, menus
 * just above at 10001 (Menu) and 10002 (EntityTagContextMenu). The anchor
 * preview is a tooltip, so it belongs on the lower rung — a menu is opened by an
 * explicit click, usually over a preview that is already showing.
 */
export const ANNOTATOR_OVERLAY_Z = {
  anchorHoverPreview: 10000,
  settingsOverlay: 10001,
  contextMenu: 10002,
};
