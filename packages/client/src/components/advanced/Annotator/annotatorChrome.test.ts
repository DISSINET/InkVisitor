import { EditMode } from "@inkvisitor/annotator/src/lib";
import { describe, expect, it } from "vitest";
import {
  FindPanel,
  resolveEditActions,
  resolveFindPanel,
  shouldShowSelectionMenu,
} from "./annotatorChrome";

describe("resolveFindPanel", () => {
  it("is closed when find was never opened", () => {
    expect(resolveFindPanel(EditMode.HIGHLIGHT, false, false)).toBe(FindPanel.None);
    expect(resolveFindPanel(EditMode.RAW, false, false)).toBe(FindPanel.None);
  });

  it("opens the bar first in every mode", () => {
    expect(resolveFindPanel(EditMode.HIGHLIGHT, true, false)).toBe(FindPanel.Bar);
    expect(resolveFindPanel(EditMode.SEMI, true, false)).toBe(FindPanel.Bar);
    expect(resolveFindPanel(EditMode.RAW, true, false)).toBe(FindPanel.Bar);
  });

  it("makes the second step sequential anchoring in highlight mode", () => {
    expect(resolveFindPanel(EditMode.HIGHLIGHT, true, true)).toBe(FindPanel.SequentialAnchor);
  });

  it("makes the second step find & replace in the text and xml modes", () => {
    expect(resolveFindPanel(EditMode.SEMI, true, true)).toBe(FindPanel.FindReplace);
    expect(resolveFindPanel(EditMode.RAW, true, true)).toBe(FindPanel.FindReplace);
  });

  it("swaps which second step is shown when the mode changes under it", () => {
    expect(resolveFindPanel(EditMode.RAW, true, true)).toBe(FindPanel.FindReplace);
    expect(resolveFindPanel(EditMode.HIGHLIGHT, true, true)).toBe(FindPanel.SequentialAnchor);
  });
});

describe("shouldShowSelectionMenu", () => {
  const base = {
    mode: EditMode.HIGHLIGHT,
    selectedText: "Donato",
    isSelectingText: false,
    hideSelectionMenu: false,
    hasDocument: true,
    findPanel: FindPanel.None,
  };

  it("shows for a settled selection in highlight mode", () => {
    expect(shouldShowSelectionMenu(base)).toBe(true);
  });

  it("hides outside highlight mode", () => {
    expect(shouldShowSelectionMenu({ ...base, mode: EditMode.RAW })).toBe(false);
    expect(shouldShowSelectionMenu({ ...base, mode: EditMode.SEMI })).toBe(false);
  });

  it("hides with no selection", () => {
    expect(shouldShowSelectionMenu({ ...base, selectedText: "" })).toBe(false);
  });

  it("hides while the pointer is still dragging out a selection", () => {
    expect(shouldShowSelectionMenu({ ...base, isSelectingText: true })).toBe(false);
  });

  it("hides when the host suppresses it", () => {
    expect(shouldShowSelectionMenu({ ...base, hideSelectionMenu: true })).toBe(false);
  });

  it("hides with no document loaded", () => {
    expect(shouldShowSelectionMenu({ ...base, hasDocument: false })).toBe(false);
  });

  it("hides while sequential anchoring is open, which selects each match itself", () => {
    expect(shouldShowSelectionMenu({ ...base, findPanel: FindPanel.SequentialAnchor })).toBe(false);
  });

  it("still shows while only the search bar is open", () => {
    expect(shouldShowSelectionMenu({ ...base, findPanel: FindPanel.Bar })).toBe(true);
  });
});

describe("resolveEditActions", () => {
  const base = {
    canEditDocument: true,
    mode: EditMode.SEMI,
    isChangeMade: true,
    isSaving: false,
    isSavingWithoutRefresh: false,
    dataDocumentIsFetching: false,
  };

  it("is visible and enabled with pending changes in an editable text mode", () => {
    expect(resolveEditActions(base)).toEqual({ visible: true, disabled: false });
  });

  it("is hidden in highlight mode, where content changes are not tracked", () => {
    expect(resolveEditActions({ ...base, mode: EditMode.HIGHLIGHT }).visible).toBe(false);
  });

  it("is hidden for a document the user may not edit", () => {
    expect(resolveEditActions({ ...base, canEditDocument: false }).visible).toBe(false);
  });

  it("stays visible but disabled with nothing to save", () => {
    expect(resolveEditActions({ ...base, isChangeMade: false })).toEqual({
      visible: true,
      disabled: true,
    });
  });

  it("disables while a save is in flight", () => {
    expect(resolveEditActions({ ...base, isSaving: true }).disabled).toBe(true);
    expect(resolveEditActions({ ...base, isSavingWithoutRefresh: true }).disabled).toBe(true);
  });

  it("disables while the document is refetching", () => {
    expect(resolveEditActions({ ...base, dataDocumentIsFetching: true }).disabled).toBe(true);
  });
});
