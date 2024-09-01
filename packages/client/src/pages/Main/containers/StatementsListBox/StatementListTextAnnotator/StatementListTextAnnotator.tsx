import { animated, useSpring } from "@react-spring/web";
import { EntityEnums, UserEnums } from "@shared/enums";
import { IEntity, IResponseEntity, IResponseStatement } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { Loader } from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import TextAnnotator from "components/advanced/Annotator/Annotator";
import AnnotatorProvider from "components/advanced/Annotator/AnnotatorProvider";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { BiSolidCommentError } from "react-icons/bi";
import { FaCheck } from "react-icons/fa";
import { GrDocumentMissing } from "react-icons/gr";
import { TiDocumentText } from "react-icons/ti";
import { COLLAPSED_TABLE_WIDTH } from "Theme/constants";
import {
  StyledDocumentInfo,
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

  return (
    <animated.div style={animatedStyle}>
      <div
        style={{
          display: "inline-flex",
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
          <EntityTag
            entity={selectedResource}
            unlinkButton={{
              onClick: () => {
                setSelectedResourceId(false);
              },
            }}
          />
        )}

        {!selectedDocumentIsFetching && <Loader />}
        {!selectedDocumentIsFetching && selectedDocument && (
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
        )}
        {!selectedDocumentIsFetching && selectedDocument && thisTHasAnchor && (
          <StyledDocumentInfo $color="text" $backgroundColor="warning">
            <FaCheck />
            <span style={{ whiteSpace: "nowrap" }}>T anchor exists</span>
          </StyledDocumentInfo>
        )}
        {!selectedDocumentIsFetching && selectedDocument && !thisTHasAnchor && (
          <StyledDocumentInfo $color="danger">
            <BiSolidCommentError />
            <i>No Anchor for T</i>
          </StyledDocumentInfo>
        )}
        {!selectedDocumentIsFetching &&
          selectedResource !== false &&
          selectedResource.data.documentId === undefined && (
            <StyledDocumentInfo $color="warning">
              <GrDocumentMissing />
              <i>This Resource does not have any document</i>
            </StyledDocumentInfo>
          )}
      </div>
      <div style={{ marginTop: "0.2rem" }}>
        <AnnotatorProvider>
          {selectedDocumentId && (
            <TextAnnotator
              width={
                statements.length > 0
                  ? contentWidth - COLLAPSED_TABLE_WIDTH
                  : contentWidth
              }
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
