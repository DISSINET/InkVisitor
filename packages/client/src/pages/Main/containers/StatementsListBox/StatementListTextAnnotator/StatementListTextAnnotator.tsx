import { Annotator } from "@inkvisitor/annotator/src/lib";
import { animated, useSpring } from "@react-spring/web";
import { EntityEnums } from "@shared/enums";
import { IDocument, IResponseEntity, IResponseTerritory } from "@shared/types";
import TextAnnotator from "components/advanced/Annotator/Annotator";
import AnnotatorProvider from "components/advanced/Annotator/AnnotatorProvider";
import { useDebounce, useTheme } from "hooks";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ANNOTATOR_SELECTOR_HEIGHT,
  ANNOTATOR_TOO_SMALL_BREAKPOINT,
  COLLAPSED_TABLE_WIDTH,
} from "Theme/constants";
import StatementListDocumentLine from "../StatementListDocumentLine/StatementListDocumentLine";
import { StatementListSearchLine } from "../StatementListSearchLine/StatementListSearchLine";

interface StatementListTextAnnotator {
  // it's faster than the territory entity so it's better to pass territoryId separately
  territoryId: string;
  territory?: IResponseTerritory;
  statementId: string;
  addStatementAtCertainIndex: (index: number) => Promise<void>;
  handleCreateStatement: (detail?: string, statementId?: string) => void;

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
}

export const StatementListTextAnnotator: React.FC<
  StatementListTextAnnotator
> = ({
  territoryId,
  territory,
  statementId,
  addStatementAtCertainIndex,
  handleCreateStatement,

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

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchOccurences, setSearchOccurences] = useState<
    { segmentIndex: number; lineIndex: number; start: number; end: number }[]
  >([]);
  const [searchActiveOccurence, setSearchActiveOccurence] = useState<number>(0);

  useEffect(() => {
    const newSelectedOccurence = searchOccurences[searchActiveOccurence];

    if (newSelectedOccurence) {
      annotator?.selectSearchOccurrence(newSelectedOccurence);
    }
  }, [searchActiveOccurence, searchOccurences]);

  const dSearchTerm = useDebounce(searchTerm, 1000);

  const isSearchTermValid = useMemo<boolean>(() => {
    return dSearchTerm.length > 2;
  }, [dSearchTerm]);

  useEffect(() => {
    if (annotator) {
      if (isSearchTermValid) {
        annotator?.search(searchTerm);
        const occurences = annotator?.search(searchTerm);

        setSearchOccurences(occurences);

        setTimeout(() => {
          setSearchActiveOccurence(0);
        }, 1000);

        // if (occurences.length > 0) {
        //   annotator?.selectSearchOccurence(
        //     searchOccurences[searchActiveOccurence]
        //   );
        // }
      }
    }
  }, [dSearchTerm]);

  const animatedStyle = useSpring({
    opacity: showAnnotator ? 1 : 0,
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

  const theme = useTheme();

  const isSearchAllowed = useMemo<boolean>(() => {
    return annotator !== undefined && !!selectedDocument;
  }, [annotator, selectedDocument]);

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

      <StatementListSearchLine
        showStatementList={showStatementList}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isSearchTermValid={isSearchTermValid}
        searchOccurences={searchOccurences}
        searchActiveOccurence={searchActiveOccurence}
        isSearchAllowed={isSearchAllowed}
        annotatorWidthTooSmall={annotatorWidthTooSmall}
        setSearchActiveOccurence={setSearchActiveOccurence}
        annotator={annotator}
        documentId={selectedDocumentId}
        dataDocument={selectedDocument || undefined}
      />

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
              documentId={selectedDocumentId as string}
              handleCreateStatement={handleCreateStatement}
              storedAnnotatorScroll={storedAnnotatorScroll}
              setStoredAnnotatorScroll={setStoredAnnotatorScroll}
              territory={territory}
              dataDocument={selectedDocument}
              dataDocumentIsFetching={selectedDocumentIsFetching}
              dataDocumentError={selectedDocumentError}
            />
          )}
        </AnnotatorProvider>
      </div>
    </animated.div>
  );
};
