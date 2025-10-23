import { Annotator } from "@inkvisitor/annotator/src/lib";
import { animated, useSpring } from "@react-spring/web";
import { EntityEnums } from "@shared/enums";
import {
  IDocument,
  IResponseEntity,
  IResponseGeneric,
  IResponseTerritory,
  IResponseUser,
  IStatement,
} from "@shared/types";
import { UseMutationResult } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import TextAnnotator from "components/advanced/Annotator/Annotator";
import AnnotatorProvider from "components/advanced/Annotator/AnnotatorProvider";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ANNOTATOR_SELECTOR_HEIGHT,
  ANNOTATOR_TOO_SMALL_BREAKPOINT,
  COLLAPSED_TABLE_WIDTH,
} from "Theme/constants";
import StatementListDocumentLine from "../StatementListDocumentLine/StatementListDocumentLine";
import { StyledEmptyState } from "../StatementListBoxStyles";
import { BsInfoCircle } from "react-icons/bs";

interface StatementListTextAnnotator {
  // it's faster than the territory entity so it's better to pass territoryId separately
  territoryId: string;
  territory?: IResponseTerritory;
  statementId: string;
  addStatementAtCertainIndex: (index: number) => Promise<void>;
  statementCreateMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric<IStatement>, any>,
    Error,
    IStatement,
    unknown
  >;
  statementListBoxRef?: React.RefObject<HTMLDivElement | null>;

  storedAnnotatorScroll: number;
  setStoredAnnotatorScroll?: React.Dispatch<React.SetStateAction<number>>;

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
  selectedDocumentId: string | undefined;
  selectedDocumentIsFetching: boolean;
  selectedDocumentError: Error | null;

  showStatementList: boolean;
  userCanEdit: boolean;
  userData?: IResponseUser;
}

export const StatementListTextAnnotator: React.FC<
  StatementListTextAnnotator
> = ({
  territoryId,
  territory,
  statementId,
  addStatementAtCertainIndex,
  statementCreateMutation,
  statementListBoxRef,

  storedAnnotatorScroll,
  setStoredAnnotatorScroll = () => {},

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
}) => {
  const handleHlEntitiesChange = useCallback(
    (newHlEntities: EntityEnums.Class[]) => {
      setHlEntities(newHlEntities);
    },
    []
  );

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
      const shouldScroll =
        territoryChanged || statementChanged || annotatorChanged;
      if (annotator && selectedDocument && shouldScroll) {
        const isStatementInDocument =
          statementId && selectedDocument.entityIds.S?.includes(statementId);
        const isStatementInTerritory = territory?.statements?.some(
          (statement) => statement.id === statementId
        );

        const scrollToId =
          isStatementInDocument && isStatementInTerritory
            ? statementId
            : territoryId;

        // Perform the scroll
        annotator.scrollToAnchor(scrollToId);

        // Update refs AFTER scroll
        prevTerritoryIdRef.current = territory.id;
        prevStatementIdRef.current = statementId;
        lastScrolledAnnotatorRef.current = annotator;
      }
    }
  }, [selectedDocument, statementId, annotator, territory]);

  const activeTHasAnchor = useMemo<boolean>(() => {
    if (selectedDocument) {
      return selectedDocument?.entityIds.T.includes(territoryId);
    }
    return false;
  }, [selectedDocument, territoryId]);

  const annotatorHeight = useMemo<number>(() => {
    return contentHeight - 70 - ANNOTATOR_SELECTOR_HEIGHT;
  }, [contentHeight]);

  const annotatorWidth = useMemo<number>(() => {
    return showStatementList
      ? contentWidth - COLLAPSED_TABLE_WIDTH
      : contentWidth;
  }, [contentWidth, showStatementList]);

  const annotatorWidthTooNarrow = useMemo<boolean>(() => {
    return annotatorWidth < ANNOTATOR_TOO_SMALL_BREAKPOINT;
  }, [annotatorWidth]);

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
          handleHlEntitiesChange={handleHlEntitiesChange}
          hlEntities={hlEntities}
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
              {"No document selected yet. Pick one from the suggester"}
            </StyledEmptyState>
          </div>
        )}

        {/* Annotator */}
        <div style={{ marginTop: "0.2rem" }}>
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
                documentId={selectedDocumentId ?? ""}
                statementCreateMutation={statementCreateMutation}
                storedAnnotatorScroll={storedAnnotatorScroll}
                setStoredAnnotatorScroll={setStoredAnnotatorScroll}
                territory={territory}
                dataDocument={selectedDocument ?? undefined}
                dataDocumentIsFetching={selectedDocumentIsFetching}
                dataDocumentError={selectedDocumentError}
                showStatementList={showStatementList}
                userData={userData}
                statementListBoxRef={statementListBoxRef}
                territoryId={territoryId}
              />
            )}
          </AnnotatorProvider>
        </div>
      </div>
    </>
  );
};
