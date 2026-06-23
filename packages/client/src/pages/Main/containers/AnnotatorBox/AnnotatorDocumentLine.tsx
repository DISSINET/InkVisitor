import { entitiesDict } from "@inkvisitor/shared/dictionaries";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IDocument, IEntity } from "@inkvisitor/shared/types";
import { Button, IconWithTooltip, Loader, Modal, ModalContent, ModalHeader } from "components";
import Dropdown, {
  DocumentModalExport,
  DocumentTitle,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import { WarningsChip } from "components/advanced/Annotator/AnnotatorWarningsModal";
import React, { useMemo, useState } from "react";
import { FaDownload, FaHighlighter, FaLongArrowAltRight } from "react-icons/fa";
import { GrDocumentMissing } from "react-icons/gr";
import { TbAnchor, TbAnchorOff } from "react-icons/tb";
import { toast } from "react-toastify";
import { ANNOTATOR_UNDERSIZED_BREAKPOINT } from "Theme/constants";
import {
  StyledAnnotatorMenuBar,
  StyledDocumentLine,
  StyledDocumentTitleContainer,
  StyledEntityContainer,
  StyledHighlightContainer,
  StyledNoDocumentMessage,
  StyledSearchNavigation,
} from "../StatementsListBox/StatementListBoxStyles";
import {
  StyledDocumentContainer,
  StyledInfoText,
  StyledLoadingDocument,
  StyledWarningsListHeader,
  StyledWarningWrapper,
} from "./AnnotatorBoxStyles";

// icon + margin + gap in StyledHighlightContainer when highlight label is shown
const HIGHLIGHT_ICON_RESERVED_WIDTH = 10;
const HIGHLIGHT_DROPDOWN_CHROME_WIDTH = 110;
const HIGHLIGHT_SELECTED_ITEM_WIDTH = 37;

interface StatementListDocumentLine {
  selectedResource: IEntity | false;
  setSelectedResourceId: (id: string | false) => void;
  selectedDocumentIsFetching: boolean;
  selectedDocument?: IDocument;
  activeTHasAnchor: boolean;
  annotator?: any;
  territoryId?: string;
  resources: IEntity[];
  // is list non empty
  showStatementList: boolean;
  // Editor/admin/owner may load any Resource (show the resource suggester).
  canSelectResource: boolean;
  // Whether the loaded document may be edited/exported by this user.
  canEditDocument: boolean;
  annotatorWidthTooNarrow: boolean;

  // highlight
  contentWidth: number;
  hlEntities: EntityEnums.Class[];
  setHlEntities: React.Dispatch<React.SetStateAction<EntityEnums.Class[]>>;

  // asymmetrical-anchor warnings (#2601)
  warningCount?: number;
  onOpenWarnings?: () => void;
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
  canSelectResource,
  canEditDocument,
  annotatorWidthTooNarrow,

  contentWidth,

  hlEntities,
  setHlEntities,

  warningCount = 0,
  onOpenWarnings,
}) => {
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showHighlightModal, setShowHighlightModal] = useState<boolean>(false);

  const isUndersized = useMemo(() => {
    return contentWidth < ANNOTATOR_UNDERSIZED_BREAKPOINT;
  }, [contentWidth]);

  const highlightDropdownWidth = useMemo(() => {
    const baseWidth = annotatorWidthTooNarrow ? contentWidth / 3.3 : contentWidth / 2.6;
    return isUndersized ? baseWidth + HIGHLIGHT_ICON_RESERVED_WIDTH : baseWidth;
  }, [contentWidth, annotatorWidthTooNarrow, isUndersized]);

  const highlightDropdownLimitSelectedItems = useMemo(
    () =>
      Math.floor(
        (highlightDropdownWidth - HIGHLIGHT_DROPDOWN_CHROME_WIDTH) / HIGHLIGHT_SELECTED_ITEM_WIDTH,
      ),
    [highlightDropdownWidth],
  );

  return (
    <>
      <StyledDocumentLine $marginLeft={showStatementList}>
        <StyledDocumentContainer>
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
                isHidden={!canSelectResource}
              />
            )}
            {selectedResource && (
              <div
                style={{
                  display: "flex",
                  maxWidth: annotatorWidthTooNarrow ? "11.5rem" : "13.5rem",
                }}
              >
                <EntityTag
                  fullWidth
                  entity={selectedResource}
                  button={
                    selectedDocument && canEditDocument ? (
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
                    ) : undefined
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

          <StyledDocumentTitleContainer
            style={{
              maxWidth: annotatorWidthTooNarrow ? "11.5rem" : "12.5rem",
              minWidth: "2rem",
            }}
          >
            {selectedDocument && (
              <DocumentTitle
                title={selectedDocument.title}
                width={annotatorWidthTooNarrow ? 80 : "full"}
                noMargin
              />
            )}
            {selectedDocumentIsFetching && !selectedDocument && (
              <StyledLoadingDocument>
                <Loader show size={16} />
                <StyledInfoText>Loading</StyledInfoText>
              </StyledLoadingDocument>
            )}
          </StyledDocumentTitleContainer>

          {/* Orphaned-anchor warnings are only actionable by someone who may
              edit the document, so the chip only shows for an assigned
              resource's loaded document that actually has warnings. */}
          {warningCount > 0 &&
            onOpenWarnings &&
            canEditDocument &&
            selectedResource !== false &&
            selectedResource?.data?.documentId && (
              <StyledWarningWrapper>
                <WarningsChip count={warningCount} onClick={onOpenWarnings} />
              </StyledWarningWrapper>
            )}

          {!selectedDocument && !selectedDocumentIsFetching &&
            selectedResource !== false &&
            selectedResource.data.documentId === undefined && (
              <StyledNoDocumentMessage>
                <GrDocumentMissing />
                <i>This Resource does not have any document</i>
              </StyledNoDocumentMessage>
            )}

          {selectedResource !== false &&
            selectedResource?.data?.documentId && (
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
        </StyledDocumentContainer>

        {/* Class selector - HIGHLIGHT */}
        {selectedResource !== false && selectedResource?.data?.documentId && (
          <StyledHighlightContainer>
            {contentWidth > 0 && !isUndersized && (
              <>
                <StyledInfoText style={{ textWrap: "nowrap" }}>
                  <IconWithTooltip icon={<FaHighlighter />} tooltipLabel="Highlight" />
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
                  width={highlightDropdownWidth}
                  limitSelectedItems={highlightDropdownLimitSelectedItems}
                />
              </>
            )}
            {isUndersized && (
              <Button
                icon={<FaHighlighter />}
                tooltipLabel="Highlight settings"
                onClick={() => setShowHighlightModal(true)}
              />
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

      <Modal
        showModal={showHighlightModal}
        onClose={() => setShowHighlightModal(false)}
        width="auto"
      >
        <ModalHeader
          icon={<FaHighlighter />}
          title="Highlight settings"
          onClose={() => setShowHighlightModal(false)}
        />
        <ModalContent column>
          <StyledWarningsListHeader>Choose entity classes to highlight</StyledWarningsListHeader>
          <Dropdown.Multi.Entity
            options={entitiesDict}
            disableEmpty
            isClearable
            disableAny
            closeMenuOnSelect={false}
            onChange={setHlEntities}
            value={hlEntities}
            noOptionsMessage="No entity classes to highlight"
            width={300}
          />
        </ModalContent>
      </Modal>
    </>
  );
};

export default StatementListDocumentLine;
