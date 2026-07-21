import { Annotator, EditMode, Occurrence } from "@inkvisitor/annotator/src/lib";
import { IDocument, IResponseEntity } from "@inkvisitor/shared/types";
import { Button, Checkbox, IconWithTooltip, Input } from "components";
import { AttributeButtonGroup, EntitySuggester, EntityTag } from "components/advanced";
import useKeypress from "hooks/useKeyPress";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { IcoSearch } from "Theme/icons";
import { FaAnchor, FaRegArrowAltCircleDown, FaRegArrowAltCircleUp } from "react-icons/fa";
import { FaAnchorCircleCheck, FaExpand } from "react-icons/fa6";
import { LuCaseSensitive, LuRegex, LuWholeWord } from "react-icons/lu";
import { TbReplace } from "react-icons/tb";
import { useTheme } from "styled-components";
import { ANNOTATOR_UNDERSIZED_BREAKPOINT } from "Theme/constants";
import {
  StyledSearchContainer,
  StyledSearchLine,
  StyledSearchResults,
} from "../../../../pages/Main/containers/StatementsListBox/StatementListBoxStyles";
import { useDocumentContentSave } from "../hooks/useDocumentContentSave";
import { AnnotatorFindReplaceModal } from "./AnnotatorFindReplaceModal";
import { StyledCheckboxWrapper, StyledReplaceButtonWrapper } from "./AnnotatorSearchLineStyles";

interface AnnotatorSearchLine {
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  searchOccurences: Occurrence[] | null;
  searchActiveOccurence: number;
  setSearchActiveOccurence: (searchActiveOccurence: number) => void;
  isSearchAllowed: boolean;
  annotatorWidthTooNarrow: boolean;
  contentWidth: number;
  showStatementList: boolean;
  annotator: Annotator | null;
  documentId?: string;
  dataDocument?: IDocument;
  currentAnchorExist: boolean;
  setEntityToAnchor: React.Dispatch<React.SetStateAction<IResponseEntity | null>>;
  entityToAnchor: IResponseEntity | null;
  annotatorMode: EditMode;
  selectedText: string;
  setSearchOccurences: React.Dispatch<React.SetStateAction<Occurrence[] | null>>;
  /** Re-runs the search after the annotator's text changed underneath it. */
  refreshSearch: () => void;
  isRegexMode: boolean;
  setIsRegexMode: React.Dispatch<React.SetStateAction<boolean>>;
  dataDocumentIsFetching?: boolean;
  isExtendToWholeWordMode: boolean;
  setIsExtendToWholeWordMode: React.Dispatch<React.SetStateAction<boolean>>;
  isWholeWordOnlyMode: boolean;
  setIsWholeWordOnlyMode: React.Dispatch<React.SetStateAction<boolean>>;
  isCaseSensitiveMode: boolean;
  setIsCaseSensitiveMode: React.Dispatch<React.SetStateAction<boolean>>;
  // When false, find/navigate stay available but the editing actions
  // (annotate + replace/replace-all) are hidden (read-only document).
  canEdit?: boolean;
  // Lifted to the Annotator: while the panel is open this row unmounts, and the
  // canvas grows into the space it leaves.
  isFindReplaceOpen: boolean;
  setIsFindReplaceOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
export const AnnotatorSearchLine: React.FC<AnnotatorSearchLine> = ({
  searchTerm,
  setSearchTerm,
  searchOccurences,
  searchActiveOccurence,
  isSearchAllowed,
  annotatorWidthTooNarrow,
  contentWidth,
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
  refreshSearch,
  isRegexMode,
  setIsRegexMode,
  dataDocumentIsFetching,
  isExtendToWholeWordMode,
  setIsExtendToWholeWordMode,
  isWholeWordOnlyMode,
  setIsWholeWordOnlyMode,
  isCaseSensitiveMode,
  setIsCaseSensitiveMode,
  canEdit = true,
  isFindReplaceOpen,
  setIsFindReplaceOpen,
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
    true,
  );

  // F3 goes to the next occurrence
  useKeypress(
    "F3",
    () => {
      if (isSearchAllowed) {
        goToNextOccurence();
      }
    },
    [isSearchAllowed],
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
    true,
  );

  // Highlight mode has no replace flow — close the panel when the user switches.
  useEffect(() => {
    if (annotatorMode === EditMode.HIGHLIGHT) {
      setIsFindReplaceOpen(false);
    }
  }, [annotatorMode]);

  // The panel borrows searchInputRef for its own find field while it is open;
  // on close the ref points back at the row's input, which takes focus so the
  // caret does not end up on the body.
  const wasFindReplaceOpen = useRef(isFindReplaceOpen);
  useEffect(() => {
    if (wasFindReplaceOpen.current && !isFindReplaceOpen) {
      searchInputRef.current?.focus();
    }
    wasFindReplaceOpen.current = isFindReplaceOpen;
  }, [isFindReplaceOpen]);

  const replaceSection = useMemo<boolean>(() => {
    return annotatorMode !== EditMode.HIGHLIGHT;
  }, [annotatorMode]);

  const isUndersized = useMemo(() => {
    return contentWidth < ANNOTATOR_UNDERSIZED_BREAKPOINT;
  }, [contentWidth]);

  const saveDocumentContent = useDocumentContentSave({
    annotator,
    documentId,
    dataDocument,
  });

  const goToNextOccurence = () => {
    if (searchOccurences === null) return;
    const nextOccurence = (searchActiveOccurence + 1) % searchOccurences.length;
    setSearchActiveOccurence(nextOccurence);
  };

  const goToPreviousOccurence = () => {
    if (searchOccurences === null) return;
    const previousOccurence =
      (searchActiveOccurence - 1 + searchOccurences.length) % searchOccurences.length;
    setSearchActiveOccurence(previousOccurence);
  };

  const hasResults = useMemo<boolean>(() => {
    return searchOccurences !== null && searchOccurences.length > 0;
  }, [searchOccurences]);

  // The panel takes the row's place: the search line unmounts so the annotator
  // canvas can claim its height.
  if (isFindReplaceOpen) {
    return (
      <AnnotatorFindReplaceModal
        onClose={() => setIsFindReplaceOpen(false)}
        annotator={annotator}
        documentId={documentId}
        dataDocument={dataDocument}
        dataDocumentIsFetching={dataDocumentIsFetching}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        findInputRef={searchInputRef}
        searchOccurences={searchOccurences}
        setSearchOccurences={setSearchOccurences}
        refreshSearch={refreshSearch}
        searchActiveOccurence={searchActiveOccurence}
        setSearchActiveOccurence={setSearchActiveOccurence}
        goToNextOccurence={goToNextOccurence}
        goToPreviousOccurence={goToPreviousOccurence}
        isCaseSensitiveMode={isCaseSensitiveMode}
        setIsCaseSensitiveMode={setIsCaseSensitiveMode}
        isWholeWordOnlyMode={isWholeWordOnlyMode}
        setIsWholeWordOnlyMode={setIsWholeWordOnlyMode}
        isRegexMode={isRegexMode}
        setIsRegexMode={setIsRegexMode}
      />
    );
  }

  return (
    <StyledSearchLine $marginLeft={showStatementList}>
      {isSearchAllowed && (
        <>
          <StyledSearchContainer>
            <Input
              value={searchTerm}
              onChangeFn={(newText: string) => {
                setSearchTerm(newText);
              }}
              changeOnType
              clearable={!annotatorWidthTooNarrow}
              width={annotatorWidthTooNarrow ? 200 : 230}
              minWidth={140}
              inputRef={searchInputRef}
              roundCorners
              icon={
                <IconWithTooltip
                  icon={<IcoSearch />}
                  tooltipLabel="ctrl+f to search"
                  tooltipPosition="top"
                  color="inherit"
                />
              }
              placeholder="search"
              rightContent={
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
              }
            />

            {searchOccurences !== null ? (
              <StyledSearchResults $annotatorWidthTooNarrow={annotatorWidthTooNarrow}>
                {searchOccurences.length === 0 ? (
                  <div style={{ marginLeft: "0.2rem" }}>no results</div>
                ) : (
                  <>
                    <div style={{ display: "flex" }}>
                      {searchActiveOccurence + 1} of {searchOccurences.length}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <IconWithTooltip
                        icon={
                          <FaRegArrowAltCircleUp
                            size={15}
                            color={theme.color.info}
                            style={{ cursor: "pointer" }}
                            onClick={goToPreviousOccurence}
                          />
                        }
                        tooltipLabel="previous occurence"
                        tooltipText="(Shift + F3)"
                        tooltipPosition="top"
                      />
                      <IconWithTooltip
                        icon={
                          <FaRegArrowAltCircleDown
                            size={15}
                            color={theme.color.info}
                            style={{ cursor: "pointer" }}
                            onClick={goToNextOccurence}
                          />
                        }
                        tooltipLabel="next occurence"
                        tooltipText="(F3)"
                        tooltipPosition="top"
                      />
                    </div>
                  </>
                )}
              </StyledSearchResults>
            ) : (
              <div style={{ width: "4rem" }} />
            )}
          </StyledSearchContainer>

          {canEdit && (
            <>
              {/* {annotatorWidthTooNarrow ? (
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
              )} */}

              {!replaceSection ? (
                <>
                  {currentAnchorExist ? (
                    <IconWithTooltip
                      icon={<FaAnchorCircleCheck size={16} color={theme.color.info} />}
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
                          saveDocumentContent("Anchor saved");
                          goToNextOccurence();
                        }
                      }}
                      disabled={!hasResults || !entityToAnchor || selectedText.length === 0}
                    />
                  )}
                  {!entityToAnchor ? (
                    <EntitySuggester
                      placeholder={isUndersized ? "entity" : "select entity"}
                      onPicked={(entity) => {
                        setEntityToAnchor(entity);
                      }}
                      inputWidth={isUndersized ? 50 : annotatorWidthTooNarrow ? 70 : 100}
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
                <StyledReplaceButtonWrapper>
                  <Button
                    label="replace"
                    icon={<TbReplace size={14} />}
                    color="info"
                    onClick={() => setIsFindReplaceOpen(true)}
                    tooltipLabel="open find & replace"
                  />
                </StyledReplaceButtonWrapper>
              )}
            </>
          )}
        </>
      )}
    </StyledSearchLine>
  );
};
