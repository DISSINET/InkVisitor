import { Annotator, EditMode } from "@inkvisitor/annotator/src/lib";
import { IDocument, IResponseEntity } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, IconWithTooltip, Input } from "components";
import {
  AttributeButtonGroup,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import React, { useEffect, useMemo, useState } from "react";
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
  searchOccurences: {
    segmentIndex: number;
    lineIndex: number;
    start: number;
    end: number;
  }[];
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
}) => {
  const theme = useTheme();

  const replaceSection = useMemo<boolean>(() => {
    return annotatorMode !== EditMode.HIGHLIGHT;
  }, [annotatorMode]);

  const [replaceWith, setReplaceWith] = useState<string>("");

  const queryClient = useQueryClient();

  const updateDocumentMutation = useMutation({
    mutationFn: async (data: { id: string; doc: Partial<IDocument> }) =>
      api.documentUpdate(data.id, data.doc),
    onSuccess: (variables, data) => {
      queryClient.invalidateQueries({ queryKey: ["document"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.info("Anchor saved");
    },
  });

  const handleSaveNewContent = () => {
    if (annotator && documentId && dataDocument) {
      updateDocumentMutation.mutate({
        id: documentId,
        doc: {
          ...dataDocument,
          content: annotator.text.value,
        },
      });
    }
  };

  const goToNextOccurence = () => {
    const nextOccurence = (searchActiveOccurence + 1) % searchOccurences.length;
    setSearchActiveOccurence(nextOccurence);
  };

  const goToPreviousOccurence = () => {
    const previousOccurence =
      (searchActiveOccurence - 1 + searchOccurences.length) %
      searchOccurences.length;
    setSearchActiveOccurence(previousOccurence);
  };

  const hasResults = useMemo<boolean>(() => {
    return searchOccurences.length > 0;
  }, [searchOccurences]);

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
                // only set search term if it's longer than 2 characters
                if (newText.length > 2) {
                  setSearchTerm(newText);
                }
              }}
              changeOnType
              width={130}
              minWidth={50}
            />
            {hasResults && (
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
                value={replaceWith}
                onChangeFn={(value: string) => {
                  setReplaceWith(value);
                }}
              />
              <Button
                circular
                color="info"
                inverted
                tooltipLabel="replace one occurence"
                noBackground
                icon={<LuReplace size={12} />}
                onClick={() => {
                  console.log("replace one");
                }}
              />
              <Button
                circular
                color="info"
                inverted
                tooltipLabel="replace all occurences"
                noBackground
                icon={<LuReplaceAll size={12} />}
                onClick={() => {
                  console.log("replace all");
                }}
              />
            </>
          )}
        </>
      )}
    </StyledSearchLine>
  );
};
