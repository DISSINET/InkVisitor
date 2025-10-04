import { Annotator, EditMode } from "@inkvisitor/annotator/src/lib";
import { IDocument, IResponseEntity } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, IconWithTooltip, Input, Checkbox } from "components";
import {
  AttributeButtonGroup,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import React, { useMemo, useState } from "react";
import { BiSearch } from "react-icons/bi";
import {
  FaAnchor,
  FaRegArrowAltCircleDown,
  FaRegArrowAltCircleUp,
} from "react-icons/fa";
import { FaAnchorCircleCheck } from "react-icons/fa6";
import { LuReplace, LuReplaceAll } from "react-icons/lu";
import { TbReplace } from "react-icons/tb";
import { toast } from "react-toastify";
import { useTheme } from "styled-components";
import {
  StyledSearchContainer,
  StyledSearchIcon,
  StyledSearchLine,
  StyledSearchResults,
} from "../StatementListBoxStyles";

interface StatementListSearchLine {
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
  annotatorWidthTooSmall: boolean;
  showStatementList: boolean;
  annotator?: Annotator;
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
}
export const StatementListSearchLine: React.FC<StatementListSearchLine> = ({
  searchTerm,
  setSearchTerm,
  searchOccurences,
  searchActiveOccurence,
  isSearchAllowed,
  annotatorWidthTooSmall,
  setSearchActiveOccurence,
  showStatementList,
  annotator,
  documentId,
  dataDocument,

  currentAnchorExist,
  setEntityToAnchor,
  entityToAnchor,
  annotatorMode,
  selectedText,
  setSearchOccurences,
  isRegexMode,
  setIsRegexMode,
}) => {
  const theme = useTheme();

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
      toast.info(data.successMessage || "Anchor saved");
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
    annotator?.onReplaceText(replaceWith);

    // Store the current search state before saving
    const currentSearchActiveOccurence = searchActiveOccurence;
    if (searchOccurences === null) return;
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
    handleSaveNewContent("occurrence replaced");
  };
  return (
    <StyledSearchLine $marginLeft={showStatementList}>
      {isSearchAllowed && (
        <>
          <StyledSearchContainer>
            <StyledSearchIcon>
              <BiSearch color={theme.color.info} />
            </StyledSearchIcon>

            <Input
              value={searchTerm}
              onChangeFn={(newText: string) => {
                setSearchTerm(newText);
              }}
              changeOnType
              width={annotatorWidthTooSmall ? 100 : 130}
              minWidth={50}
              clearable
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginLeft: "0.5rem",
              }}
            >
              <Checkbox
                value={isRegexMode}
                onChangeFn={(checked: boolean) => setIsRegexMode(checked)}
                label=".*"
                tooltipLabel="Enable regex mode"
              />
            </div>

            {searchOccurences !== null && (
              <StyledSearchResults
                $annotatorWidthTooSmall={annotatorWidthTooSmall}
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

          {annotatorWidthTooSmall ? (
            <div style={{ width: "1rem" }}></div>
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
                  // shortIcon: <FaPlus />,
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
                      handleSaveNewContent();
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
                  inputWidth={annotatorWidthTooSmall ? 70 : 100}
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
                width={annotatorWidthTooSmall ? 100 : 130}
                minWidth={50}
                clearable
              />
              <Button
                circular
                color="info"
                inverted
                tooltipLabel="replace one occurence"
                noBackground
                icon={<LuReplace size={12} />}
                onClick={replaceOccurence}
                disabled={
                  searchOccurences === null ||
                  searchOccurences.length === 0 ||
                  replaceWith.length === 0
                }
              />
              <Button
                circular
                color="info"
                inverted
                tooltipLabel="replace all occurences"
                noBackground
                icon={<LuReplaceAll size={12} />}
                onClick={() => {
                  if (
                    annotator &&
                    searchOccurences &&
                    searchOccurences.length > 0
                  ) {
                    // Replace all occurrences from last to first to avoid position shifting issues
                    const occurrencesToReplace = [
                      ...searchOccurences,
                    ].reverse();
                    let replacedCount = 0;

                    occurrencesToReplace.forEach((occurrence) => {
                      // Select the occurrence
                      annotator.selectSearchOccurrence(occurrence);

                      // Replace the text
                      annotator.onReplaceText(replaceWith);

                      replacedCount++;
                    });

                    // Clear search occurrences since they're all replaced
                    setSearchOccurences(null);
                    setSearchActiveOccurence(0);

                    // Save the content
                    handleSaveNewContent(
                      `${replacedCount} occurrences replaced`
                    );
                  }
                }}
                disabled={
                  searchOccurences === null ||
                  searchOccurences.length === 0 ||
                  replaceWith.length === 0
                }
              />
            </>
          )}
        </>
      )}
    </StyledSearchLine>
  );
};
