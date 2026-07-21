import {
  autoUpdate,
  flip,
  FloatingPortal,
  limitShift,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import { Annotator, Occurrence } from "@inkvisitor/annotator/src/lib";
import { IDocument } from "@inkvisitor/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, Checkbox, Input, Loader, Submit } from "components";
import useKeypress from "hooks/useKeyPress";
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { MdDragIndicator } from "react-icons/md";
import { toast } from "react-toastify";
import { ANNOTATOR_MENU_PAGE_PADDING, useAnnotatorMenuDrag } from "../useAnnotatorMenuDrag";
import {
  StyledFindReplaceBody,
  StyledFindReplaceButtonWrap,
  StyledFindReplaceDraggable,
  StyledFindReplaceFloating,
  StyledFindReplaceFlags,
  StyledFindReplaceFooter,
  StyledFindReplaceHeader,
  StyledFindReplaceResults,
  StyledFindReplaceRow,
  StyledFindReplaceTitle,
  StyledNoResults,
} from "./AnnotatorFindReplaceModalStyles";
import { applyReplacements, nextActiveOccurenceIndex, ReplaceRange } from "./replaceUtils";

interface AnnotatorFindReplaceModal {
  onClose: () => void;
  annotator: Annotator | null;
  documentId?: string;
  dataDocument?: IDocument;
  dataDocumentIsFetching?: boolean;

  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  /** Shared with the search line so Ctrl+F focuses whichever find input is visible. */
  findInputRef: React.RefObject<HTMLInputElement | null>;

  searchOccurences: Occurrence[] | null;
  setSearchOccurences: React.Dispatch<React.SetStateAction<Occurrence[] | null>>;
  /** Re-runs the search after the annotator's text changed underneath it. */
  refreshSearch: () => void;
  searchActiveOccurence: number;
  setSearchActiveOccurence: (searchActiveOccurence: number) => void;
  goToNextOccurence: () => void;
  goToPreviousOccurence: () => void;

  isCaseSensitiveMode: boolean;
  setIsCaseSensitiveMode: React.Dispatch<React.SetStateAction<boolean>>;
  isWholeWordOnlyMode: boolean;
  setIsWholeWordOnlyMode: React.Dispatch<React.SetStateAction<boolean>>;
  isRegexMode: boolean;
  setIsRegexMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AnnotatorFindReplaceModal: React.FC<AnnotatorFindReplaceModal> = ({
  onClose,
  annotator,
  documentId = undefined,
  dataDocument,
  dataDocumentIsFetching,
  searchTerm,
  setSearchTerm,
  findInputRef,
  searchOccurences,
  setSearchOccurences,
  refreshSearch,
  searchActiveOccurence,
  setSearchActiveOccurence,
  goToNextOccurence,
  goToPreviousOccurence,
  isCaseSensitiveMode,
  setIsCaseSensitiveMode,
  isWholeWordOnlyMode,
  setIsWholeWordOnlyMode,
  isRegexMode,
  setIsRegexMode,
}) => {
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  const [replaceWith, setReplaceWith] = useState<string>("");
  const [isReplacingOne, setIsReplacingOne] = useState<boolean>(false);
  const [isReplacingAll, setIsReplacingAll] = useState<boolean>(false);
  const [showReplaceAllSubmit, setShowReplaceAllSubmit] = useState<boolean>(false);

  const { dragHandleProps, draggableRef, dragOffset } = useAnnotatorMenuDrag();

  // Opens centered over the page, like the annotator selection menu — the user
  // drags it out of the way from there.
  const middleware = useMemo(() => {
    if (typeof document === "undefined") return [];
    const page = document.getElementById("page");
    const centerOnPoint = offset(({ rects }) => ({
      mainAxis: -(rects.floating.height || 0) / 2,
    }));
    if (!page) return [centerOnPoint];
    return [
      centerOnPoint,
      flip({
        boundary: page,
        padding: ANNOTATOR_MENU_PAGE_PADDING,
      }),
      shift({
        boundary: page,
        padding: ANNOTATOR_MENU_PAGE_PADDING,
        crossAxis: true,
        limiter: limitShift(),
      }),
    ];
  }, []);

  const { refs, floatingStyles } = useFloating({
    open: true,
    placement: "bottom",
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware,
  });

  useLayoutEffect(() => {
    const page = document.getElementById("page");
    if (!page) return;
    refs.setPositionReference({
      getBoundingClientRect() {
        const r = page.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        return new DOMRect(cx, cy, 0, 0);
      },
      contextElement: page,
    });
  }, []);

  // Focus lands on whichever field the user still has to fill in. Evaluated as
  // the inputs mount, which FloatingPortal defers to its second render pass —
  // the two flags are mutually exclusive, so exactly one input claims focus.
  const focusFindInput = searchTerm.length === 0;

  useKeypress("Escape", onClose);

  const queryClient = useQueryClient();

  const updateDocumentMutation = useMutation({
    mutationFn: async (data: { id: string; doc: Partial<IDocument>; successMessage?: string }) =>
      api.documentUpdate(data.id, data.doc),
    onSuccess: (variables, data) => {
      queryClient.invalidateQueries({ queryKey: ["document"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      if (data.successMessage) {
        toast.info(data.successMessage);
      }
    },
    onError: () => {
      toast.error("Failed to save document changes");
    },
    onSettled: () => {
      setIsReplacingOne(false);
      setIsReplacingAll(false);
    },
  });

  /**
   * Saves the annotator's current text. Returns whether the mutation was
   * dispatched: only then does onSettled run, so a caller that raised an
   * in-progress flag must clear it itself when this returns false.
   */
  const handleSaveNewContent = (successMessage?: string): boolean => {
    if (!annotator || !documentId || !dataDocument) {
      return false;
    }
    updateDocumentMutation.mutate({
      id: documentId,
      doc: {
        ...dataDocument,
        content: annotator.text.value,
      },
      successMessage,
    });
    return true;
  };

  const occurencesCount = searchOccurences?.length ?? 0;

  const actionsDisabled = useMemo(
    () =>
      occurencesCount === 0 ||
      replaceWith.length === 0 ||
      isReplacingOne ||
      isReplacingAll ||
      Boolean(dataDocumentIsFetching),
    [occurencesCount, replaceWith, isReplacingOne, isReplacingAll, dataDocumentIsFetching],
  );

  const replaceOccurence = () => {
    annotator?.onReplaceText(replaceWith);

    if (searchOccurences === null) {
      return;
    }
    const newOccurrences = searchOccurences.filter((_, index) => index !== searchActiveOccurence);

    setSearchOccurences(newOccurrences);
    setSearchActiveOccurence(
      nextActiveOccurenceIndex(searchActiveOccurence, newOccurrences.length),
    );

    // the flag tracks a save in flight; onSettled lowers it again
    const saveDispatched = handleSaveNewContent();
    setIsReplacingOne(saveDispatched);
  };

  const replaceAllOccurences = () => {
    setShowReplaceAllSubmit(false);
    if (!annotator || !searchOccurences || searchOccurences.length === 0) {
      return;
    }

    try {
      const currentText = annotator.text.value;

      // Convert every occurrence to an absolute character range in the text.
      const ranges: ReplaceRange[] = [];
      for (const occurrence of searchOccurences) {
        const segment = annotator.text.segments[occurrence.segmentIndex];
        if (!segment) continue;

        const absLineStart = segment.lineStart + occurrence.lineIndex;
        const absLineEnd = segment.lineStart + occurrence.endLineIndex;

        const startSegment = annotator.text.getSegmentPosition(absLineStart, occurrence.start);
        const endSegment = annotator.text.getSegmentPosition(absLineEnd, occurrence.end);

        if (startSegment && endSegment) {
          const startIndex = annotator.text.getAbsTextIndexFromPosition(startSegment);
          const endIndex = annotator.text.getAbsTextIndexFromPosition(endSegment);

          if (startIndex >= 0 && endIndex >= 0) {
            ranges.push({ startIndex, endIndex });
          }
        }
      }

      annotator.updateText(applyReplacements(currentText, ranges, replaceWith));

      // The replacement can itself contain the term, so the count is searched
      // again rather than assumed to be zero.
      setSearchActiveOccurence(0);
      annotator.clearSelection();
      refreshSearch();

      // the flag tracks a save in flight; onSettled lowers it again
      const saveDispatched = handleSaveNewContent(`${ranges.length} occurrences replaced`);
      setIsReplacingAll(saveDispatched);
    } catch (error) {
      console.error("Error replacing all occurrences:", error);
      toast.error("Failed to replace all occurrences");
      setIsReplacingAll(false);
    }
  };

  return (
    <>
      <FloatingPortal id="page">
        <StyledFindReplaceFloating
          ref={(node) => {
            refs.setFloating(node);
          }}
          style={floatingStyles}
        >
          <StyledFindReplaceDraggable
            ref={draggableRef}
            style={{
              transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
            }}
          >
            <StyledFindReplaceHeader>
              {/* Drag lives on the title only — the handle's onPointerDown
                  preventDefault()s, which would swallow clicks on the close
                  button if it sat inside the draggable area. */}
              <StyledFindReplaceTitle {...dragHandleProps}>
                <MdDragIndicator size={16} />
                Find & replace
              </StyledFindReplaceTitle>
              <Button
                icon={<FaTimes size={12} />}
                color="primary"
                inverted
                noBorder
                noBackground
                onClick={onClose}
                tooltipLabel="close find & replace (Esc)"
              />
            </StyledFindReplaceHeader>

            <StyledFindReplaceBody>
              <StyledFindReplaceRow>
                <Input
                  value={searchTerm}
                  onChangeFn={(newText: string) => setSearchTerm(newText)}
                  onEnterPressFn={goToNextOccurence}
                  onEscapePressFn={onClose}
                  changeOnType
                  clearable
                  autoFocus={focusFindInput}
                  width="full"
                  inputRef={findInputRef}
                  placeholder="Find"
                  rightContent={
                    <StyledFindReplaceResults>
                      {searchOccurences === null ? (
                        ""
                      ) : occurencesCount === 0 ? (
                        <StyledNoResults>no results</StyledNoResults>
                      ) : (
                        `${searchActiveOccurence + 1} of ${occurencesCount}`
                      )}
                    </StyledFindReplaceResults>
                  }
                />
              </StyledFindReplaceRow>

              <StyledFindReplaceRow>
                <Input
                  value={replaceWith}
                  onChangeFn={(value: string) => setReplaceWith(value)}
                  onEnterPressFn={() => {
                    if (!actionsDisabled) {
                      replaceOccurence();
                    }
                  }}
                  onEscapePressFn={onClose}
                  changeOnType
                  clearable
                  autoFocus={!focusFindInput}
                  width="full"
                  inputRef={replaceInputRef}
                  placeholder="Replace with"
                />
              </StyledFindReplaceRow>

              <StyledFindReplaceFlags>
                <Checkbox
                  label="Match case"
                  value={isCaseSensitiveMode}
                  onChangeFn={(checked: boolean) => setIsCaseSensitiveMode(checked)}
                  size={13}
                />
                <Checkbox
                  label="Whole word only"
                  value={isWholeWordOnlyMode}
                  onChangeFn={(checked: boolean) => setIsWholeWordOnlyMode(checked)}
                  size={13}
                />
                <Checkbox
                  label="Use regular expressions"
                  value={isRegexMode}
                  onChangeFn={(checked: boolean) => setIsRegexMode(checked)}
                  size={13}
                />
              </StyledFindReplaceFlags>

              <StyledFindReplaceFooter>
                <Button
                  label="Previous"
                  color="info"
                  inverted
                  tooltipLabel="previous occurence"
                  tooltipContent={<p>(Shift + F3)</p>}
                  onClick={goToPreviousOccurence}
                  disabled={occurencesCount === 0}
                />
                <Button
                  label="Next"
                  color="info"
                  inverted
                  tooltipLabel="next occurence"
                  tooltipContent={<p>(F3)</p>}
                  onClick={goToNextOccurence}
                  disabled={occurencesCount === 0}
                />
                <StyledFindReplaceButtonWrap>
                  <Button
                    label="Replace"
                    color="info"
                    tooltipLabel="replace the current occurence"
                    onClick={replaceOccurence}
                    disabled={actionsDisabled}
                  />
                  <Loader show={isReplacingOne} size={12} noBackground />
                </StyledFindReplaceButtonWrap>
                <StyledFindReplaceButtonWrap>
                  <Button
                    label="Replace all"
                    color="danger"
                    tooltipLabel="replace every occurence in the document"
                    onClick={() => setShowReplaceAllSubmit(true)}
                    disabled={actionsDisabled}
                  />
                  <Loader show={isReplacingAll} size={12} noBackground />
                </StyledFindReplaceButtonWrap>
              </StyledFindReplaceFooter>
            </StyledFindReplaceBody>
          </StyledFindReplaceDraggable>
        </StyledFindReplaceFloating>
      </FloatingPortal>

      <Submit
        title="Replace all"
        text={`Replace all ${occurencesCount} occurrences of "${searchTerm}" with "${replaceWith}"? This cannot be undone.`}
        show={showReplaceAllSubmit}
        onSubmit={replaceAllOccurences}
        onCancel={() => setShowReplaceAllSubmit(false)}
        submitLabel="Replace all"
        loading={isReplacingAll}
      />
    </>
  );
};
