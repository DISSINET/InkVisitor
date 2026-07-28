import { EditMode } from "@inkvisitor/annotator/src/lib";

/** Which floating find panel is open. At most one is mounted at a time. */
export enum FindPanel {
  None = "none",
  Find = "find",
  SequentialAnchor = "sequential-anchor",
  FindReplace = "find-replace",
}

/**
 * Find and replace belongs to the text-editing modes and sequential anchoring to
 * highlight mode, so the mode picks the panel and the two open flags only say
 * how far in the user has gone. Both flags survive a mode switch, which is what
 * lets a user leave anchoring, edit the XML and come back mid-batch.
 */
export const resolveFindPanel = (
  mode: EditMode,
  isFindOpen: boolean,
  isSequentialAnchoringOpen: boolean,
): FindPanel => {
  if (!isFindOpen) {
    return FindPanel.None;
  }
  if (mode !== EditMode.HIGHLIGHT) {
    return FindPanel.FindReplace;
  }
  return isSequentialAnchoringOpen ? FindPanel.SequentialAnchor : FindPanel.Find;
};

interface SelectionMenuState {
  mode: EditMode;
  selectedText: string;
  isSelectingText: boolean;
  hideSelectionMenu: boolean;
  hasDocument: boolean;
  findPanel: FindPanel;
}

/**
 * Sequential anchoring selects each match as it steps through them, so the menu
 * would reopen on every jump and cover the panel driving it.
 */
export const shouldShowSelectionMenu = ({
  mode,
  selectedText,
  isSelectingText,
  hideSelectionMenu,
  hasDocument,
  findPanel,
}: SelectionMenuState): boolean =>
  mode === EditMode.HIGHLIGHT &&
  selectedText !== "" &&
  !isSelectingText &&
  !hideSelectionMenu &&
  hasDocument &&
  findPanel !== FindPanel.SequentialAnchor;

interface EditActionsState {
  canEditDocument: boolean;
  mode: EditMode;
  isChangeMade: boolean;
  isSaving: boolean;
  isSavingWithoutRefresh: boolean;
  dataDocumentIsFetching: boolean;
}

/**
 * Visible-but-disabled is deliberate: these two buttons are the only thing that
 * tells a user the loaded document is editable at all. Hidden in highlight mode,
 * where isChangeMade is always false and they could never enable.
 */
export const resolveEditActions = ({
  canEditDocument,
  mode,
  isChangeMade,
  isSaving,
  isSavingWithoutRefresh,
  dataDocumentIsFetching,
}: EditActionsState): { visible: boolean; disabled: boolean } => ({
  visible: canEditDocument && mode !== EditMode.HIGHLIGHT,
  disabled: !isChangeMade || isSaving || isSavingWithoutRefresh || dataDocumentIsFetching,
});
