import { Annotator } from "@inkvisitor/annotator/src/lib";
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
import TextAnnotator from "components/advanced/Annotator/Annotator";
import AnnotatorProvider from "components/advanced/Annotator/AnnotatorProvider";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { BsInfoCircle } from "react-icons/bs";
import {
  ANNOTATOR_SELECTOR_HEIGHT,
  ANNOTATOR_TOO_SMALL_BREAKPOINT,
  COLLAPSED_TABLE_WIDTH,
} from "Theme/constants";
import { collectStatementAnchors } from "utils/utils";
import { StyledEmptyState } from "../StatementListBoxStyles";
import StatementListDocumentLine from "../StatementListDocumentLine/StatementListDocumentLine";

interface StatementListTextAnnotator {
  // it's faster than the territory entity so it's better to pass territoryId separately
  territoryId: string;
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
  resources?: IResponseEntity[];
  setSelectedResourceId: React.Dispatch<React.SetStateAction<string | false>>;

  // useQuery for selectedDocument
  selectedDocumentId?: string;
  selectedDocumentIsFetching: boolean;
  selectedDocumentError: Error | null;

  showStatementList: boolean;
  userCanEdit: boolean;
  userData?: IResponseUser;

  onStatementAnchorHover?: (statementId: string | null) => void;
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
  resources,
  setSelectedResourceId,

  selectedDocumentId,
  selectedDocumentIsFetching,
  selectedDocumentError,
  showStatementList,
  userCanEdit,
  userData,

  onStatementAnchorHover,
}) => {
  const annotatorHeight = useMemo<number>(() => {
    return contentHeight - 70 - ANNOTATOR_SELECTOR_HEIGHT;
  }, [contentHeight]);

  const annotatorWidth = useMemo<number>(() => {
    return showStatementList ? contentWidth - COLLAPSED_TABLE_WIDTH : contentWidth;
  }, [contentWidth, showStatementList]);

  const annotatorWidthTooNarrow = useMemo<boolean>(() => {
    return annotatorWidth < ANNOTATOR_TOO_SMALL_BREAKPOINT;
  }, [annotatorWidth]);

  // Asymmetrical-anchor warnings (#2601): the chip lives next to the document
  // title, but the modal + unlink/scroll handlers stay inside the annotator, so
  // the open state and broken-anchor count are owned here and shared with both.
  const [warningsModalOpen, setWarningsModalOpen] = useState(false);
  const [warningAnchorCount, setWarningAnchorCount] = useState(0);

  const activeTHasAnchor = useMemo<boolean>(() => {
    if (selectedDocument) {
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
            selectedDocument.entityIds[EntityEnums.Class.Statement]?.includes(statementId)
        );
        const isStatementInTerritory = territory?.statements?.some(
          (statement) => statement.id === statementId
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

        if (performScroll) {
          annotator.scrollToAnchor(scrollToId);
        }

        // Update refs AFTER scroll
        prevTerritoryIdRef.current = territory.id;
        prevStatementIdRef.current = statementId;
        lastScrolledAnnotatorRef.current = annotator;
      }
    }
  }, [selectedDocument, statementId, annotator, territory]);

  return (
    <>
      <div style={{ width: "100%" }}>
        <StatementListDocumentLine
          selectedResource={selectedResource}
          setSelectedResourceId={setSelectedResourceId}
          selectedDocumentIsFetching={selectedDocumentIsFetching}
          selectedDocument={selectedDocument}
          activeTHasAnchor={activeTHasAnchor}
          annotator={annotator}
          territoryId={territoryId}
          resources={resources || []}
          showStatementList={showStatementList}
          userCanEdit={userCanEdit}
          annotatorWidthTooNarrow={annotatorWidthTooNarrow}
          contentWidth={contentWidth}
          setHlEntities={setHlEntities}
          hlEntities={hlEntities}
          warningCount={warningAnchorCount}
          onOpenWarnings={() => setWarningsModalOpen(true)}
        />

        {!selectedDocumentId && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "2rem",
            }}
          >
            <StyledEmptyState>
              <BsInfoCircle size="23" />
            </StyledEmptyState>
            <StyledEmptyState>
              {"No document selected yet. Pick a resource from the resource suggester"}
            </StyledEmptyState>
          </div>
        )}

        {/* Annotator */}
        <AnnotatorProvider>
          {selectedDocumentId && selectedDocument && (
            <TextAnnotator
              width={annotatorWidth}
              annotatorWidthTooNarrow={annotatorWidthTooNarrow}
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
              showStatementList={showStatementList}
              userData={userData}
              territoryId={territoryId}
              onStatementAnchorHover={onStatementAnchorHover}
              hideWarningChip
              warningsModalOpen={warningsModalOpen}
              onWarningsModalOpenChange={setWarningsModalOpen}
              onAsymmetricalAnchorCountChange={setWarningAnchorCount}
            />
          )}
        </AnnotatorProvider>
      </div>
    </>
  );
};
