import React, { useEffect, useMemo, useState } from "react";
import { StyledAnnotatorBox } from "./AnnotatorBoxStyles";
import { AnnotatorContainer } from "./AnnotatorContainer/AnnotatorContainer";
import { DetailBoxState, EditorBoxState } from "types";
import { useAppSelector } from "redux/hooks";
import { useSearchParams } from "hooks/useSearchParamsContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "api";
import { Annotator } from "@inkvisitor/annotator/src/lib/Annotator";
import useAnnotator from "hooks/useAnnotator";
import { EntityEnums, UserEnums } from "@shared/enums";
import {
  IDocument,
  IResponseEntity,
  IResponseGeneric,
  IStatement,
} from "@shared/types";
import { AxiosResponse } from "axios";
import { UseMutationResult } from "@tanstack/react-query";
import { COLLAPSED_PANEL_WIDTH } from "Theme/constants";

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

  const contentHeightAnnotator = useMemo(() => {
    if (!statementId) {
      return contentHeight;
    } else if (editorBoxState === EditorBoxState.Normal) {
      return contentHeight / 2;
    } else if (editorBoxState === EditorBoxState.Minimized) {
      return contentHeight - 56; // 56 is the height of the submit button
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

  const statementCreateMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric<IStatement>, unknown>,
    Error,
    IStatement,
    unknown
  > = useMutation({
    mutationFn: async (statement: IStatement) => {
      return api.entityCreate(statement);
    },
  });

  return (
    <StyledAnnotatorBox>
      <AnnotatorContainer
        contentHeight={contentHeightAnnotator || 0}
        contentWidth={contentWidth - 10}
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
