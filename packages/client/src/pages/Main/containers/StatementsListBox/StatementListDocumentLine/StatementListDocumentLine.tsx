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
import React, { useCallback, useMemo, useState } from "react";
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
import { SECOND_PANEL_MIN_WIDTH } from "Theme/constants";
import { WarningsChip } from "components/advanced/Annotator/AnnotatorWarningsModal";

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
  userCanEdit,
  annotatorWidthTooNarrow,

  contentWidth,

  hlEntities,
  setHlEntities,

  warningCount = 0,
  onOpenWarnings,
}) => {
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  const isUndersized = useMemo(() => {
    return contentWidth < SECOND_PANEL_MIN_WIDTH;
  }, [contentWidth]);

  const highlightDropdownWidth = useMemo(() => {
    const baseWidth = annotatorWidthTooNarrow ? contentWidth / 2.9 : contentWidth / 2.6;
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
                  maxWidth: annotatorWidthTooNarrow ? "10rem" : "13.5rem",
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
              maxWidth: annotatorWidthTooNarrow ? "8rem" : "12.5rem",
              minWidth: "2rem",
            }}
          >
            {selectedDocument && (
              <DocumentTitle title={selectedDocument.title} width={isUndersized ? 70 : "full"} />
            )}
            <Loader show={selectedDocumentIsFetching} size={16} />
          </StyledDocumentTitleContainer>

          {warningCount > 0 && onOpenWarnings && (
            <span
              style={{
                display: "inline-flex",
                flexShrink: 0,
                // Left gap comes from DocumentTitle's own 0.6rem right margin;
                // match it on the right so the chip is evenly spaced.
                marginRight: "0.6rem",
              }}
            >
              <WarningsChip count={warningCount} onClick={onOpenWarnings} />
            </span>
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
                {!isUndersized && (
                  <StyledInfoText style={{ textWrap: "nowrap" }}>
                    <IconWithTooltip icon={<FaHighlighter />} tooltipLabel="Highlight" />
                  </StyledInfoText>
                )}
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
