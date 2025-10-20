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

  // Track previous values to only scroll when territoryId or statementId actually change
  const prevTerritoryIdRef = useRef<string | undefined>(undefined);
  const prevStatementIdRef = useRef<string | undefined>(undefined);

  // Initial scroll + react to url changes
  useEffect(() => {
    // Only scroll when territoryId or statementId actually changed
    const territoryChanged = prevTerritoryIdRef.current !== territoryId;
    const statementChanged = prevStatementIdRef.current !== statementId;

    if (
      annotator &&
      selectedDocument &&
      (territoryChanged || statementChanged)
    ) {
      console.log(
        "URL scroll - is statement in document?",
        selectedDocument.entityIds.S?.includes(statementId)
      );
      const scrollToId =
        statementId && selectedDocument.entityIds.S?.includes(statementId)
          ? statementId
          : territoryId;

      annotator.scrollToAnchor(scrollToId);

      // Update refs
      prevTerritoryIdRef.current = territoryId;
      prevStatementIdRef.current = statementId;
    }
  }, [selectedDocument, territoryId, statementId, annotator]);

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

  const annotatorWidthTooNarrow = useMemo<boolean>(() => {
    return annotatorWidth < ANNOTATOR_TOO_SMALL_BREAKPOINT;
  }, [annotatorWidth]);

  return (
    <>
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
            annotatorWidthTooNarrow={annotatorWidthTooNarrow}
            contentWidth={contentWidth}
            handleHlEntitiesChange={handleHlEntitiesChange}
            hlEntities={hlEntities}
          />
        )}

        {!selectedDocumentId && (
          <div
            style={{
              // width: "100%",
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
                statementListBoxRef={statementListBoxRef}
              />
            )}
          </AnnotatorProvider>
        </div>
      </animated.div>
    </>
  );
};
