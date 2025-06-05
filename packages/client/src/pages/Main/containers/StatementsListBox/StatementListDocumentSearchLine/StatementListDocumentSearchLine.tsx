import { EntityEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import { Button, Input, Loader } from "components";
import { DocumentTitle, EntitySuggester, EntityTag } from "components/advanced";
import React, { useContext } from "react";
import { BiSearch } from "react-icons/bi";
import {
  FaLongArrowAltRight,
  FaRegArrowAltCircleDown,
  FaRegArrowAltCircleUp,
} from "react-icons/fa";
import { GrDocumentMissing } from "react-icons/gr";
import { TbAnchor, TbAnchorOff } from "react-icons/tb";
import { ThemeContext } from "styled-components";
import { COLLAPSED_TABLE_WIDTH } from "Theme/constants";
import {
  StyledAnnotatorMenuBar,
  StyledDocumentSearchLine,
  StyledDocumentTitleContainer,
  StyledEntityContainer,
  StyledNoDocumentMessage,
  StyledSearchContainer,
  StyledSearchIcon,
  StyledSearchNavigation,
  StyledSearchResults,
} from "../StatementListBoxStyles";

interface StatementListDocumentSearchLine {
  statements: any[];
  selectedResource: IEntity | false;
  setSelectedResourceId: (id: string | false) => void;
  selectedDocumentIsFetching: boolean;
  selectedDocument: any;
  activeTHasAnchor: boolean;
  annotator?: any;
  territoryId: string;
  isSearchAllowed: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSearchTermValid: boolean;
  hasNoSearchResults: boolean;
  searchActiveOccurence: number;
  searchOccurences: any[];
  setSearchActiveOccurence: (index: number) => void;
  resources: IEntity[];
  // is list non empty
  showStatementList: boolean;
  userCanEdit: boolean;
  annotatorWidthTooSmall: boolean;
}

const StatementListDocumentSearchLine: React.FC<
  StatementListDocumentSearchLine
> = ({
  statements,
  selectedResource,
  setSelectedResourceId,
  selectedDocumentIsFetching,
  selectedDocument,
  activeTHasAnchor,
  annotator,
  territoryId,
  isSearchAllowed,
  searchTerm,
  setSearchTerm,
  isSearchTermValid,
  hasNoSearchResults,
  searchActiveOccurence,
  searchOccurences,
  setSearchActiveOccurence,
  resources,
  showStatementList,
  userCanEdit,
  annotatorWidthTooSmall,
}) => {
  const themeContext = useContext(ThemeContext);

  return (
    <StyledDocumentSearchLine
      style={{
        marginLeft: showStatementList ? `-${COLLAPSED_TABLE_WIDTH}px` : "0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <StyledEntityContainer>
          {!selectedResource && (
            <EntitySuggester
              categoryTypes={[EntityEnums.Class.Resource]}
              preSuggestions={resources}
              onPicked={(entity) => {
                setSelectedResourceId(entity.id);
              }}
              disabled={!userCanEdit}
            />
          )}
          {selectedResource && (
            <div
              style={{
                display: "flex",
                maxWidth: annotatorWidthTooSmall ? "9rem" : "10rem",
              }}
            >
              <EntityTag
                fullWidth
                entity={selectedResource}
                unlinkButton={{
                  onClick: () => {
                    setSelectedResourceId(false);
                  },
                  tooltipLabel: "use different resource",
                }}
              />
            </div>
          )}
        </StyledEntityContainer>

        {selectedDocumentIsFetching && <Loader />}

        {!selectedDocumentIsFetching && selectedDocument && (
          <StyledDocumentTitleContainer
            style={{
              maxWidth: annotatorWidthTooSmall ? "10rem" : "12rem",
            }}
          >
            <DocumentTitle title={selectedDocument.title} />
          </StyledDocumentTitleContainer>
        )}

        {!selectedDocumentIsFetching &&
          selectedResource !== false &&
          selectedResource.data.documentId === undefined && (
            <StyledNoDocumentMessage>
              <GrDocumentMissing />
              <i>This Resource does not have any document</i>
            </StyledNoDocumentMessage>
          )}

        {selectedResource !== false && selectedResource?.data?.documentId && (
          <StyledAnnotatorMenuBar>
            {activeTHasAnchor ? (
              <Button
                label=""
                iconRight={
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <TbAnchor />
                    <FaLongArrowAltRight />
                  </div>
                }
                tooltipLabel="locate anchor"
                inverted
                onClick={() => {
                  annotator?.scrollToAnchor(territoryId);
                }}
                color="warning"
              />
            ) : (
              <StyledSearchNavigation>
                <TbAnchorOff title="no anchor for T" />
              </StyledSearchNavigation>
            )}
          </StyledAnnotatorMenuBar>
        )}
      </div>

      {isSearchAllowed && (
        <StyledSearchContainer>
          <StyledSearchIcon>
            <BiSearch color={themeContext?.color.info} />
          </StyledSearchIcon>
          <Input
            value={searchTerm}
            onChangeFn={(newText: string) => {
              setSearchTerm(newText);
            }}
            changeOnType
            width={130}
            minWidth={50}
          />

          {isSearchTermValid && (
            <StyledSearchResults
              $annotatorWidthTooSmall={annotatorWidthTooSmall}
            >
              {hasNoSearchResults ? (
                <div style={{ marginLeft: "0.2rem" }}>no results</div>
              ) : (
                <>
                  <div style={{ display: "flex" }}>
                    {searchActiveOccurence + 1} of {searchOccurences.length}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <FaRegArrowAltCircleUp
                      size={15}
                      color={themeContext?.color.info}
                      style={{ cursor: "pointer" }}
                      title="previous occurence"
                      onClick={() => {
                        const previousOccurence =
                          (searchActiveOccurence -
                            1 +
                            searchOccurences.length) %
                          searchOccurences.length;
                        setSearchActiveOccurence(previousOccurence);
                      }}
                    />
                    <FaRegArrowAltCircleDown
                      size={15}
                      color={themeContext?.color.info}
                      style={{ cursor: "pointer" }}
                      title="next occurence"
                      onClick={() => {
                        const nextOccurence =
                          (searchActiveOccurence + 1) % searchOccurences.length;
                        setSearchActiveOccurence(nextOccurence);
                      }}
                    />
                  </div>
                </>
              )}
            </StyledSearchResults>
          )}
        </StyledSearchContainer>
      )}
    </StyledDocumentSearchLine>
  );
};

export default StatementListDocumentSearchLine;
