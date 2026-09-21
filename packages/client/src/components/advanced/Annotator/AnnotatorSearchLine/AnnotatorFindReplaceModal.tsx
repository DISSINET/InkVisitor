import { Annotator, Occurrence } from "@inkvisitor/annotator/src/lib";
import { IDocument } from "@inkvisitor/shared/types";
import { Button, Checkbox, Input, Loader, Submit } from "components";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { AnnotatorFloatingPanel } from "../AnnotatorFloatingPanel/AnnotatorFloatingPanel";
import { useDocumentContentSave } from "../hooks/useDocumentContentSave";
import {
  StyledFindReplaceButtonWrap,
  StyledFindReplaceFlags,
  StyledFindReplaceFooter,
  StyledFindReplaceResults,
  StyledFindReplaceRow,
  StyledNoResults,
} from "./AnnotatorFindReplaceModalStyles";
import {
  applyReplacements,
  nextOccurenceIndexAfter,
  ReplaceRange,
} from "./replaceUtils";

interface AnnotatorFindReplaceModal {
  onClose: () => void;
  onBack: () => void;
  annotator: Annotator | null;
  documentId?: string;
  dataDocument?: IDocument;
  dataDocumentIsFetching?: boolean;

  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  /** Shared with the search line so Ctrl+F focuses whichever find input is visible. */
  findInputRef: React.RefObject<HTMLInputElement | null>;

  searchOccurences: Occurrence[] | null;
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
  onBack,
  annotator,
  documentId = undefined,
  dataDocument,
  dataDocumentIsFetching,
  searchTerm,
  setSearchTerm,
  findInputRef,
  searchOccurences,
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

  // Focus lands on whichever field the user still has to fill in. Evaluated as
  // the inputs mount, which FloatingPortal defers to its second render pass —
  // the two flags are mutually exclusive, so exactly one input claims focus.
  const focusFindInput = searchTerm.length === 0;

  const saveDocumentContent = useDocumentContentSave({
    annotator,
    documentId,
    dataDocument,
    onSettled: () => {
      setIsReplacingOne(false);
      setIsReplacingAll(false);
    },
  });

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

  /**
   * Absolute index in the searched text where the occurrence starts, -1 when it
   * cannot be resolved.
   */
  const occurenceStartIndex = (occurence: Occurrence): number => {
    if (!annotator) {
      return -1;
    }
    const segment = annotator.text.segments[occurence.segmentIndex];
    if (!segment) {
      return -1;
    }
    const position = annotator.text.getSegmentPosition(
      segment.lineStart + occurence.lineIndex,
      occurence.start,
    );
    return position ? annotator.text.getAbsTextIndexFromPosition(position) : -1;
  };

  /**
   * Index just past the text a replace inserted, held until the searched-again
   * occurrence list arrives a render later. Null while no replace is pending.
   */
  const resumeFromIndexRef = useRef<number | null>(null);

  // Moves the active occurrence past the replacement once the refreshed list is
  // in. A replacement that still matches the term keeps its place in the list,
  // so the index has to be recomputed from positions rather than kept or
  // incremented.
  useEffect(() => {
    const resumeFrom = resumeFromIndexRef.current;
    if (resumeFrom === null || searchOccurences === null) {
      return;
    }
    resumeFromIndexRef.current = null;
    setSearchActiveOccurence(
      nextOccurenceIndexAfter(searchOccurences.map(occurenceStartIndex), resumeFrom),
    );
  }, [searchOccurences]);

  const replaceOccurence = () => {
    if (searchOccurences === null) {
      return;
    }
    const replaced = searchOccurences[searchActiveOccurence];
    const replacedStartIndex = replaced ? occurenceStartIndex(replaced) : -1;

    annotator?.onReplaceText(replaceWith);

    // The replacement can itself match the term, and a length change shifts the
    // coordinates of every occurrence after it, so the list is searched again
    // rather than derived from the old one.
    resumeFromIndexRef.current =
      replacedStartIndex >= 0 ? replacedStartIndex + replaceWith.length : null;
    refreshSearch();

    // the flag tracks a save in flight; onSettled lowers it again
    const saveDispatched = saveDocumentContent();
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
      const saveDispatched = saveDocumentContent(`${ranges.length} occurrences replaced`);
      setIsReplacingAll(saveDispatched);
    } catch (error) {
      console.error("Error replacing all occurrences:", error);
      toast.error("Failed to replace all occurrences");
      setIsReplacingAll(false);
    }
  };

  return (
    <>
      <AnnotatorFloatingPanel
        title="Find & replace"
        onClose={onClose}
        closeTooltipLabel="close find & replace (Esc)"
      onBack={onBack}
      backTooltipLabel="back to search"
      >
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
      </AnnotatorFloatingPanel>

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
