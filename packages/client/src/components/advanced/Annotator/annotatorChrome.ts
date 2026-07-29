import { EditMode } from "@inkvisitor/annotator/src/lib";

/** Which floating search surface is mounted. At most one at a time. */
export enum FindPanel {
  None = "none",
  Bar = "bar",
  SequentialAnchor = "sequential-anchor",
  FindReplace = "find-replace",
}

/**
 * Search is two steps: the bar finds matches in every mode, and the second step
 * acts on them — sequential anchoring in highlight mode, find and replace in the
 * text-editing ones. So the first flag says whether search is open at all and
 * the second how far in the user has gone; the mode only picks which second step
 * they get. Both flags survive a mode switch, which is what lets a user leave
 * anchoring, edit the XML and come back mid-batch.
 */
export const resolveFindPanel = (
  mode: EditMode,
  isFindOpen: boolean,
  isSecondStepOpen: boolean,
): FindPanel => {
  if (!isFindOpen) {
    return FindPanel.None;
  }
  if (!isSecondStepOpen) {
    return FindPanel.Bar;
  }
  return mode === EditMode.HIGHLIGHT ? FindPanel.SequentialAnchor : FindPanel.FindReplace;
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
