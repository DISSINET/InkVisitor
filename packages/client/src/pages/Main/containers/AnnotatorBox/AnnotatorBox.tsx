import { Annotator } from "@inkvisitor/annotator/src/lib/Annotator";
import { EntityEnums, UserEnums } from "@shared/enums";
import {
  IDocument,
  IResponseEntity,
  IResponseGeneric,
  IResponseStatement,
  IResponseTerritory,
  IStatement,
} from "@shared/types";
import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "api";
import { AxiosResponse } from "axios";
import useAnnotator from "hooks/useAnnotator";
import { useSearchParams } from "hooks/useSearchParamsContext";
import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { COLLAPSED_PANEL_WIDTH } from "Theme/constants";
import { EditorBoxState } from "types";
import { StyledAnnotatorBox } from "./AnnotatorBoxStyles";
import { AnnotatorContainer } from "./AnnotatorContainer/AnnotatorContainer";
import { toast } from "react-toastify";
import { setDisableStatementListScroll } from "redux/features/statementList/disableStatementListScrollSlice";

export const AnnotatorBox: React.FC = () => {
  const {
    territoryId,
    setTerritoryId,
    statementId,
    setStatementId,
    selectedDetailId,
    detailIdArray,
    removeDetailId,
    appendDetailId,
  } = useSearchParams();

  const editorBoxState = useAppSelector(
    (state) => state.layout.mainPage.editorBoxState
  );
  const contentHeight = useAppSelector((state) => state.layout.contentHeight);
  const panelWidths = useAppSelector(
    (state) => state.layout.mainPage.panelWidths
  );
  const thirdPanelExpanded = useAppSelector(
    (state) => state.layout.mainPage.thirdPanelExpanded
  );
  const fourthPanelExpanded = useAppSelector(
    (state) => state.layout.mainPage.fourthPanelExpanded
  );
  const annotatorOpened: boolean = useAppSelector(
    (state) => state.layout.mainPage.annotatorOpened
  );
  const statementListOpened: boolean = useAppSelector(
    (state) => state.layout.mainPage.statementListOpened
  );
  const selectedTerritoryPath: string[] = useAppSelector(
    (state) => state.territoryTree.selectedTerritoryPath
  );

  const [annotator, setAnnotator] = useState<Annotator | undefined>(undefined);
  const [storedAnnotatorScrollPosition, setStoredAnnotatorScrollPosition] =
    useState<number | null>(null);

  // useEffect(() => {
  //   console.log("storedAnnotatorScrollPosition", storedAnnotatorScrollPosition);
  // }, [storedAnnotatorScrollPosition]);

  useEffect(() => {
    setStoredAnnotatorScrollPosition(null);
  }, [territoryId]);

  const { setAnnotator: useAnnotatorSetAnnotator } = useAnnotator();

  useEffect(() => {
    if (annotator) {
      useAnnotatorSetAnnotator(annotator);
    }
  }, [annotator, useAnnotatorSetAnnotator]);

  const [hlEntities, setHlEntities] = useState<EntityEnums.Class[]>([
    EntityEnums.Class.Action,
    EntityEnums.Class.Person,
    EntityEnums.Class.Being,
    EntityEnums.Class.Concept,
    EntityEnums.Class.Group,
    EntityEnums.Class.Location,
    EntityEnums.Class.Object,
    EntityEnums.Class.Event,
    EntityEnums.Class.Resource,
    EntityEnums.Class.Person,
    EntityEnums.Class.Statement,
    EntityEnums.Class.Value,
    EntityEnums.Class.Territory,
  ]);

  const annotatorHeaderHeight = 32;

  const contentHeightAnnotator = useMemo(() => {
    if (!statementId) {
      return contentHeight;
    } else if (editorBoxState === EditorBoxState.Normal) {
      return contentHeight / 2 - annotatorHeaderHeight;
    } else if (editorBoxState === EditorBoxState.Minimized) {
      return contentHeight - 56 - annotatorHeaderHeight; // 56 is the height of the submit button
    }
    return contentHeight;
  }, [contentHeight, editorBoxState, statementId]);

  // Same width as MainPage third column (annotator + editor)
  const contentWidth = useMemo(() => {
    const w = !thirdPanelExpanded
      ? COLLAPSED_PANEL_WIDTH
      : fourthPanelExpanded
      ? panelWidths[2]
      : panelWidths[2] + panelWidths[3] - COLLAPSED_PANEL_WIDTH;
    return Math.max(w - 10, 0);
  }, [thirdPanelExpanded, fourthPanelExpanded, panelWidths]);

  // get user
  const userId = localStorage.getItem("userid");
  const {
    status: userStatus,
    data: userData,
    error: userError,
    isFetching: userIsFetching,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (userId) {
        const res = await api.usersGet(userId);
        return res.data ?? undefined;
      }
      return undefined;
    },
    enabled: api.isLoggedIn() && !!userId,
  });

  const {
    status,
    data: territory,
    error,
    isFetching: isFetchingTerritory,
  } = useQuery({
    queryKey: ["territory", "annotator-box", territoryId, annotatorOpened],
    queryFn: async () => {
      const res = await api.territoryGet(territoryId);
      return res.data;
    },
    enabled: !!territoryId && api.isLoggedIn(),
  });

  const [storedAnnotatorResourceId, setStoredAnnotatorResourceId] = useState<
    string | false
  >(false);

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
    error: documentsError,
    isFetching: documentsIsFetching,
  } = useQuery<IDocument[]>({
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
      if (selectedDocumentId) {
        const res = await api.documentGet(selectedDocumentId);
        return res.data ?? undefined;
      }
      return undefined;
    },
    enabled: api.isLoggedIn() && !!selectedDocumentId,
  });

  const userCanEdit = useMemo(
    () => territory?.right !== UserEnums.RoleMode.Read,
    [territory]
  );

  const [isInitialized, setIsInitialized] = useState(false);

  const loadDefaultResource = () => {
    if (resources && documents && !isInitialized) {
      // First try to find resource with document containing territoryId
      let resourceWithAnchor = resources.find((resource) => {
        if (resource.data.documentId) {
          const document = documents.find(
            (d) => d.id === resource.data.documentId
          );
          if (document) {
            return document.entityIds.T.includes(territoryId);
          }
        }
        return false;
      });

      // If not found, try each territory in the path in reverse order
      if (!resourceWithAnchor) {
        for (let i = selectedTerritoryPath.length - 1; i > 0; i--) {
          const territoryInPath = selectedTerritoryPath[i];
          resourceWithAnchor = resources.find((resource) => {
            if (resource.data.documentId) {
              const document = documents.find(
                (d) => d.id === resource.data.documentId
              );
              if (document) {
                return document.entityIds.T.includes(territoryInPath);
              }
            }
            return false;
          });
          if (resourceWithAnchor) break;
        }
      }

      if (resourceWithAnchor) {
        setSelectedResourceId(resourceWithAnchor.id);
      } else {
        setSelectedResourceId(false);
      }

      setIsInitialized(true);
    }
  };

  useEffect(() => {
    loadDefaultResource();
  }, [resources, documents, isInitialized, territoryId]);

  useEffect(() => {
    setIsInitialized(false);
  }, [territoryId]);

  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  const statementCreateMutation = useMutation({
    mutationFn: async (newStatement: IStatement) =>
      await api.entityCreate(newStatement),
    // OPTIMISTIC MUTATION to locate statement correctly in the annotator
    onMutate: async (newStatement: IStatement) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: ["territory", "statement-list", territoryId],
      });
      await queryClient.cancelQueries({
        queryKey: ["document", selectedDocumentId],
      });

      // Snapshot the previous values for rollback
      const previousTerritory = queryClient.getQueryData<IResponseTerritory>([
        "territory",
        "statement-list",
        territoryId,
        statementListOpened,
      ]);
      const previousDocument = queryClient.getQueryData<IDocument | undefined>([
        "document",
        selectedDocumentId,
      ]);

      // Optimistically update territory cache
      if (previousTerritory && newStatement.data.territory) {
        const optimisticStatement: IResponseStatement = {
          ...newStatement,
          entities: {},
          usedInDocuments: [],
          warnings: [],
          right: previousTerritory.right,
        };

        const updatedStatements = [...previousTerritory.statements];
        // Insert statement at correct position based on order
        const order = newStatement.data.territory.order;
        const insertIndex = updatedStatements.findIndex(
          (s) => (s.data.territory?.order ?? 0) > order
        );
        if (insertIndex === -1) {
          updatedStatements.push(optimisticStatement);
        } else {
          updatedStatements.splice(insertIndex, 0, optimisticStatement);
        }

        queryClient.setQueryData<IResponseTerritory>(
          ["territory", "statement-list", territoryId, statementListOpened],
          {
            ...previousTerritory,
            statements: updatedStatements,
          }
        );
      }

      // Optimistically update document cache
      if (previousDocument && selectedDocumentId) {
        const statementId = newStatement.id;
        const currentStatementIds =
          previousDocument.entityIds[EntityEnums.Class.Statement] || [];

        if (!currentStatementIds.includes(statementId)) {
          queryClient.setQueryData<IDocument>(
            ["document", selectedDocumentId],
            {
              ...previousDocument,
              entityIds: {
                ...previousDocument.entityIds,
                [EntityEnums.Class.Statement]: [
                  ...currentStatementIds,
                  statementId,
                ],
              },
            }
          );
        }
      }

      // Return context with snapshot values for potential rollback
      return { previousTerritory, previousDocument };
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousTerritory) {
        queryClient.setQueryData<IResponseTerritory>(
          ["territory", "statement-list", territoryId, statementListOpened],
          context.previousTerritory
        );
      }
      if (context?.previousDocument) {
        queryClient.setQueryData<IDocument | undefined>(
          ["document", selectedDocumentId],
          context.previousDocument
        );
      }
      toast.error(`Error: Statement not created!`);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["territory", "statement-list", territoryId],
      });
      if (selectedDocumentId) {
        queryClient.invalidateQueries({
          queryKey: ["document", selectedDocumentId],
        });
      }
      setStatementId(variables.id);
      queryClient.invalidateQueries({ queryKey: ["tree"] });
      dispatch(setDisableStatementListScroll(false));
    },
  });

  return (
    <StyledAnnotatorBox>
      <AnnotatorContainer
        contentHeight={contentHeightAnnotator || 0}
        contentWidth={contentWidth}
        territoryId={territoryId}
        territory={territory}
        statementId={statementId}
        storedAnnotatorScrollPosition={storedAnnotatorScrollPosition}
        setStoredAnnotatorScrollPosition={setStoredAnnotatorScrollPosition}
        hlEntities={hlEntities}
        setHlEntities={setHlEntities}
        statementCreateMutation={statementCreateMutation}
        annotator={annotator}
        setAnnotator={setAnnotator}
        selectedDocumentId={selectedDocumentId}
        selectedDocument={selectedDocument}
        selectedDocumentIsFetching={selectedDocumentIsFetching}
        selectedDocumentError={selectedDocumentError}
        selectedResource={selectedResource}
        resources={resources}
        setSelectedResourceId={setSelectedResourceId}
        userCanEdit={userCanEdit}
        userData={userData}
      />
    </StyledAnnotatorBox>
  );
};

export const MemoizedAnnotatorBox = React.memo(AnnotatorBox);
