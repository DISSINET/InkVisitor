import { Annotator } from "@inkvisitor/annotator/src/lib";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import {
  IDocument,
  IResponseEntity,
  IResponseStatement,
  IResponseTerritory,
  IStatement,
} from "@inkvisitor/shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { boxContentId } from "components";
import { useElementSize, useSearchParams } from "hooks";
import useAnnotator from "hooks/useAnnotator";
import {
  useDocumentQuery,
  useDocumentsQuery,
  useResourcesWithDocumentsQuery,
  useUserQuery,
} from "hooks/react-query";
import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { setSelectedResourceId } from "redux/features/statementAnnotator/selectedResourceIdSlice";
import { setHoveredStatementId } from "redux/features/statementAnnotator/hoveredStatementIdSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import {
  ANNOTATOR_MIN_WRAP_WIDTH,
  ANNOTATOR_RESIZE_DEBOUNCE_MS,
  THIRD_PANEL_MIN_WIDTH,
} from "Theme/constants";
import { AnnotatorBoxHeader } from "./AnnotatorBoxHeader";
import { StatementListTextAnnotator } from "./AnnotatorContent";
import { resolveAnnotatorResourceId } from "./resolveAnnotatorResourceId";

interface AnnotatorBox {
  height: number;
  width: number;
  /** Reported upward because MainPage owns the Box whose header this fills. */
  onHeaderChange: (header: { label: string; component: ReactNode }) => void;
}

export const AnnotatorBox: React.FC<AnnotatorBox> = ({ height, width, onHeaderChange }) => {
  // The canvas needs a pixel width, and neither source has it on its own. The
  // prop knows where the panel is heading the moment a toggle decides it, but
  // not about a drag (which moves the panel without telling React) or about a
  // scrollbar the box may be holding. The box knows both, but only once it has
  // stopped moving - it is animating for most of a toggle, and every width taken
  // re-wraps the whole document.
  //
  // So whichever moved last wins: a toggle lands on the target immediately and
  // the measurement corrects it afterwards if the box turned out narrower.
  const { width: measuredWidth } = useElementSize(
    boxContentId("Annotator"),
    ANNOTATOR_RESIZE_DEBOUNCE_MS,
  );

  // A collapsed panel leaves the box too narrow to draw the canvas at all, and
  // re-wrapping the document to fit that costs the same as re-wrapping it to a
  // real width - twice, since expanding has to undo it. The last real width
  // stands in, starting at the narrowest an expanded panel can be.
  const [contentWidth, setContentWidth] = useState(() =>
    Math.max(width, THIRD_PANEL_MIN_WIDTH),
  );

  // An effect per source, each firing only when its own source moved, which is
  // what makes the last mover the winner. The measurement always moves last:
  // it is published from a timer, so it lands in a render of its own, after the
  // prop that provoked it.
  useEffect(() => {
    if (width > ANNOTATOR_MIN_WRAP_WIDTH) {
      setContentWidth(width);
    }
  }, [width]);

  useEffect(() => {
    if (measuredWidth !== undefined && measuredWidth > ANNOTATOR_MIN_WRAP_WIDTH) {
      setContentWidth(measuredWidth);
    }
  }, [measuredWidth]);

  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { territoryId, statementId } = useSearchParams();
  const { data: userData } = useUserQuery();

  const selectedTerritoryPath: string[] = useAppSelector(
    (state) => state.territoryTree.selectedTerritoryPath,
  );
  const selectedResourceId = useAppSelector((state) => state.statementAnnotator.selectedResourceId);

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
    EntityEnums.Class.Statement,
    EntityEnums.Class.Value,
    EntityEnums.Class.Territory,
  ]);

  const [annotator, setAnnotatorState] = useState<Annotator | undefined>(undefined);
  const [storedAnnotatorScrollPosition, setStoredAnnotatorScrollPosition] = useState<number | null>(
    null,
  );
  const [hasUnsavedTextEdits, setHasUnsavedTextEdits] = useState(false);

  const { setAnnotator: setSingletonAnnotator } = useAnnotator();
  useEffect(() => {
    setSingletonAnnotator((annotator as any) ?? null);
  }, [annotator, setSingletonAnnotator]);

  // Reset scroll position when territory changes
  useEffect(() => {
    setStoredAnnotatorScrollPosition(null);
  }, [territoryId]);

  // Territory entity (same query key as StatementListBox — shared cache)
  const statementListOpened: boolean = useAppSelector(
    (state) => state.layout.mainPage.statementListOpened,
  );
  const { data: territory } = useQuery({
    queryKey: ["territory", "statement-list", territoryId, statementListOpened],
    queryFn: async () => {
      const res = await api.territoryGet(territoryId);
      return res.data;
    },
    enabled: !!territoryId && api.isLoggedIn(),
  });

  const { data: resources, refetch: refetchResources } =
    useResourcesWithDocumentsQuery(!!territoryId);

  const { data: documents } = useDocumentsQuery(!!territoryId);

  // Set once the user manually picks a resource so auto-load stops overriding it.
  const userPickedRef = useRef(false);

  // On territory change: let auto-load re-evaluate which resource to use.
  useEffect(() => {
    userPickedRef.current = false;
  }, [territoryId]);

  // Reconcile selectedResourceId with the resource whose document anchors this
  // territory (or an ancestor). SETS when one is found and CLEARS (false) when
  // none is — so switching to a territory without a document drops the stale
  // resource, document and warnings. Re-selecting the same id is a no-op, so the
  // annotator stays alive across territory switches that keep the same resource
  // instead of unmounting and remounting (#3092 follow-up). Skipped while the
  // user has manually picked a resource, until the next territory change resets
  // userPickedRef. Reruns as resources / documents / the territory path arrive.
  useEffect(() => {
    if (!resources || !documents || userPickedRef.current) {
      return;
    }

    const resolvedId = resolveAnnotatorResourceId(
      territoryId,
      selectedTerritoryPath,
      resources,
      documents,
    );

    if (resolvedId !== selectedResourceId) {
      dispatch(setSelectedResourceId(resolvedId));
    }
  }, [resources, documents, territoryId, selectedTerritoryPath, selectedResourceId, dispatch]);

  const selectedResource = useMemo<IResponseEntity | false>(() => {
    if (selectedResourceId && resources) {
      return resources.find((r) => r.id === selectedResourceId) ?? false;
    }
    return false;
  }, [selectedResourceId, resources]);

  const selectedDocumentId = useMemo<string | undefined>(() => {
    return selectedResource ? selectedResource.data.documentId : undefined;
  }, [selectedResource]);

  useEffect(() => {
    setHasUnsavedTextEdits(false);
  }, [selectedDocumentId]);

  // Refetch the active document when territory changes so anchors are fresh.
  // Uses a ref to only fire on actual territory change, not on other dep updates.
  const prevTerritoryIdForRefetchRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (prevTerritoryIdForRefetchRef.current !== territoryId && selectedDocumentId) {
      queryClient.invalidateQueries({ queryKey: ["document", selectedDocumentId] });
    }
    prevTerritoryIdForRefetchRef.current = territoryId;
  }, [territoryId, selectedDocumentId, queryClient]);

  const {
    data: selectedDocument,
    error: selectedDocumentError,
    isFetching: selectedDocumentIsFetching,
  } = useDocumentQuery(selectedDocumentId, {
    refetchOnWindowFocus: !hasUnsavedTextEdits,
  });

  const statementCreateMutation = useMutation({
    mutationFn: async (newStatement: IStatement) => await api.entityCreate(newStatement),
    onMutate: async (newStatement: IStatement) => {
      await queryClient.cancelQueries({
        queryKey: ["territory", "statement-list", territoryId],
      });
      await queryClient.cancelQueries({
        queryKey: ["document", selectedDocumentId],
      });
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
      if (previousTerritory && newStatement.data.territory) {
        const optimisticStatement: IResponseStatement = {
          ...newStatement,
          entities: {},
          usedInDocuments: [],
          warnings: [],
          right: previousTerritory.right,
        };
        const updatedStatements = [...previousTerritory.statements];
        const order = newStatement.data.territory.order;
        const insertIndex = updatedStatements.findIndex(
          (s) => (s.data.territory?.order ?? 0) > order,
        );
        if (insertIndex === -1) updatedStatements.push(optimisticStatement);
        else updatedStatements.splice(insertIndex, 0, optimisticStatement);
        queryClient.setQueryData<IResponseTerritory>(
          ["territory", "statement-list", territoryId, statementListOpened],
          { ...previousTerritory, statements: updatedStatements },
        );
      }
      if (previousDocument && selectedDocumentId) {
        const sId = newStatement.id;
        const currentStatementIds = previousDocument.entityIds[EntityEnums.Class.Statement] || [];
        if (!currentStatementIds.includes(sId)) {
          queryClient.setQueryData<IDocument>(["document", selectedDocumentId], {
            ...previousDocument,
            entityIds: {
              ...previousDocument.entityIds,
              [EntityEnums.Class.Statement]: [...currentStatementIds, sId],
            },
          });
        }
      }
      return { previousTerritory, previousDocument };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTerritory) {
        queryClient.setQueryData<IResponseTerritory>(
          ["territory", "statement-list", territoryId, statementListOpened],
          context.previousTerritory,
        );
      }
      if (context?.previousDocument) {
        queryClient.setQueryData<IDocument | undefined>(
          ["document", selectedDocumentId],
          context.previousDocument,
        );
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["territory", "statement-list", territoryId],
      });
      if (selectedDocumentId) {
        queryClient.invalidateQueries({
          queryKey: ["document", selectedDocumentId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["anchorEntities"] });
      queryClient.invalidateQueries({ queryKey: ["tree"] });
    },
  });

  // permission gating (mirrors the old StatementListBox computation)
  const userCanEdit = useMemo(() => territory?.right !== UserEnums.RoleMode.Read, [territory]);
  const canSelectResource = useMemo(
    () => userCanEdit || userData?.role === UserEnums.Role.Editor,
    [userCanEdit, userData?.role],
  );
  const canEditDocument = useMemo(() => {
    if (userData?.role === UserEnums.Role.Owner || userData?.role === UserEnums.Role.Admin) {
      return true;
    }
    if (userData?.role !== UserEnums.Role.Editor || !selectedResource) {
      return false;
    }
    const assignedResourceIds = userData.resourceRights?.map((r) => r.resource.id) ?? [];
    return assignedResourceIds.includes(selectedResource.id);
  }, [userData, selectedResource]);

  const handleStatementAnchorHover = (id: string | null) => {
    if (id && territory?.statements?.some((s) => s.id === id)) {
      dispatch(setHoveredStatementId(id));
    } else {
      dispatch(setHoveredStatementId(null));
    }
  };

  // MainPage owns the Box that hosts this header, so the label + header
  // element are reported upward rather than rendered here. `component` is a
  // fresh element every render; if it (or an inline callback) joined this
  // dependency list, MainPage's setState from onHeaderChange would re-render
  // this (memoized) box, rebuild the element and refire this effect - forever.
  // Depending only on the data the header is built from keeps it finite.
  useEffect(() => {
    onHeaderChange({
      label: selectedDocument?.title ?? "Annotator",
      component: (
        <AnnotatorBoxHeader
          selectedResource={selectedResource}
          setSelectedResourceId={(id) => {
            userPickedRef.current = true;
            dispatch(setSelectedResourceId(id));
          }}
          selectedDocument={selectedDocument}
          selectedDocumentIsFetching={selectedDocumentIsFetching}
          resources={resources || []}
          onResourcePickerFocus={() => refetchResources()}
          canSelectResource={canSelectResource}
          canEditDocument={canEditDocument}
        />
      ),
    });
  }, [
    selectedDocument,
    selectedDocumentIsFetching,
    selectedResource,
    resources,
    canSelectResource,
    canEditDocument,
  ]);

  return (
    <StatementListTextAnnotator
      contentHeight={height}
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
      setAnnotator={setAnnotatorState}
      selectedDocumentId={selectedDocumentId}
      selectedDocument={selectedDocument}
      selectedDocumentIsFetching={selectedDocumentIsFetching}
      selectedDocumentError={selectedDocumentError}
      selectedResource={selectedResource}
      showStatementList={false}
      userCanEdit={userCanEdit}
      canEditDocument={canEditDocument}
      userData={userData}
      onStatementAnchorHover={handleStatementAnchorHover}
      onUnsavedTextEditsChange={setHasUnsavedTextEdits}
    />
  );
};

export const MemoizedAnnotatorBox = React.memo(AnnotatorBox);
