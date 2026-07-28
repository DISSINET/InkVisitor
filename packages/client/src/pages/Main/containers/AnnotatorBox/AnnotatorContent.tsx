import { Annotator, EditMode } from "@inkvisitor/annotator/src/lib";
import { EntityEnums } from "@inkvisitor/shared/enums";
import {
  IDocument,
  IResponseEntity,
  IResponseGeneric,
  IResponseTerritory,
  IResponseUser,
  IStatement,
} from "@inkvisitor/shared/types";
import { UseMutationResult } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { Button } from "components";
import TextAnnotator from "components/advanced/Annotator/Annotator";
import AnnotatorProvider from "components/advanced/Annotator/AnnotatorProvider";
import { WarningsChip } from "components/advanced/Annotator/AnnotatorWarningsModal";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { BsInfoCircle } from "react-icons/bs";
import { FaLongArrowAltRight } from "react-icons/fa";
import { GrDocumentMissing } from "react-icons/gr";
import { TbAnchor, TbAnchorOff } from "react-icons/tb";
import { collectStatementAnchors } from "utils/utils";
import { StyledEmptyState } from "../StatementsListBox/StatementListBoxStyles";
import { AnnotatorHighlightPopover } from "./AnnotatorHighlightPopover";
import {
  StyledAnnotatorContent,
  StyledEmptyStateWrap,
  StyledLocateAnchorIcon,
} from "./AnnotatorBoxStyles";

interface StatementListTextAnnotator {
  // it's faster than the territory entity so it's better to pass territoryId separately
  territoryId?: string;
  territory?: IResponseTerritory;
  statementId: string;
  statementCreateMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric<IStatement>, any>,
    Error,
    IStatement,
    unknown
  >;

  storedAnnotatorScrollPosition: number | null;
  setStoredAnnotatorScrollPosition: React.Dispatch<React.SetStateAction<number | null>>;

  hlEntities: EntityEnums.Class[];
  setHlEntities: React.Dispatch<React.SetStateAction<EntityEnums.Class[]>>;

  contentHeight: number;
  contentWidth: number;

  annotator?: Annotator;
  setAnnotator?: React.Dispatch<React.SetStateAction<Annotator | undefined>>;

  selectedDocument?: IDocument;
  selectedResource: IResponseEntity | false;

  // useQuery for selectedDocument
  selectedDocumentId?: string;
  selectedDocumentIsFetching: boolean;
  selectedDocumentError: Error | null;

  // Territory write right - also drives the header suggester row visibility,
  // so when false the annotator reclaims that row's height.
  userCanEdit: boolean;
  // Whether the loaded document may be edited (anchors/text/replace/annotate).
  canEditDocument: boolean;
  userData?: IResponseUser;

  onStatementAnchorHover?: (statementId: string | null) => void;
  onUnsavedTextEditsChange?: (hasUnsaved: boolean) => void;
}

export const StatementListTextAnnotator: React.FC<StatementListTextAnnotator> = ({
  territoryId,
  territory,
  statementId,
  statementCreateMutation,

  storedAnnotatorScrollPosition,
  setStoredAnnotatorScrollPosition,

  hlEntities,
  setHlEntities,

  contentHeight,
  contentWidth,

  annotator,
  setAnnotator = () => {},

  selectedDocument,
  selectedResource,

  selectedDocumentId,
  selectedDocumentIsFetching,
  selectedDocumentError,
  canEditDocument,
  userData,

  onStatementAnchorHover,
  onUnsavedTextEditsChange,
}) => {
  // The canvas is the only thing in the box content — the toolbar overlays it
  // and the find panels are portalled out of the layout.
  const annotatorHeight = contentHeight;

  // The annotator box collapses to (near) zero height when the Statement
  // Editor box is full-height. The selection menu floats over the whole page,
  // so hide it while the annotator is out of view — the selection is kept, and
  // the menu reopens once the annotator is visible again.
  const annotatorHidden = annotatorHeight <= 0;

  // Asymmetrical-anchor warnings (#2601): the chip lives next to the document
  // title, but the modal + unlink/scroll handlers stay inside the annotator, so
  // the open state and broken-anchor count are owned here and shared with both.
  const [warningsModalOpen, setWarningsModalOpen] = useState(false);
  const [warningAnchorCount, setWarningAnchorCount] = useState(0);

  useEffect(() => {
    setWarningAnchorCount(0);
    setWarningsModalOpen(false);
  }, [selectedDocumentId]);

  const activeTHasAnchor = useMemo<boolean>(() => {
    if (selectedDocument && territoryId) {
      return selectedDocument?.entityIds.T.includes(territoryId);
    }
    return false;
  }, [selectedDocument, territoryId]);

  // Track previous values to only scroll when territoryId or statementId actually change
  const prevTerritoryIdRef = useRef<string | undefined>(undefined);
  const prevStatementIdRef = useRef<string | undefined>(undefined);
  // Tracking Annotator changes is necessary to keep the position in the text after resizing
  const lastScrolledAnnotatorRef = useRef<Annotator | undefined>(undefined);

  // Initial scroll + react to url changes
  useEffect(() => {
    // Only scroll when territoryId or statementId actually changed
    if (territory) {
      const territoryChanged = prevTerritoryIdRef.current !== territory.id;
      const statementChanged = prevStatementIdRef.current !== statementId;
      const annotatorChanged = lastScrolledAnnotatorRef.current !== annotator;

      // Scroll if: IDs changed OR annotator was recreated (and we haven't scrolled this annotator yet)
      const shouldScroll = territoryChanged || statementChanged || annotatorChanged;
      if (annotator && selectedDocument && shouldScroll) {
        const isStatementInDocument = Boolean(
          statementId &&
          selectedDocument.entityIds[EntityEnums.Class.Statement]?.includes(statementId),
        );
        const isStatementInTerritory = territory?.statements?.some(
          (statement) => statement.id === statementId,
        );

        const scrollToStatement = isStatementInDocument && isStatementInTerritory;

        const statementIsAnchoredInText =
          scrollToStatement &&
          collectStatementAnchors(selectedDocument.anchors).some((a) => a.anchor === statementId);

        const scrollToId = scrollToStatement ? statementId : territoryId;

        const firstTerritoryScroll = prevTerritoryIdRef.current === undefined;

        // Territory: only on first load or when territory changes — not when switching
        // unanchored statements within the same territory.
        const shouldScrollToTerritory = territoryChanged || firstTerritoryScroll;

        let performScroll = false;
        if (scrollToStatement) {
          if (statementIsAnchoredInText) {
            performScroll = true;
          }
        } else if (shouldScrollToTerritory) {
          performScroll = true;
        }

        if (performScroll && scrollToId) {
          annotator.scrollToAnchor(scrollToId);
        }

        // Update refs AFTER scroll
        prevTerritoryIdRef.current = territory.id;
        prevStatementIdRef.current = statementId;
        lastScrolledAnnotatorRef.current = annotator;
      }
    }
  }, [selectedDocument, statementId, annotator, territory, territoryId]);

  return (
    <>
      <StyledAnnotatorContent>
        {!selectedDocumentId && (
          <StyledEmptyStateWrap>
            <StyledEmptyState>
              <BsInfoCircle size="23" />
            </StyledEmptyState>
            <StyledEmptyState>
              {"No document selected yet. Pick a resource from the resource suggester"}
            </StyledEmptyState>
          </StyledEmptyStateWrap>
        )}

        {selectedResource !== false &&
          !selectedDocumentIsFetching &&
          selectedResource.data.documentId === undefined && (
            <StyledEmptyStateWrap>
              <StyledEmptyState>
                <GrDocumentMissing size="23" />
              </StyledEmptyState>
              <StyledEmptyState>
                {"This Resource does not have any document"}
              </StyledEmptyState>
            </StyledEmptyStateWrap>
          )}

        {/* Annotator */}
        <AnnotatorProvider>
          {selectedDocumentId && selectedDocument && (
            <TextAnnotator
              width={contentWidth}
              hlEntities={hlEntities}
              forwardAnnotator={(newAnnotator) => {
                setAnnotator(newAnnotator);
              }}
              thisTerritoryEntityId={territoryId}
              displayLineNumbers={true}
              height={annotatorHeight}
              documentId={selectedDocumentId || undefined}
              statementCreateMutation={statementCreateMutation}
              storedAnnotatorScrollPosition={storedAnnotatorScrollPosition}
              setStoredAnnotatorScrollPosition={setStoredAnnotatorScrollPosition}
              territory={territory}
              dataDocument={selectedDocument ?? undefined}
              dataDocumentIsFetching={selectedDocumentIsFetching}
              dataDocumentError={selectedDocumentError}
              userData={userData}
              canEditDocument={canEditDocument}
              territoryId={territoryId}
              onStatementAnchorHover={onStatementAnchorHover}
              hideWarningChip
              warningsModalOpen={warningsModalOpen}
              onWarningsModalOpenChange={setWarningsModalOpen}
              onAsymmetricalAnchorCountChange={setWarningAnchorCount}
              onUnsavedTextEditsChange={onUnsavedTextEditsChange}
              hideSelectionMenu={annotatorHidden}
              toolbarExtras={(annotatorMode) => (
                <>
                  {/* Entity classes are only painted in highlight mode, so the
                      picker has nothing to act on in the text-editing modes. */}
                  {annotatorMode === EditMode.HIGHLIGHT && (
                    <AnnotatorHighlightPopover
                      hlEntities={hlEntities}
                      setHlEntities={setHlEntities}
                    />
                  )}
                  {activeTHasAnchor ? (
                    <Button
                      label=""
                      iconRight={
                        <StyledLocateAnchorIcon>
                          <TbAnchor />
                          <FaLongArrowAltRight />
                        </StyledLocateAnchorIcon>
                      }
                      tooltipLabel="locate anchor"
                      inverted
                      onClick={() => {
                        if (territoryId) {
                          annotator?.scrollToAnchor(territoryId);
                        }
                      }}
                      color="warning"
                    />
                  ) : (
                    <TbAnchorOff title="no anchor for T" />
                  )}
                  {warningAnchorCount > 0 &&
                    canEditDocument &&
                    selectedResource !== false &&
                    selectedResource?.data?.documentId && (
                      <WarningsChip
                        count={warningAnchorCount}
                        onClick={() => setWarningsModalOpen(true)}
                      />
                    )}
                </>
              )}
            />
          )}
        </AnnotatorProvider>
      </StyledAnnotatorContent>
    </>
  );
};
