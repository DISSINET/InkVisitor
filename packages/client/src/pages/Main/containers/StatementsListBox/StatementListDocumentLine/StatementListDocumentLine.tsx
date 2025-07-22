import { entitiesDict } from "@shared/dictionaries";
import { EntityEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import { Button, Loader } from "components";
import Dropdown, {
  DocumentTitle,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import React from "react";
import { FaHighlighter, FaLongArrowAltRight } from "react-icons/fa";
import { GrDocumentMissing } from "react-icons/gr";
import { TbAnchor, TbAnchorOff } from "react-icons/tb";
import {
  StyledAnnotatorMenuBar,
  StyledDocumentTitleContainer,
  StyledEntityContainer,
  StyledHighlightContainer,
  StyledNoDocumentMessage,
  StyledSearchNavigation,
  StyledDocumentLine,
} from "../StatementListBoxStyles";
import { StyledInfoText } from "../StatementListHeader/StatementListHeaderStyles";

interface StatementListDocumentLine {
  selectedResource: IEntity | false;
  setSelectedResourceId: (id: string | false) => void;
  selectedDocumentIsFetching: boolean;
  selectedDocument: any;
  activeTHasAnchor: boolean;
  annotator?: any;
  territoryId: string;
  resources: IEntity[];
  // is list non empty
  showStatementList: boolean;
  userCanEdit: boolean;
  annotatorWidthTooSmall: boolean;

  // highlight
  contentWidth: number;
  handleHlEntitiesChange: (entities: EntityEnums.Class[]) => void;
  hlEntities: EntityEnums.Class[];
}

const StatementListDocumentLine: React.FC<StatementListDocumentLine> = ({
  selectedResource,
  setSelectedResourceId,
  selectedDocumentIsFetching,
  selectedDocument,
  activeTHasAnchor,
  annotator,
  territoryId,
  resources,
  showStatementList,
  userCanEdit,
  annotatorWidthTooSmall,

  contentWidth,
  handleHlEntitiesChange,
  hlEntities,
}) => {
  return (
    <StyledDocumentLine marginLeft={showStatementList}>
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
              isHidden={!userCanEdit}
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

      {/* Class selector - HIGHLIGHT */}
      {selectedResource !== false && selectedResource?.data?.documentId && (
        <StyledHighlightContainer>
          {/* this condition helps initial render in firefox */}
          {contentWidth > 0 && (
            <>
              <StyledInfoText style={{ textWrap: "nowrap" }}>
                <FaHighlighter />
              </StyledInfoText>
              <Dropdown.Multi.Entity
                options={entitiesDict}
                disableEmpty={true}
                isClearable={true}
                disableAny={true}
                onChange={handleHlEntitiesChange}
                value={hlEntities}
                noOptionsMessage="No entity classes to highlight"
                width={contentWidth / 2.5}
                limitSelectedItems={Math.floor((contentWidth / 2.5 - 145) / 80)}
              />
            </>
          )}
        </StyledHighlightContainer>
      )}
    </StyledDocumentLine>
  );
};

export default StatementListDocumentLine;
