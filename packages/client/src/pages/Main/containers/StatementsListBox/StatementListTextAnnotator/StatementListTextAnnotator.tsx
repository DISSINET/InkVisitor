import { EntityEnums, UserEnums } from "@shared/enums";
import { IEntity, IResource, IResponseStatement } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { Loader } from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import TextAnnotator from "components/advanced/Annotator/Annotator";
import AnnotatorProvider from "components/advanced/Annotator/AnnotatorProvider";
import { useSearchParams } from "hooks";
import React, { useEffect, useMemo, useState } from "react";
import { TiDocumentText } from "react-icons/ti";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import {
  StyledDocumentInfo,
  StyledDocumentTag,
  StyledDocumentTitle,
} from "../StatementLitBoxStyles";
import { FaCheck } from "react-icons/fa";
import { BiSolidCommentError } from "react-icons/bi";
import { GrDocumentMissing } from "react-icons/gr";
import { COLLAPSED_TABLE_WIDTH } from "Theme/constants";
import { animated, useSpring } from "@react-spring/web";

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

  contentHeight,
  contentWidth,
}) => {
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

  const [selectedResource, setSelectedResource] = useState<IResource | false>(
    false
  );

  const selectedDocumentId = useMemo<string | false>(() => {
    if (selectedResource && selectedResource.data.documentId) {
      return selectedResource.data.documentId;
    } else {
      // look for all reseources if there is a document attached with the territory id
      resources?.forEach((resource) => {
        if (resource.data.documentId) {
          const document = documents?.find(
            (d) => d.id === resource.data.documentId
          );
          if (document) {
            const hasThisTAnchor = document.referencedEntityIds.T.find(
              (t) => t === territoryId
            );
            if (hasThisTAnchor) {
              setSelectedResource(resource as IResource);
              return resource.data.documentId;
            }
          }
        }
        return false;
      });
    }
    return false;
  }, [selectedResource, resources, documents, territoryId]);

  const {
    data: selectedDocument,
    error: selectedDocumentError,
    isFetching: selectedDocumentIsFetching,
  } = useQuery({
    queryKey: ["document", selectedDocumentId],
    queryFn: async () => {
      if (selectedDocumentId !== false) {
        const res = await api.documentGet(selectedDocumentId);
        return res.data;
      }
      return false;
    },
    enabled: api.isLoggedIn() && selectedDocumentId !== false,
  });

  const thisTHasAnchor = useMemo<boolean>(() => {
    if (selectedDocument) {
      // console.log(selectedDocument?.referencedEntityIds, territoryId);
      return selectedDocument?.referencedEntityIds.T.includes(territoryId);
    }
    return false;
  }, [
    selectedDocument && selectedDocument?.referencedEntityIds.T,
    territoryId,
  ]);

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
              setSelectedResource(entity as IResource);
            }}
          />
        )}
        {selectedResource && (
          <EntityTag
            entity={selectedResource}
            unlinkButton={{
              onClick: () => {
                setSelectedResource(false);
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
          <StyledDocumentInfo $color="success">
            <FaCheck />
            <i style={{ whiteSpace: "nowrap" }}>Anchor for T created</i>
          </StyledDocumentInfo>
        )}
        {!selectedDocumentIsFetching && selectedDocument && !thisTHasAnchor && (
          <StyledDocumentInfo $color="danger">
            <BiSolidCommentError />
            <i>No Anchor for this T</i>
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
            />
          )}
        </AnnotatorProvider>
      </div>
    </animated.div>
  );
};
