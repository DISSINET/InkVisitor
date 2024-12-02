import { Annotator } from "@inkvisitor/annotator/src/lib";
import { animated, useSpring } from "@react-spring/web";
import { EntityEnums, UserEnums } from "@shared/enums";
import { IEntity, IResponseEntity, IResponseStatement } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { Button, Input, Loader } from "components";
import Dropdown, { EntitySuggester, EntityTag } from "components/advanced";
import TextAnnotator from "components/advanced/Annotator/Annotator";
import AnnotatorProvider from "components/advanced/Annotator/AnnotatorProvider";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { FaLongArrowAltRight, FaUnlink } from "react-icons/fa";
import { GrDocumentMissing } from "react-icons/gr";
import { TbAnchorOff } from "react-icons/tb";
import { TiDocumentText } from "react-icons/ti";
import { ThemeContext } from "styled-components";
import { COLLAPSED_TABLE_WIDTH } from "Theme/constants";
import useResizeObserver from "use-resize-observer";
import { StyledInfoText } from "../StatementListHeader/StatementListHeaderStyles";
import {
  StyledDocumentTag,
  StyledDocumentTitle,
} from "../StatementLitBoxStyles";
import { entitiesDict } from "@shared/dictionaries/entity";
import { useDebounce } from "hooks";

interface StatementListTextAnnotator {
  statements: IResponseStatement[];
  territoryId: string;
  entities: { [key: string]: IEntity };
  right: UserEnums.RoleMode;
  setShowSubmit: React.Dispatch<React.SetStateAction<boolean>>;
  addStatementAtCertainIndex: (index: number) => Promise<void>;
  handleCreateStatement: (detail?: string, statementId?: string) => void;
  handleCreateTerritory: (territoryId?: string) => void;
  selectedRows: string[];
  setSelectedRows: React.Dispatch<React.SetStateAction<string[]>>;

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
}

export const StatementListTextAnnotator: React.FC<
  StatementListTextAnnotator
> = ({
  statements,
  territoryId,
  entities,
  right,
  setShowSubmit,
  addStatementAtCertainIndex,
  handleCreateStatement,
  handleCreateTerritory,
  selectedRows,
  setSelectedRows,

  storedAnnotatorResourceId,
  setStoredAnnotatorResourceId = () => {},

  storedAnnotatorScroll,
  setStoredAnnotatorScroll = () => {},

  hlEntities,
  setHlEntities,

  contentHeight,
  contentWidth,
}) => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [showAnnotator, setShowAnnotator] = useState(false);
  useEffect(() => {
    setShowAnnotator(true);
  }, []);

  const [annotator, setAnnotator] = useState<Annotator | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchOccurences, setSearchOccurences] = useState<number>(0);
  const [searchActiveOccurence, setSearchActiveOccurence] = useState<number>(0);

  const dSearchTerm = useDebounce(searchTerm, 1000);

  const isSearchTermValid = useMemo<boolean>(() => {
    return dSearchTerm.length > 2;
  }, [dSearchTerm]);

  useEffect(() => {
    if (annotator) {
      if (isSearchTermValid) {
        annotator?.search(searchTerm);
        const occurences = annotator?.search(searchTerm);
        setSearchOccurences(occurences?.length || 0);
      }
    }
  }, [dSearchTerm]);

  const animatedStyle = useSpring({
    opacity: showAnnotator ? 1 : 0,
    delay: 300,
  });

  const {
    data: resources,
    error: resourcesError,
    isFetching: resourcesIsFetching,
  } = useQuery({
    queryKey: ["resourcesWithDocuments"],
    queryFn: async () => {
      const res = await api.entitiesSearch({
        resourceHasDocument: true,
      });
      return res.data;
    },
    enabled: api.isLoggedIn(),
  });

  const {
    data: documents,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await api.documentsGet({});
      return res.data;
    },
    enabled: api.isLoggedIn(),
  });

  const [selectedResourceId, setSelectedResourceId] = useState<string | false>(
    storedAnnotatorResourceId
  );

  useEffect(() => {
    if (selectedResourceId) {
      setStoredAnnotatorResourceId(selectedResourceId);
    }
  }, [selectedResourceId]);

  // if no resource is selected, select the document with this territoryId in document references
  const loadDefaultResource = () => {
    if (
      resources &&
      documents &&
      isInitialized === false &&
      storedAnnotatorResourceId === false
    ) {
      const resourceWithAnchor = resources.find((resource) => {
        if (resource.data.documentId) {
          const document = documents.find(
            (d) => d.id === resource.data.documentId
          );
          if (document) {
            return document.referencedEntityIds.T.includes(territoryId);
          }
        }
        return false;
      });

      if (resourceWithAnchor) {
        setSelectedResourceId(resourceWithAnchor.id);
      } else {
        setSelectedResourceId(false);
      }

      setIsInitialized(true);
    }
  };

  useEffect(() => {
    setIsInitialized(false);
  }, [territoryId]);

  useEffect(() => {
    loadDefaultResource();
  }, [resources, documents, isInitialized, territoryId]);

  const selectedResource = useMemo<IResponseEntity | false>(() => {
    if (selectedResourceId && resources) {
      return resources?.find((r) => r.id === selectedResourceId) ?? false;
    }
    return false;
  }, [selectedResourceId, resources]);

  const selectedDocumentId = useMemo<string | undefined>(() => {
    if (selectedResource) {
      return selectedResource.data.documentId;
    }
    return undefined;
  }, [selectedResource]);

  const {
    data: selectedDocument,
    error: selectedDocumentError,
    isFetching: selectedDocumentIsFetching,
  } = useQuery({
    queryKey: ["document", selectedDocumentId],
    queryFn: async () => {
      if (selectedDocumentId !== undefined) {
        const res = await api.documentGet(selectedDocumentId);
        return res.data;
      }
      return false;
    },
    enabled: api.isLoggedIn(),
  });

  const thisTHasAnchor = useMemo<boolean>(() => {
    if (selectedDocument) {
      return selectedDocument?.referencedEntityIds.T.includes(territoryId);
    }
    return false;
  }, [selectedDocument, territoryId]);

  const activeTHasAnchor = useMemo<boolean>(() => {
    if (selectedDocument) {
      return selectedDocument?.referencedEntityIds.T.includes(territoryId);
    }
    return false;
  }, [selectedDocument, territoryId]);

  const { ref: selectorRef, height: selectorHeight = 0 } =
    useResizeObserver<HTMLDivElement>();

  const themeContext = useContext(ThemeContext);

  const isSearchAllowed = useMemo<boolean>(() => {
    return annotator !== undefined && selectedDocument !== undefined;
  }, [annotator, selectedDocument]);

  const annotatorHeight = useMemo<number>(() => {
    let height = contentHeight - 70;

    if (isSearchAllowed) {
      height -= 30;
    }
    if (selectorHeight) {
      height -= selectorHeight;
    }
    return height;
  }, [contentHeight, selectorHeight, isSearchAllowed]);

  return (
    <animated.div style={animatedStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0.2rem 0.5rem",
        }}
      >
        {!selectedResource && (
          <EntitySuggester
            categoryTypes={[EntityEnums.Class.Resource]}
            preSuggestions={resources}
            onPicked={(entity) => {
              setSelectedResourceId(entity.id);
            }}
          />
        )}
        {selectedResource && (
          <div
            style={{
              display: "flex",
              gap: "0.2rem",
            }}
          >
            <EntityTag entity={selectedResource} />
            <Button
              key="d"
              tooltipLabel={"use different resource"}
              icon={<FaUnlink />}
              color={"warning"}
              inverted
              onClick={() => {
                setSelectedResourceId(false);
              }}
            />
          </div>
        )}

        {selectedDocumentIsFetching && <Loader />}

        {!selectedDocumentIsFetching && (
          <>
            {selectedDocument && (
              <>
                <StyledDocumentTag>
                  <TiDocumentText
                    style={{ marginRight: "0.2rem", flexShrink: "0" }}
                  />
                  <div style={{ display: "grid" }}>
                    <StyledDocumentTitle>
                      {selectedDocument?.title}
                    </StyledDocumentTitle>
                  </div>
                </StyledDocumentTag>
              </>
            )}
          </>
        )}

        {!selectedDocumentIsFetching &&
          selectedResource !== false &&
          selectedResource.data.documentId === undefined && (
            <>
              <GrDocumentMissing />
              <i>This Resource does not have any document</i>
            </>
          )}

        {selectedResource !== false && selectedResource?.data?.documentId && (
          <div
            className="annotator-menu-bar"
            style={{
              gap: "0.2rem",
            }}
          >
            {/* T anchor line */}
            {activeTHasAnchor ? (
              <Button
                label="Locate territory"
                iconRight={<FaLongArrowAltRight />}
                tooltipLabel="localize anchor in document"
                inverted
                onClick={() => {
                  annotator?.scrollToAnchor(territoryId);
                }}
                color="warning"
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  gap: "0.4rem",
                  color: themeContext?.color["black"],
                }}
              >
                <i>No </i>
                <TbAnchorOff />
                <i>for Territory</i>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Class selector */}
      {selectedResource !== false && selectedResource?.data?.documentId && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: themeContext?.space[6],
            marginBottom: themeContext?.space[2],
          }}
          ref={selectorRef}
        >
          <StyledInfoText style={{ textWrap: "nowrap" }}>
            Highlight
          </StyledInfoText>
          <Dropdown.Multi.Entity
            options={entitiesDict}
            disableEmpty={true}
            disableAny={true}
            onChange={(newValues) => {
              setHlEntities(newValues);
            }}
            value={hlEntities}
            width={
              statements.length > 0
                ? contentWidth - COLLAPSED_TABLE_WIDTH - 70
                : contentWidth - 70
            }
            noOptionsMessage="No entity classes to highlight"
          />
        </div>
      )}

      {isSearchAllowed && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: themeContext?.space[6],
            marginBottom: themeContext?.space[2],
          }}
        >
          <StyledInfoText style={{ textWrap: "nowrap", marginRight: "13px" }}>
            Search
          </StyledInfoText>
          <Input
            value={searchTerm}
            onChangeFn={(newText) => {
              setSearchTerm(newText);
            }}
            changeOnType
          />
          {isSearchTermValid && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: themeContext?.space[2],
              }}
            >
              <div
                style={{
                  color: themeContext?.color["info"],
                  fontSize: themeContext?.fontSize["xs"],
                }}
              >
                {searchActiveOccurence + 1} / {searchOccurences} occurences
              </div>
              <Button
                label="⬇"
                color="info"
                onClick={() => {
                  const occurences = annotator?.search(searchTerm);
                  if (occurences && occurences?.length) {
                    const nextOccurence =
                      (searchActiveOccurence + 1) % occurences.length;
                    annotator?.selectSearchOccurence(occurences[nextOccurence]);
                    setSearchActiveOccurence(nextOccurence);
                  }
                }}
              />
              <Button
                label="⬆"
                color="info"
                onClick={() => {
                  const occurences = annotator?.search(searchTerm);
                  if (occurences && occurences?.length) {
                    const prevOccurance =
                      (searchActiveOccurence - 1 + occurences.length) %
                      occurences.length;
                    annotator?.selectSearchOccurence(occurences[prevOccurance]);
                    setSearchActiveOccurence(prevOccurance);
                  }
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Annotator */}
      <div style={{ marginTop: "0.2rem" }}>
        <AnnotatorProvider>
          {selectedDocumentId && (
            <TextAnnotator
              width={
                statements.length > 0
                  ? contentWidth - COLLAPSED_TABLE_WIDTH - 5
                  : contentWidth
              }
              hlEntities={hlEntities}
              forwardAnnotator={(newAnnotator) => {
                setAnnotator(newAnnotator);
              }}
              thisTerritoryEntityId={territoryId}
              initialScrollEntityId={territoryId}
              displayLineNumbers={true}
              height={annotatorHeight}
              documentId={selectedDocumentId}
              handleCreateStatement={handleCreateStatement}
              handleCreateTerritory={handleCreateTerritory}
              storedAnnotatorScroll={storedAnnotatorScroll}
              setStoredAnnotatorScroll={setStoredAnnotatorScroll}
            />
          )}
        </AnnotatorProvider>
      </div>
    </animated.div>
  );
};
