import { Annotator } from "@inkvisitor/annotator/src/lib";
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
import React, { useEffect, useMemo, useRef } from "react";
import { BsInfoCircle } from "react-icons/bs";
import {
  ANNOTATOR_SELECTOR_HEIGHT,
  ANNOTATOR_TOO_SMALL_BREAKPOINT,
} from "Theme/constants";
import { StyledEmptyState } from "../../StatementsListBox/StatementListBoxStyles";
import StatementListDocumentLine from "../../StatementsListBox/StatementListDocumentLine/StatementListDocumentLine";
import { EntitySuggester } from "components/advanced/EntitySuggester/EntitySuggester";
import { toast } from "react-toastify";

interface AnnotatorContainer {
  // it's faster than the territory entity so it's better to pass territoryId separately
  territoryId: string;
  territory?: IResponseTerritory;
  statementId: string;
  statementCreateMutation?: UseMutationResult<
    AxiosResponse<IResponseGeneric<IStatement>, any>,
    Error,
    IStatement,
    unknown
  >;

  storedAnnotatorScrollPosition: number | null;
  setStoredAnnotatorScrollPosition: React.Dispatch<
    React.SetStateAction<number | null>
  >;

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

  userCanEdit: boolean;
  userData?: IResponseUser;
}

export const AnnotatorContainer: React.FC<AnnotatorContainer> = ({
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
  userCanEdit,
  userData,
}) => {
  const annotatorHeight = useMemo<number>(() => {
    return contentHeight - 70 - ANNOTATOR_SELECTOR_HEIGHT;
  }, [contentHeight]);

  // TODO: get rid of this
  const annotatorWidth = useMemo<number>(() => {
    return contentWidth;
  }, [contentWidth]);

  const annotatorWidthTooNarrow = useMemo<boolean>(() => {
    return annotatorWidth < ANNOTATOR_TOO_SMALL_BREAKPOINT;
  }, [annotatorWidth]);

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
        annotator.cursor.reset();
        annotator.draw();

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
          userCanEdit={userCanEdit}
          annotatorWidthTooNarrow={annotatorWidthTooNarrow}
          contentWidth={contentWidth}
          setHlEntities={setHlEntities}
          hlEntities={hlEntities}
        />

        {!selectedDocumentId && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 1.5rem",
              paddingTop: "3.7rem",
              gap: "1.5rem",
            }}
          >
            <StyledEmptyState>
              <BsInfoCircle size="23" />
            </StyledEmptyState>
            <StyledEmptyState>
              {"No document selected yet. Pick one from the suggester"}
            </StyledEmptyState>

            {!selectedResource && resources && (
              <div style={{ marginTop: "0.7rem" }}>
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
              </div>
            )}
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
              setStoredAnnotatorScrollPosition={
                setStoredAnnotatorScrollPosition
              }
              territory={territory}
              dataDocument={selectedDocument ?? undefined}
              dataDocumentIsFetching={selectedDocumentIsFetching}
              dataDocumentError={selectedDocumentError}
              userData={userData}
              territoryId={territoryId}
            />
          )}
        </AnnotatorProvider>
      </div>
    </>
  );
};
