import { Annotator } from "@inkvisitor/annotator/src/lib";
import { animated, useSpring } from "@react-spring/web";
import { EntityEnums, UserEnums } from "@shared/enums";
import { IEntity, IResponseEntity, IResponseStatement } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { Button, Loader } from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import TextAnnotator from "components/advanced/Annotator/Annotator";
import AnnotatorProvider from "components/advanced/Annotator/AnnotatorProvider";
import React, { useEffect, useMemo, useState } from "react";
import { FaUnlink } from "react-icons/fa";
import { GrDocumentMissing } from "react-icons/gr";
import { TbAnchor, TbAnchorOff } from "react-icons/tb";
import { TiDocumentText, TiRadar } from "react-icons/ti";
import { COLLAPSED_TABLE_WIDTH } from "Theme/constants";
import {
  StyledDocumentTag,
  StyledDocumentTitle,
} from "../StatementLitBoxStyles";

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

  contentHeight,
  contentWidth,
}) => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [showAnnotator, setShowAnnotator] = useState(false);
  useEffect(() => {
    setShowAnnotator(true);
  }, []);

  const [annotator, setAnnotator] = useState<Annotator | undefined>(undefined);

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

  return (
    <animated.div style={animatedStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0.2rem 1rem",
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
      </div>

      {/* T anchor line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0.2rem 1rem",
          gap: "0.6rem",
        }}
      >
        {activeTHasAnchor ? (
          <>
            <span style={{ display: "flex", gap: "0.4rem" }}>
              <TbAnchor />
              <span>T Anchor created</span>
            </span>

            <Button
              icon={<TiRadar />}
              label="localize"
              onClick={() => {
                annotator?.scrollToAnchor(territoryId);
              }}
              color="warning"
            />
          </>
        ) : (
          <span style={{ display: "flex", gap: "0.4rem" }}>
            <TbAnchorOff />
            <i>No Anchor for T</i>
          </span>
        )}
      </div>

      {/* Annotator */}
      <div style={{ marginTop: "0.2rem" }}>
        <AnnotatorProvider>
          {selectedDocumentId && (
            <TextAnnotator
              width={
                statements.length > 0
                  ? contentWidth - COLLAPSED_TABLE_WIDTH
                  : contentWidth
              }
              forwardAnnotator={(newAnnotator) => {
                setAnnotator(newAnnotator);
              }}
              thisTerritoryEntityId={territoryId}
              initialScrollEntityId={territoryId}
              displayLineNumbers={true}
              height={contentHeight - 60}
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
