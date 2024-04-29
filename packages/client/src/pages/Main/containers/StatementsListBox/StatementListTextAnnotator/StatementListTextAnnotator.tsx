import { EntityEnums, UserEnums } from "@shared/enums";
import { IEntity, IResource, IResponseStatement } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { Loader } from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import TextAnnotator from "components/advanced/Annotator/Annotator";
import AnnotatorProvider from "components/advanced/Annotator/AnnotatorProvider";
import { useSearchParams } from "hooks";
import React, { useMemo, useState } from "react";
import { TiDocumentText } from "react-icons/ti";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import {
  StyledDocumentInfo,
  StyledDocumentTag,
} from "../StatementLitBoxStyles";
import { FaCheck } from "react-icons/fa";
import { BiSolidCommentError } from "react-icons/bi";
import { GrDocumentMissing } from "react-icons/gr";

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
}) => {
  const dispatch = useAppDispatch();

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

  const panelWidths: number[] = useAppSelector(
    (state) => state.layout.panelWidths
  );

  const contentHeight = useAppSelector((state) => state.layout.contentHeight);

  // check if detail box is opened
  const { detailIdArray } = useSearchParams();
  const detailOpen = detailIdArray.length > 0;

  // Calculate annotator height
  const annotatorHeight = useMemo<number>(() => {
    const margin = 270;
    if (detailOpen) {
      return contentHeight / 2 - margin;
    } else {
      return contentHeight - margin;
    }
  }, [detailOpen, contentHeight]);

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

  // console.log(thisTHasAnchor);

  return (
    <div>
      <div
        style={{
          alignItems: "center",
          display: "inline-flex",
          padding: "2px 10px",
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
            <TiDocumentText style={{ marginRight: "2px" }} />
            {selectedDocument?.title}
          </StyledDocumentTag>
        )}
        {!selectedDocumentIsFetching && selectedDocument && thisTHasAnchor && (
          <StyledDocumentInfo $color="success">
            <FaCheck />
            <i>Anchor for T created</i>
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
      <div style={{ marginTop: "2px" }}>
        <AnnotatorProvider>
          {selectedDocumentId && (
            <TextAnnotator
              width={panelWidths[1]}
              displayLineNumbers={true}
              height={annotatorHeight}
              documentId={selectedDocumentId}
              handleCreateStatement={handleCreateStatement}
              handleCreateTerritory={handleCreateTerritory}
            />
          )}
        </AnnotatorProvider>
      </div>
    </div>
  );
};
