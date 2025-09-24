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
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ANNOTATOR_SELECTOR_HEIGHT,
  ANNOTATOR_TOO_SMALL_BREAKPOINT,
  COLLAPSED_TABLE_WIDTH,
} from "Theme/constants";
import StatementListDocumentLine from "../StatementListDocumentLine/StatementListDocumentLine";

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

  storedAnnotatorScroll: number;
  setStoredAnnotatorScroll?: React.Dispatch<React.SetStateAction<number>>;

  hlEntities: EntityEnums.Class[];
  setHlEntities: React.Dispatch<React.SetStateAction<EntityEnums.Class[]>>;

  contentHeight: number;
  contentWidth: number;

  annotator?: Annotator;
  setAnnotator?: React.Dispatch<React.SetStateAction<Annotator | undefined>>;

  selectedDocument?: IDocument | false;
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
  const [showAnnotator, setShowAnnotator] = useState(false);

  useEffect(() => {
    setShowAnnotator(true);
  }, []);

  const handleHlEntitiesChange = useCallback(
    (newHlEntities: EntityEnums.Class[]) => {
      setHlEntities(newHlEntities);
    },
    []
  );

  const animatedStyle = useSpring({
    opacity: showAnnotator ? 1 : 0,
    width: "100%",
    delay: 300,
  });

  // INIT + react to url changes
  useEffect(() => {
    if (annotator && selectedDocument) {
      const scrollToId =
        statementId && selectedDocument.entityIds.S?.includes(statementId)
          ? statementId
          : territoryId;

      // ensure the annotator is fully initialized
      setTimeout(() => {
        annotator.scrollToAnchor(scrollToId);
      }, 100);
    }
  }, [statementId, annotator, territoryId, selectedDocument]);

  const thisTHasAnchor = useMemo<boolean>(() => {
    if (selectedDocument) {
      return selectedDocument?.entityIds.T.includes(territoryId);
    }
    return false;
  }, [selectedDocument, territoryId]);

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

  const annotatorWidthTooSmall = useMemo<boolean>(() => {
    return annotatorWidth < ANNOTATOR_TOO_SMALL_BREAKPOINT;
  }, [annotatorWidth]);

  return (
    <animated.div style={animatedStyle}>
      {contentWidth > 0 && (
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
          annotatorWidthTooSmall={annotatorWidthTooSmall}
          contentWidth={contentWidth}
          handleHlEntitiesChange={handleHlEntitiesChange}
          hlEntities={hlEntities}
        />
      )}

      {/* Annotator */}
      <div style={{ marginTop: "0.2rem" }}>
        <AnnotatorProvider>
          {selectedDocumentId && selectedDocument && (
            <TextAnnotator
              width={annotatorWidth}
              annotatorWidthTooSmall={annotatorWidthTooSmall}
              hlEntities={hlEntities}
              forwardAnnotator={(newAnnotator) => {
                setAnnotator(newAnnotator);
              }}
              thisTerritoryEntityId={territoryId}
              displayLineNumbers={true}
              height={annotatorHeight}
              documentId={selectedDocumentId}
              statementCreateMutation={statementCreateMutation}
              storedAnnotatorScroll={storedAnnotatorScroll}
              setStoredAnnotatorScroll={setStoredAnnotatorScroll}
              territory={territory}
              dataDocument={selectedDocument}
              dataDocumentIsFetching={selectedDocumentIsFetching}
              dataDocumentError={selectedDocumentError}
              showStatementList={showStatementList}
              userData={userData}
            />
          )}
        </AnnotatorProvider>
      </div>
    </animated.div>
  );
};
