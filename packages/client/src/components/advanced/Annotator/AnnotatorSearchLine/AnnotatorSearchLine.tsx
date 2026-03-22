import { Annotator, EditMode } from "@inkvisitor/annotator/src/lib";
import { IDocument, IResponseEntity } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, Checkbox, IconWithTooltip, Input, Loader } from "components";
import {
  AttributeButtonGroup,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { BiSearch } from "react-icons/bi";
import {
  FaAnchor,
  FaRegArrowAltCircleDown,
  FaRegArrowAltCircleUp,
} from "react-icons/fa";
import { FaAnchorCircleCheck, FaExpand } from "react-icons/fa6";
import {
  LuCaseSensitive,
  LuRegex,
  LuReplace,
  LuReplaceAll,
  LuWholeWord,
} from "react-icons/lu";
import { TbReplace } from "react-icons/tb";
import { toast } from "react-toastify";
import { useTheme } from "styled-components";
import {
  StyledSearchContainer,
  StyledSearchIcon,
  StyledSearchLine,
  StyledSearchResults,
} from "../../../../pages/Main/containers/StatementsListBox/StatementListBoxStyles";
import useKeypress from "hooks/useKeyPress";
import { StyledCheckboxWrapper } from "./AnnotatorSearchLineStyles";

interface AnnotatorSearchLine {
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  searchOccurences:
    | {
        segmentIndex: number;
        lineIndex: number;
        start: number;
        end: number;
      }[]
    | null;
  searchActiveOccurence: number;
  setSearchActiveOccurence: (searchActiveOccurence: number) => void;
  isSearchAllowed: boolean;
  annotatorWidthTooNarrow: boolean;
  showStatementList: boolean;
  annotator: Annotator | null;
  documentId?: string;
  dataDocument?: IDocument;
  currentAnchorExist: boolean;
  setEntityToAnchor: React.Dispatch<
    React.SetStateAction<IResponseEntity | null>
  >;
  entityToAnchor: IResponseEntity | null;
  annotatorMode: EditMode;
  selectedText: string;
  setSearchOccurences: React.Dispatch<
    React.SetStateAction<
      | {
          segmentIndex: number;
          lineIndex: number;
          start: number;
          end: number;
        }[]
      | null
    >
  >;
  isRegexMode: boolean;
  setIsRegexMode: React.Dispatch<React.SetStateAction<boolean>>;
  dataDocumentIsFetching?: boolean;
  isExtendToWholeWordMode: boolean;
  setIsExtendToWholeWordMode: React.Dispatch<React.SetStateAction<boolean>>;
  isWholeWordOnlyMode: boolean;
  setIsWholeWordOnlyMode: React.Dispatch<React.SetStateAction<boolean>>;
  isCaseSensitiveMode: boolean;
  setIsCaseSensitiveMode: React.Dispatch<React.SetStateAction<boolean>>;
}
export const AnnotatorSearchLine: React.FC<AnnotatorSearchLine> = ({
  searchTerm,
  setSearchTerm,
  searchOccurences,
  searchActiveOccurence,
  isSearchAllowed,
  annotatorWidthTooNarrow,
  setSearchActiveOccurence,
  showStatementList,
  annotator,
  documentId = undefined,
  dataDocument,

  currentAnchorExist,
  setEntityToAnchor,
  entityToAnchor,
  annotatorMode,
  selectedText,
  setSearchOccurences,
  isRegexMode,
  setIsRegexMode,
  dataDocumentIsFetching,
  isExtendToWholeWordMode,
  setIsExtendToWholeWordMode,
  isWholeWordOnlyMode,
  setIsWholeWordOnlyMode,
  isCaseSensitiveMode,
  setIsCaseSensitiveMode,
}) => {
  const theme = useTheme();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Cmd+F / Ctrl+F focuses the search input from anywhere on the page
  useKeypress(
    "f",
    () => {
      if (isSearchAllowed) {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    },
    [isSearchAllowed],
    // ctrlKeyCombo is true to allow the focus to work on any page
    true
  );

  // F3 goes to the next occurrence
  useKeypress(
    "F3",
    () => {
      if (isSearchAllowed) {
        goToNextOccurence();
      }
    },
    [isSearchAllowed]
  );

  // Shift + F3 goes to the previous occurrence
  useKeypress(
    "F3",
    () => {
      if (isSearchAllowed) {
        goToPreviousOccurence();
      }
    },
    [isSearchAllowed],
    // ctrl
    false,
    // shift
    true
  );

  const [isReplacingOne, setIsReplacingOne] = useState<boolean>(false);
  const [isReplacingAll, setIsReplacingAll] = useState<boolean>(false);
  const replaceSection = useMemo<boolean>(() => {
    return annotatorMode !== EditMode.HIGHLIGHT;
  }, [annotatorMode]);

  const [replaceWith, setReplaceWith] = useState<string>("");

  const queryClient = useQueryClient();

  const updateDocumentMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      doc: Partial<IDocument>;
      successMessage?: string;
    }) => api.documentUpdate(data.id, data.doc),
    onSuccess: (variables, data) => {
      queryClient.invalidateQueries({ queryKey: ["document"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      if (data.successMessage) {
        toast.info(data.successMessage);
      }
    },
    onSettled: () => {
      setIsReplacingOne(false);
      setIsReplacingAll(false);
    },
  });

  const handleSaveNewContent = (successMessage?: string) => {
    if (annotator && documentId && dataDocument) {
      updateDocumentMutation.mutate({
        id: documentId,
        doc: {
          ...dataDocument,
          content: annotator.text.value,
        },
        successMessage,
      });
    }
  };

  const goToNextOccurence = () => {
    if (searchOccurences === null) return;
    const nextOccurence = (searchActiveOccurence + 1) % searchOccurences.length;
    setSearchActiveOccurence(nextOccurence);
  };

  const goToPreviousOccurence = () => {
    if (searchOccurences === null) return;
    const previousOccurence =
      (searchActiveOccurence - 1 + searchOccurences.length) %
      searchOccurences.length;
    setSearchActiveOccurence(previousOccurence);
  };

  const hasResults = useMemo<boolean>(() => {
    return searchOccurences !== null && searchOccurences.length > 0;
  }, [searchOccurences]);

  const replaceOccurence = () => {
    setIsReplacingOne(true);
    annotator?.onReplaceText(replaceWith);

    // Store the current search state before saving
    const currentSearchActiveOccurence = searchActiveOccurence;
    if (searchOccurences === null) {
      setIsReplacingOne(false);
      return;
    }
    const newOccurrences = searchOccurences.filter(
      (_, index) => index !== searchActiveOccurence
    );

    // Calculate the new active occurrence index
    let newActiveOccurence = currentSearchActiveOccurence;
    if (newOccurrences.length > 0) {
      // If we removed the last occurrence, go to the previous one
      if (currentSearchActiveOccurence >= newOccurrences.length) {
        newActiveOccurence = newOccurrences.length - 1;
      }
      // Otherwise, stay at the same index (which now points to the next occurrence)
    } else {
      // No more occurrences, reset to 0
      newActiveOccurence = 0;
    }

    // Update the search state immediately
    setSearchOccurences(newOccurrences);
    setSearchActiveOccurence(newActiveOccurence);

    // Save the content
    handleSaveNewContent();
  };

  const replaceAllOccurences = () => {
    setIsReplacingAll(true);
    if (annotator && searchOccurences && searchOccurences.length > 0) {
      try {
        // Get the current text content
        const currentText = annotator.text.value;

        // Convert all occurrences to absolute text positions
        // Process from end to start to avoid position shifting issues
        const replacements: Array<{
          startIndex: number;
          endIndex: number;
        }> = [];

        for (const occurrence of searchOccurences) {
          // Validate segment exists
          const segment = annotator.text.segments[occurrence.segmentIndex];
          if (!segment) continue;

          // Convert occurrence to absolute coordinates
          const absLineStart = segment.lineStart + occurrence.lineIndex;
          const absLineEnd = absLineStart;

          // Get segment positions for start and end
          const startSegment = annotator.text.getSegmentPosition(
            absLineStart,
            occurrence.start
          );
          const endSegment = annotator.text.getSegmentPosition(
            absLineEnd,
            occurrence.end
          );

          if (startSegment && endSegment) {
            const startIndex =
              annotator.text.getAbsTextIndexFromPosition(startSegment);
            const endIndex =
              annotator.text.getAbsTextIndexFromPosition(endSegment);

            if (startIndex >= 0 && endIndex >= 0) {
              replacements.push({ startIndex, endIndex });
            }
          }
        }

        // Sort by endIndex descending to process from end to start
        replacements.sort((a, b) => b.endIndex - a.endIndex);

        // Apply all replacements to the text string
        let newText = currentText;
        for (const { startIndex, endIndex } of replacements) {
          if (
            startIndex >= 0 &&
            endIndex >= startIndex &&
            endIndex <= newText.length
          ) {
            newText =
              newText.slice(0, startIndex) +
              replaceWith +
              newText.slice(endIndex);
          }
        }

        // Update the text once with all replacements
        annotator.updateText(newText);

        // Clear search occurrences since they're all replaced
        setSearchOccurences(null);
        setSearchActiveOccurence(0);

        // Clear the selection/highlight
        annotator.clearSelection();

        // Save the content
        handleSaveNewContent(`${replacements.length} occurrences replaced`);
      } catch (error) {
        console.error("Error replacing all occurrences:", error);
        toast.error("Failed to replace all occurrences");
        setIsReplacingAll(false);
      }
    } else {
      setIsReplacingAll(false);
    }
  };

  return (
    <StyledSearchLine $marginLeft={showStatementList}>
      {isSearchAllowed && (
        <>
          <StyledSearchContainer>
            <StyledSearchIcon>
              <IconWithTooltip
                icon={<BiSearch size={18} color={theme.color.info} />}
                tooltipLabel="ctrl + f to search"
                tooltipPosition="left"
              />
            </StyledSearchIcon>

            <Input
              value={searchTerm}
              onChangeFn={(newText: string) => {
                setSearchTerm(newText);
              }}
              changeOnType
              width={annotatorWidthTooNarrow ? 100 : 130}
              minWidth={50}
              inputRef={searchInputRef}
              clearable
            />

            <StyledCheckboxWrapper>
              <Checkbox
                iconOnly
                value={isCaseSensitiveMode}
                onChangeFn={(checked: boolean) => {
                  setIsCaseSensitiveMode(checked);
                }}
                onClickFn={() => {
                  searchInputRef.current?.focus();
                }}
                icon={<LuCaseSensitive size={16} />}
                tooltipLabel="case sensitive mode"
                tooltipPosition="top"
              />
              {annotatorMode === EditMode.HIGHLIGHT && (
                <Checkbox
                  iconOnly
                  value={isExtendToWholeWordMode}
                  onChangeFn={(checked: boolean) => {
                    setIsExtendToWholeWordMode(checked);
                  }}
                  onClickFn={() => {
                    searchInputRef.current?.focus();
                  }}
                  icon={<FaExpand size={12} />}
                  tooltipLabel="extend to whole word(s)"
                  tooltipPosition="top"
                />
              )}

              {annotatorMode !== EditMode.HIGHLIGHT && (
                <Checkbox
                  iconOnly
                  value={isWholeWordOnlyMode}
                  onChangeFn={(checked: boolean) => {
                    setIsWholeWordOnlyMode(checked);
                  }}
                  onClickFn={() => {
                    searchInputRef.current?.focus();
                  }}
                  icon={<LuWholeWord size={16} />}
                  tooltipLabel="whole word only"
                  tooltipPosition="top"
                />
              )}

              <Checkbox
                iconOnly
                value={isRegexMode}
                onChangeFn={(checked: boolean) => {
                  setIsRegexMode(checked);
                }}
                onClickFn={() => {
                  searchInputRef.current?.focus();
                }}
                icon={<LuRegex size={14} />}
                tooltipLabel="regex mode"
                tooltipPosition="top"
              />
            </StyledCheckboxWrapper>

            {searchOccurences !== null && (
              <StyledSearchResults
                $annotatorWidthTooNarrow={annotatorWidthTooNarrow}
              >
                {searchOccurences.length === 0 ? (
                  <div style={{ marginLeft: "0.2rem" }}>no results</div>
                ) : (
                  <>
                    <div style={{ display: "flex" }}>
                      {searchActiveOccurence + 1} of {searchOccurences.length}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <FaRegArrowAltCircleUp
                        size={15}
                        color={theme.color.info}
                        style={{ cursor: "pointer" }}
                        title="previous occurence"
                        onClick={goToPreviousOccurence}
                      />
                      <FaRegArrowAltCircleDown
                        size={15}
                        color={theme.color.info}
                        style={{ cursor: "pointer" }}
                        title="next occurence"
                        onClick={goToNextOccurence}
                      />
                    </div>
                  </>
                )}
              </StyledSearchResults>
            )}
          </StyledSearchContainer>

          {annotatorWidthTooNarrow ? (
            searchOccurences === null ? (
              <div style={{ width: "1rem" }} />
            ) : (
              <></>
            )
          ) : (
            <AttributeButtonGroup
              disabled
              options={[
                {
                  longValue: "replace",
                  shortValue: "",
                  onClick: () => {},
                  selected: replaceSection,
                  icon: <TbReplace />,
                },
                {
                  longValue: "annotate",
                  shortValue: "",
                  onClick: () => {},
                  selected: !replaceSection,
                  icon: <FaAnchor />,
                },
              ]}
            />
          )}

          {!replaceSection ? (
            <>
              {currentAnchorExist ? (
                <IconWithTooltip
                  icon={
                    <FaAnchorCircleCheck size={16} color={theme.color.info} />
                  }
                  tooltipLabel="anchor exists"
                />
              ) : (
                <Button
                  tooltipLabel="wrap selection with anchor of a given entity and go to the next one"
                  icon={<FaAnchor />}
                  label="+"
                  color="success"
                  onClick={() => {
                    if (entityToAnchor) {
                      annotator?.addAnchor(entityToAnchor.id);
                      handleSaveNewContent("Anchor saved");
                      goToNextOccurence();
                    }
                  }}
                  disabled={
                    !hasResults || !entityToAnchor || selectedText.length === 0
                  }
                />
              )}
              {!entityToAnchor ? (
                <EntitySuggester
                  placeholder="select entity"
                  onPicked={(entity) => {
                    setEntityToAnchor(entity);
                  }}
                  inputWidth={annotatorWidthTooNarrow ? 70 : 100}
                />
              ) : (
                <EntityTag
                  entity={entityToAnchor}
                  unlinkButton={{
                    onClick: () => setEntityToAnchor(null),
                  }}
                />
              )}
            </>
          ) : (
            <>
              <Input
                placeholder="replace with"
                changeOnType
                value={replaceWith}
                onChangeFn={(value: string) => {
                  setReplaceWith(value);
                }}
                width={annotatorWidthTooNarrow ? 100 : 130}
                minWidth={50}
                clearable
              />
              <div
                style={{
                  position: "relative",
                }}
              >
                <Button
                  shape="circle"
                  color="info"
                  inverted
                  tooltipLabel="replace one occurence"
                  noBackground
                  icon={<LuReplace size={12} />}
                  onClick={replaceOccurence}
                  disabled={
                    searchOccurences === null ||
                    searchOccurences.length === 0 ||
                    replaceWith.length === 0 ||
                    isReplacingOne ||
                    isReplacingAll ||
                    dataDocumentIsFetching
                  }
                />
                <Loader show={isReplacingOne} size={12} noBackground />
              </div>
              <div
                style={{
                  position: "relative",
                }}
              >
                <Button
                  shape="circle"
                  color="info"
                  inverted
                  tooltipLabel="replace all occurences"
                  noBackground
                  icon={<LuReplaceAll size={12} />}
                  onClick={replaceAllOccurences}
                  disabled={
                    searchOccurences === null ||
                    searchOccurences.length === 0 ||
                    replaceWith.length === 0 ||
                    isReplacingOne ||
                    isReplacingAll ||
                    dataDocumentIsFetching
                  }
                />
                <Loader show={isReplacingAll} size={12} noBackground />
              </div>
            </>
          )}
        </>
      )}
    </StyledSearchLine>
  );
};
