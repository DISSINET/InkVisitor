import { Annotator } from "@inkvisitor/annotator/src/lib";
import { animated, useSpring } from "@react-spring/web";
import { entitiesDict } from "@shared/dictionaries/entity";
import { EntityEnums, UserEnums } from "@shared/enums";
import {
  IDocument,
  IEntity,
  IResponseEntity,
  IResponseStatement,
  IResponseTerritory,
} from "@shared/types";
import Dropdown from "components/advanced";
import TextAnnotator from "components/advanced/Annotator/Annotator";
import AnnotatorProvider from "components/advanced/Annotator/AnnotatorProvider";
import { useDebounce, useResizeObserver } from "hooks";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ThemeContext } from "styled-components";
import { COLLAPSED_TABLE_WIDTH } from "Theme/constants";
import { StatementListDisplayMode } from "types";
import StatementListDocumentSearchLine from "../StatementListDocumentSearchLine/StatementListDocumentSearchLine";
import { StyledInfoText } from "../StatementListHeader/StatementListHeaderStyles";

interface StatementListTextAnnotator {
  statements: IResponseStatement[];
  // it's faster than the territory entity so it's better to pass territoryId separately
  territoryId: string;
  territory?: IResponseTerritory;
  statementId: string;
  entities: { [key: string]: IEntity };
  right: UserEnums.RoleMode;
  setShowSubmit: React.Dispatch<React.SetStateAction<boolean>>;
  addStatementAtCertainIndex: (index: number) => Promise<void>;
  handleCreateStatement: (detail?: string, statementId?: string) => void;

  storedAnnotatorResourceId: string | false;
  setStoredAnnotatorResourceId?: React.Dispatch<
    React.SetStateAction<string | false>
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
  documents?: IDocument[];
  setSelectedResourceId: React.Dispatch<React.SetStateAction<string | false>>;

  // useQuery for selectedDocument
  selectedDocumentId: string | undefined;
  selectedDocumentIsFetching: boolean;
  selectedDocumentError: Error | null;

  displayMode: StatementListDisplayMode;
  showStatementList: boolean;
  userCanEdit: boolean;
}

export const StatementListTextAnnotator: React.FC<
  StatementListTextAnnotator
> = ({
  statements,
  territoryId,
  territory,
  statementId,
  entities,
  right,
  setShowSubmit,
  addStatementAtCertainIndex,
  handleCreateStatement,

  storedAnnotatorResourceId,
  setStoredAnnotatorResourceId = () => {},

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
  documents,
  setSelectedResourceId,

  selectedDocumentId,
  selectedDocumentIsFetching,
  selectedDocumentError,
  displayMode,
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

  const debouncedContentWidth = useDebounce(contentWidth, 80);

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

  const { ref: selectorRef, height: selectorHeight = 0 } =
    useResizeObserver<HTMLDivElement>({ debounceDelay: 0 });

  const themeContext = useContext(ThemeContext);

  const isSearchAllowed = useMemo<boolean>(() => {
    return annotator !== undefined && !!selectedDocument;
  }, [annotator, selectedDocument]);

  const annotatorHeight = useMemo<number>(() => {
    let height = contentHeight - 70;

    if (selectorHeight) {
      height -= selectorHeight;
    }
    return height;
  }, [contentHeight, selectorHeight]);

  const annotatorWidth = useMemo<number>(() => {
    return showStatementList
      ? debouncedContentWidth - COLLAPSED_TABLE_WIDTH
      : debouncedContentWidth;
  }, [debouncedContentWidth, showStatementList]);

  // TODO: min reasonable width as constant
  const annotatorWidthTooSmall = useMemo<boolean>(() => {
    return annotatorWidth < 360;
  }, [annotatorWidth]);

  return (
    <animated.div style={animatedStyle}>
      {debouncedContentWidth > 0 && (
        <StatementListDocumentSearchLine
          statements={statements}
          selectedResource={selectedResource}
          setSelectedResourceId={setSelectedResourceId}
          selectedDocumentIsFetching={selectedDocumentIsFetching}
          selectedDocument={selectedDocument}
          activeTHasAnchor={activeTHasAnchor}
          annotator={annotator}
          territoryId={territoryId}
          isSearchAllowed={isSearchAllowed}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isSearchTermValid={isSearchTermValid}
          hasNoSearchResults={searchOccurences.length === 0}
          searchActiveOccurence={searchActiveOccurence}
          searchOccurences={searchOccurences}
          setSearchActiveOccurence={setSearchActiveOccurence}
          resources={resources || []}
          showStatementList={showStatementList}
          userCanEdit={userCanEdit}
          annotatorWidthTooSmall={annotatorWidthTooSmall}
        />
      )}

      {/* Class selector */}
      {selectedResource !== false && selectedResource?.data?.documentId && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: themeContext?.space[4],
            paddingRight: themeContext?.space[2],
            marginBottom: themeContext?.space[2],
            marginLeft: showStatementList ? `-${COLLAPSED_TABLE_WIDTH}px` : "0",
          }}
          ref={selectorRef}
        >
          {/* this condition helps initial render in firefox */}
          {debouncedContentWidth > 0 && (
            <>
              <StyledInfoText style={{ textWrap: "nowrap" }}>
                Highlight
              </StyledInfoText>
              <Dropdown.Multi.Entity
                options={entitiesDict}
                disableEmpty={true}
                isClearable={true}
                disableAny={true}
                onChange={handleHlEntitiesChange}
                value={hlEntities}
                width={debouncedContentWidth - 71}
                noOptionsMessage="No entity classes to highlight"
                limitSelectedItems={Math.floor(
                  (debouncedContentWidth - 145) / 80
                )}
              />
            </>
          )}
        </div>
      )}

      {/* Annotator */}
      <div style={{ marginTop: "0.2rem" }}>
        <AnnotatorProvider>
          {selectedDocumentId && (
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
            />
          )}
        </AnnotatorProvider>
      </div>
    </animated.div>
  );
};
