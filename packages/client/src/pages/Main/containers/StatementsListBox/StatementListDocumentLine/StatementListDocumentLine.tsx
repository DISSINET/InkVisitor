import { entitiesDict } from "@inkvisitor/shared/dictionaries";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IDocument, IEntity } from "@inkvisitor/shared/types";
import { Button, IconWithTooltip, Loader } from "components";
import Dropdown, {
  DocumentModalExport,
  DocumentTitle,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import React, { useCallback, useState } from "react";
import { FaDownload, FaHighlighter, FaLongArrowAltRight } from "react-icons/fa";
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
import { toast } from "react-toastify";

interface StatementListDocumentLine {
  selectedResource: IEntity | false;
  setSelectedResourceId: (id: string | false) => void;
  selectedDocumentIsFetching: boolean;
  selectedDocument?: IDocument;
  activeTHasAnchor: boolean;
  annotator?: any;
  territoryId: string;
  resources: IEntity[];
  // is list non empty
  showStatementList: boolean;
  userCanEdit: boolean;
  annotatorWidthTooNarrow: boolean;

  // highlight
  contentWidth: number;
  hlEntities: EntityEnums.Class[];
  setHlEntities: React.Dispatch<React.SetStateAction<EntityEnums.Class[]>>;
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
  annotatorWidthTooNarrow,

  contentWidth,

  hlEntities,
  setHlEntities,
}) => {
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  return (
    <>
      <StyledDocumentLine $marginLeft={showStatementList}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <StyledEntityContainer>
            {!selectedResource && (
              <EntitySuggester
                placeholder="select resource"
                categoryTypes={[EntityEnums.Class.Resource]}
                preSuggestions={resources}
                onPicked={(entity) => {
                  if (resources.some((r) => r.id === entity.id)) {
                    setSelectedResourceId(entity.id);
                  } else {
                    toast.warning("Resource does not have a document");
                  }
                }}
                isHidden={!userCanEdit}
              />
            )}
            {selectedResource && (
              <div
                style={{
                  display: "flex",
                  maxWidth: annotatorWidthTooNarrow ? "10rem" : "15.5rem",
                }}
              >
                <EntityTag
                  fullWidth
                  entity={selectedResource}
                  button={
                    selectedDocument && (
                      <Button
                        inverted
                        color="info"
                        icon={<FaDownload size={11} />}
                        onClick={() => {
                          setShowExportModal(true);
                        }}
                        tooltipLabel="export document"
                        tooltipPosition="top"
                      />
                    )
                  }
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

          {/* {selectedDocument && (
            <Button
              inverted
              color="info"
              icon={<FaDownload size={11} />}
              onClick={() => {
                setShowExportModal(true);
              }}
              tooltipLabel="export document"
              tooltipPosition="top"
            />
          )} */}

          <StyledDocumentTitleContainer
            style={{
              maxWidth: annotatorWidthTooNarrow ? "9.5rem" : "14.5rem",
              minWidth: "2rem",
            }}
          >
            {selectedDocument && (
              <DocumentTitle title={selectedDocument.title} />
            )}
            <Loader show={selectedDocumentIsFetching} size={16} />
          </StyledDocumentTitleContainer>

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
                  <IconWithTooltip
                    icon={<FaHighlighter />}
                    tooltipLabel="Highlight"
                  />
                </StyledInfoText>
                <Dropdown.Multi.Entity
                  shortLabel
                  options={entitiesDict}
                  disableEmpty
                  isClearable
                  disableAny
                  closeMenuOnSelect={false}
                  onChange={setHlEntities}
                  value={hlEntities}
                  noOptionsMessage="No entity classes to highlight"
                  width={
                    annotatorWidthTooNarrow
                      ? contentWidth / 2.7
                      : contentWidth / 2.5
                  }
                  limitSelectedItems={
                    annotatorWidthTooNarrow
                      ? Math.floor((contentWidth / 2.7 - 110) / 37)
                      : Math.floor((contentWidth / 2.5 - 110) / 37)
                  }
                />
              </>
            )}
          </StyledHighlightContainer>
        )}
      </StyledDocumentLine>

      {showExportModal && selectedDocument && (
        <DocumentModalExport
          document={selectedDocument}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </>
  );
};

export default StatementListDocumentLine;
