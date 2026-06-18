import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import {
  IDocument,
  IEntity,
  IReference,
  IResponseGeneric,
  IResponseStatement,
  IResponseTerritory,
  IResponseTree,
  IStatement,
  IStatementDataTerritory,
  ITerritory,
  Relation,
} from "@inkvisitor/shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import api from "api";
import { CustomScrollbar, Loader, Submit, ToastWithLink } from "components";
import { CStatement } from "constructors";
import { useSearchParams } from "hooks";
import useAnnotator from "hooks/useAnnotator";
import React, { useEffect, useMemo, useState } from "react";
import { BsInfoCircle } from "react-icons/bs";
import { toast } from "react-toastify";
import { setStatementListOpened } from "redux/features/layout/mainPage/statementListOpenedSlice";
import { setShowWarnings } from "redux/features/statementEditor/showWarningsSlice";
import { setDisableStatementListScroll } from "redux/features/statementList/disableStatementListScrollSlice";
import { setRowsExpanded } from "redux/features/statementList/rowsExpandedSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { SECOND_PANEL_MIN_WIDTH } from "Theme/constants";
import {
  EntitiesDeleteSuccessResponse,
  StatementListDisplayMode,
  StatementOrderCorrection,
} from "types";
import { collectStatementAnchors, getStatementOrderByIndex, searchTree } from "utils/utils";
import { handleDeleteEntityError } from "utils/deleteEntityConflict";
import { openRestoredEntity } from "utils/openRestoredEntity";
import {
  StyledContentWrapper,
  StyledEmptyState,
  StyledInfoWrapper,
  StyledLoaderWrap,
  StyledStatementListBox,
  StyledTableWrapper,
} from "./StatementListBoxStyles";
import { StatementListHeader } from "./StatementListHeader/StatementListHeader";
import { StatementListTable } from "./StatementListTable/StatementListTable";
import { useUserQuery } from "hooks/react-query";

const initialData: {
  statements: IResponseStatement[];
  entities: { [key: string]: IEntity };
  right: UserEnums.RoleMode;
} = {
  statements: [],
  entities: {},
  right: UserEnums.RoleMode.Read,
};

export const StatementListBox: React.FC = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const rowsExpanded: string[] = useAppSelector((state) => state.statementList.rowsExpanded);
  const statementListOpened: boolean = useAppSelector(
    (state) => state.layout.mainPage.statementListOpened
  );
  const isLoading: boolean = useAppSelector((state) => state.statementList.isLoading);

  const {
    territoryId,
    setTerritoryId,
    statementId,
    setStatementId,
    detailIdArray,
    removeDetailId,
    appendDetailId,
  } = useSearchParams();

  useEffect(() => {
    dispatch(setDisableStatementListScroll(false));
  }, [statementId, territoryId, statementListOpened]);

  useEffect(() => {
    if (!detailIdArray.length && !statementListOpened) {
      dispatch(setStatementListOpened(true));
    }
  }, [detailIdArray, statementListOpened]);

  const [showSubmit, setShowSubmit] = useState(false);
  const [statementToDelete, setStatementToDelete] = useState<IStatement>();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  // Hover sync (annotator -> list) and the selected resource now live in Redux,
  // shared with the separate AnnotatorBox.
  const annotatorHoveredStatementId = useAppSelector(
    (state) => state.statementAnnotator.hoveredStatementId
  );
  const selectedResourceId = useAppSelector(
    (state) => state.statementAnnotator.selectedResourceId
  );

  // The statement list is now always shown in full (the annotator lives in its
  // own box); the legacy list/annotator toggle has been removed.
  const displayMode: StatementListDisplayMode = StatementListDisplayMode.LIST;

  const {
    data: territory,
    error,
    isFetching: isFetchingTerritory,
  } = useQuery({
    queryKey: ["territory", "statement-list", territoryId, statementListOpened],
    queryFn: async () => {
      const res = await api.territoryGet(territoryId);
      return res.data;
    },
    enabled: !!territoryId && api.isLoggedIn(),
  });

  // Debug logging for territory query
  // console.log("Territory query debug:", {
  //   territoryId,
  //   statementListOpened,
  //   isLoggedIn: api.isLoggedIn(),
  //   queryEnabled: !!territoryId && api.isLoggedIn() && statementListOpened,
  //   status,
  //   territory,
  //   error,
  //   isFetchingTerritory,
  // });

  const { statements, entities, right } = territory || initialData;

  useEffect(() => {
    dispatch(setRowsExpanded([]));
  }, [territoryId]);

  // get user
  const { data: userData } = useUserQuery();

  const favoritedTerritoryIds = useMemo(() => {
    if (userData?.storedTerritories) {
      return userData.storedTerritories.map((territory) => territory.territory.id);
    }
    return [];
  }, [userData?.storedTerritories]);

  useEffect(() => {
    if (error && (error as any).error === "TerritoryDoesNotExits") {
      setTerritoryId("");
    }
  }, [error]);

  // delay of show content for fluent animation on open
  const [enableStatementListLoader, setEnableStatementListLoader] = useState(true);

  useEffect(() => {
    if (statementListOpened) {
      setTimeout(() => {
        setEnableStatementListLoader(true);
      }, 500);
    } else {
      setEnableStatementListLoader(false);
    }
  }, [statementListOpened]);

  // The list still needs the live annotator to scroll to anchors on row click.
  const { scrollToAnchor } = useAnnotator();

  // Resources are needed only to resolve the selected resource -> documentId so
  // the list can read the document for order-correction / auto-order. The
  // document itself comes from the same React Query cache the AnnotatorBox fills.
  const { data: resources } = useQuery({
    queryKey: ["resourcesWithDocuments"],
    queryFn: async () => {
      const res = await api.entitiesSearch({
        resourceHasDocument: true,
      });
      return res.data;
    },
    enabled: api.isLoggedIn(),
  });

  const selectedDocumentId = useMemo<string | undefined>(() => {
    if (selectedResourceId && resources) {
      return resources.find((r) => r.id === selectedResourceId)?.data.documentId;
    }
    return undefined;
  }, [selectedResourceId, resources]);

  const { data: selectedDocument } = useQuery({
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

  const deleteStatementMutation = useMutation({
    mutationFn: async (sId: string) => await api.entityDelete(sId, { ignoreErrorToast: true }),
    onSuccess: (data, sId) => {
      toast.info(
        <ToastWithLink
          children={`Statement deleted!`}
          linkText={"Restore"}
          onLinkClick={async () => {
            const response = await api.entityRestore(sId);
            toast.info("Statement restored");
            openRestoredEntity(response.data.data as IEntity, {
              setTerritoryId,
              setStatementId,
              appendDetailId,
            });
            queryClient.invalidateQueries({
              queryKey: ["detail-tab-entities"],
            });
            queryClient.invalidateQueries({ queryKey: ["tree"] });
            queryClient.invalidateQueries({ queryKey: ["territory"] });
          }}
        />,
        {
          autoClose: 5000,
        }
      );

      if (detailIdArray.includes(sId)) {
        removeDetailId(sId);
        queryClient.invalidateQueries({ queryKey: ["detail-tab-entities"] });
      }
      dispatch(setRowsExpanded(rowsExpanded.filter((r) => r !== sId)));
      queryClient.invalidateQueries({ queryKey: ["tree"] });
      queryClient.invalidateQueries({ queryKey: ["territory"] }).then(() => {
        setStatementId("");
      });
      setSelectedRows(selectedRows.filter((r) => r !== sId));
    },
    onError: (error, sId) => {
      if (!handleDeleteEntityError(error, sId, appendDetailId, "warning")) {
        toast.error((error as any).message);
      }
    },
  });

  const cloneStatementMutation = useMutation({
    mutationFn: async (entityId: string) => await api.entityClone(entityId),
    onSuccess: (data, variables) => {
      setStatementId(data.data.data.id);
      toast.info(`Statement duplicated!`);
      queryClient.invalidateQueries({ queryKey: ["territory"] });
      queryClient.invalidateQueries({ queryKey: ["entity"] });
      queryClient.invalidateQueries({ queryKey: ["tree"] });
    },
    onError: () => {
      toast.error(`Error: Statement not duplicated!`);
    },
  });

  const addStatementAtTheEndMutation = useMutation({
    mutationFn: async (newStatement: IStatement) => {
      await api.entityCreate(newStatement);
    },
    onSuccess: (data, variables) => {
      setStatementId(variables.id);
      queryClient.invalidateQueries({ queryKey: ["territory"] });
      queryClient.invalidateQueries({ queryKey: ["tree"] });
      dispatch(setDisableStatementListScroll(false));
    },
  });

  const statementCreateMutation = useMutation({
    mutationFn: async (newStatement: IStatement) => await api.entityCreate(newStatement),
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
        const currentStatementIds = previousDocument.entityIds[EntityEnums.Class.Statement] || [];

        if (!currentStatementIds.includes(statementId)) {
          queryClient.setQueryData<IDocument>(["document", selectedDocumentId], {
            ...previousDocument,
            entityIds: {
              ...previousDocument.entityIds,
              [EntityEnums.Class.Statement]: [...currentStatementIds, statementId],
            },
          });
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
      // TODO: only invalidate if text is highlighted (annotatorMenu is open)
      queryClient.invalidateQueries({ queryKey: ["anchorEntities"] });
      setStatementId(variables.id);
      queryClient.invalidateQueries({ queryKey: ["tree"] });
      dispatch(setDisableStatementListScroll(false));
    },
  });

  const addStatementAtCertainIndex = async (index: number) => {
    if (userData) {
      let newOrder = getStatementOrderByIndex(index, statements);

      if (newOrder) {
        const newStatement: IStatement = CStatement(
          localStorage.getItem("userrole") as UserEnums.Role,
          userData.options,
          "",
          "",
          territoryId
        );
        (newStatement.data.territory as IStatementDataTerritory).order = newOrder;

        statementCreateMutation.mutate(newStatement);
      }
    }
  };

  const statementUpdateMutation = useMutation({
    mutationFn: async (statementObject: { statementId: string; data: {} }) =>
      await api.entityUpdate(statementObject.statementId, {
        data: statementObject.data,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["territory"] });
    },
    onError: () => {
      toast.error(`Error: Statement order not changed!`);
    },
  });

  const moveStatementsMutation = useMutation({
    mutationFn: async (data: { statements: string[]; newTerritoryId: string }) =>
      await api.statementsBatchMove(data.statements, data.newTerritoryId),
    onSuccess: (variables, data) => {
      queryClient.invalidateQueries({ queryKey: ["territory"] });
      queryClient.invalidateQueries({ queryKey: ["tree"] });
      toast.info(
        `${data.statements.length} statement${data.statements.length > 1 ? "s" : ""} moved`
      );
      setSelectedRows([]);
      setTerritoryId(data.newTerritoryId);
    },
  });

  const duplicateStatementsMutation = useMutation({
    mutationFn: async (data: { statements: string[]; newTerritoryId?: string }) =>
      await api.statementsBatchCopy(data.statements, data.newTerritoryId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["territory"] });
      queryClient.invalidateQueries({ queryKey: ["tree"] });
      const incomplete =
        (
          response as AxiosResponse<IResponseGeneric> & {
            incompleteCloneFailures?: number;
          }
        ).incompleteCloneFailures ?? 0;
      const total = variables.statements.length;
      const duplicated = total - incomplete;
      toast.info(`${duplicated} statement${duplicated !== 1 ? "s" : ""} duplicated`);
      setSelectedRows([]);
      if (variables.newTerritoryId) {
        setTerritoryId(variables.newTerritoryId);
      }
    },
  });

  const replaceReferencesMutation = useMutation({
    mutationFn: async (references: IReference[]) =>
      await api.statementsReferencesReplace(selectedRows, references),
    onSuccess: (variables, references) => {
      // TODO:
      queryClient.invalidateQueries({ queryKey: ["statement"] });
    },
  });

  const appendReferencesMutation = useMutation({
    mutationFn: async (references: IReference[]) =>
      await api.statementsReferencesAppend(selectedRows, references),
    onSuccess: (variables, references) => {
      // TODO:
      queryClient.invalidateQueries({ queryKey: ["statement"] });
    },
  });

  const updateTerritoryMutation = useMutation({
    mutationFn: async (tObject: { territoryId: string; changes: Partial<ITerritory> }) =>
      await api.entityUpdate(tObject.territoryId, tObject.changes),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tree"] });
      queryClient.invalidateQueries({ queryKey: ["territory"] });
    },
  });

  const duplicateTerritoryMutation = useMutation({
    mutationFn: async (tObject: {
      territoryId: string;
      targets: string[];
      withChildren: boolean;
    }) => await api.territoriesCopy(tObject.territoryId, tObject.targets, tObject.withChildren),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tree"] });
      queryClient.invalidateQueries({ queryKey: ["territory"] });
    },
  });

  const deleteStatementsMutation = useMutation({
    mutationFn: () => api.entitiesDelete(selectedRows, { ignoreErrorToast: true }),
    onSuccess: (responseArray, variables) => {
      const currentStatementRowDeleted = responseArray.find((row) => row.entityId === statementId);
      if (currentStatementRowDeleted && !(currentStatementRowDeleted as any).error) {
        setStatementId("");
      }

      const deletedRows = responseArray.filter((row) => !(row as any).error);
      const deletedIds = (deletedRows as EntitiesDeleteSuccessResponse[]).map(
        (row) => row.entityId
      );

      if (deletedIds.length < selectedRows.length) {
        toast.error(
          `Some statements (${selectedRows.length - deletedIds.length}) are not possible to delete`
        );
      }

      setSelectedRows(selectedRows.filter((r) => !deletedIds.includes(r)));
      dispatch(setRowsExpanded(rowsExpanded.filter((r) => !deletedIds.includes(r))));

      queryClient.invalidateQueries({
        queryKey: ["tree"],
      });
      queryClient.invalidateQueries({
        queryKey: ["territory"],
      });
    },
  });

  const relationsCreateMutation = useMutation({
    mutationFn: async (newRelations: Relation.IRelation[]) =>
      api.relationsCreate(newRelations, { ignoreErrorToast: true }),
    onSuccess: (data, variables) => {
      const errorRows = data.filter((row) => (row as any).error);
      const errorCount = errorRows.length;
      const successCount = data.length - errorCount;

      if (successCount > 0) {
        toast.success(`${successCount} relation${successCount === 1 ? "" : "s"} created`);
      }
      if (errorCount > 0) {
        if (errorRows[0].details.error === "RelationPathExist") {
          toast.error(
            `${errorCount} relation${errorCount === 1 ? "" : "s"} to this entity already existed`
          );
        } else {
          toast.error(`Some relations ${errorCount} were not possible to create`);
        }
      }
      queryClient.invalidateQueries({
        queryKey: ["territory"],
      });
      queryClient.invalidateQueries({
        queryKey: ["entity"],
      });
    },
  });

  const autoOrderStatementsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocument) return;

      // Collect anchors from the document and remove duplicates
      const statementAnchors = Array.from(
        new Map(
          collectStatementAnchors(selectedDocument.anchors).map((anchor) => [anchor.anchor, anchor])
        ).values()
      );
      // only filter the statement anchors that are in the statements list
      const statementIds = new Set(statements.map((s) => s.id));
      const statementAnchorsInList = statementAnchors.filter((anchor) =>
        statementIds.has(anchor.anchor)
      );

      const correctPositionMap = new Map(
        statementAnchorsInList.map((anchor, index) => [anchor.anchor, index])
      );

      // Separate anchored and non-anchored statements
      const anchoredStatements = statements.filter((s) => correctPositionMap.has(s.id));
      const nonAnchoredStatements = statements.filter((s) => !correctPositionMap.has(s.id));

      // Sort anchored statements by their correct position
      const sortedAnchoredStatements = anchoredStatements.sort((a, b) => {
        const posA = correctPositionMap.get(a.id) ?? 0;
        const posB = correctPositionMap.get(b.id) ?? 0;
        return posA - posB;
      });

      // Interleave anchored and non-anchored statements based on their original relative positions
      const finalOrder: IResponseStatement[] = [];
      let anchoredIndex = 0;
      let nonAnchoredIndex = 0;

      statements.forEach((statement) => {
        if (correctPositionMap.has(statement.id)) {
          finalOrder.push(sortedAnchoredStatements[anchoredIndex++]);
        } else {
          finalOrder.push(nonAnchoredStatements[nonAnchoredIndex++]);
        }
      });

      const currentOrderMap = new Map(
        statements.map((statement) => [statement.id, statement.data.territory?.order])
      );

      const updates = finalOrder
        .map((statement, index) => ({
          id: statement.id,
          order: index + 1,
        }))
        .filter(({ id, order }) => currentOrderMap.get(id) !== order);

      if (updates.length) {
        await api.statementsBatchReorder(updates);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["territory"] });
      toast.info("Statements reordered according to document");
    },
    onError: () => {
      toast.error("Failed to reorder statements");
    },
  });

  const contentWidth = useAppSelector((state) => state.layout.mainPage.secondPanelRealWidth);
  const contentHeight = useAppSelector((state) => state.layout.contentHeight);

  // adds object orderCorrection to each statement with info about the order in the list vs the annotator
  const statementsWithOrder: (IResponseStatement & {
    orderCorrection?: StatementOrderCorrection;
    isAnchored?: boolean;
  })[] = useMemo(() => {
    if (!selectedDocument || !statements?.length) return statements ?? [];

    // Collect anchors from the document and remove duplicates
    const statementAnchors = Array.from(
      new Map(
        collectStatementAnchors(selectedDocument.anchors).map((anchor) => [anchor.anchor, anchor])
      ).values()
    );
    const statementIds = new Set(statements.map((s) => s.id));
    const statementAnchorsInList = statementAnchors.filter((anchor) =>
      statementIds.has(anchor.anchor)
    );

    // Create a map of statement IDs to their correct positions
    const correctPositionMap = new Map(
      // this index is the position of the statement IN THE DOCUMENT
      statementAnchorsInList.map((anchor, index) => [anchor.anchor, index])
    );

    // First, create a map of all statements with their original indexes
    const statementsWithCorrectPosition = statements.map((statement, index) => ({
      statement,
      isAnchored: correctPositionMap.has(statement.id),
      correctPosition: correctPositionMap.get(statement.id),
    }));

    // Filter and sort only anchored statements
    const anchoredStatements = statementsWithCorrectPosition.filter((item) => item.isAnchored);

    // Create a map of territory statements (anchored) with position in the list
    const currentAnchoredPositions = new Map(
      // this index is the position of the statement IN THE LIST
      anchoredStatements.map((item, index) => [item.statement.id, index])
    );

    // Create a map of anchored statements with their corrections
    const anchoredCorrections = new Map(
      anchoredStatements.map((item) => [
        item.statement.id,
        {
          currentPosition: currentAnchoredPositions.get(item.statement.id) ?? 0,
          correctPosition: item.correctPosition ?? 0,
          shouldMoveUp:
            (item.correctPosition ?? 0) < (currentAnchoredPositions.get(item.statement.id) ?? 0),
          shouldMoveDown:
            (item.correctPosition ?? 0) > (currentAnchoredPositions.get(item.statement.id) ?? 0),
          distance: Math.abs(
            (item.correctPosition ?? 0) - (currentAnchoredPositions.get(item.statement.id) ?? 0)
          ),
        },
      ])
    );

    // Reconstruct the array in original order with corrections
    return statementsWithCorrectPosition.map(({ statement, isAnchored }) => ({
      ...statement,
      isAnchored,
      orderCorrection: isAnchored ? anchoredCorrections.get(statement.id) : null,
    }));
  }, [selectedDocument, statements]);

  const isListNonEmpty = statements.length > 0;

  // Check if there are statements to determine if the list is loading
  const treeData: IResponseTree | undefined = queryClient.getQueryData(["tree"]);
  const statementsCount = useMemo(() => {
    if (treeData) {
      const currentTerritory = searchTree(treeData, territoryId);
      if (currentTerritory) {
        return currentTerritory.statementsCount;
      }
      return 0;
    }
  }, [treeData, territoryId]);

  const isListLoading = statementsCount && statementsCount > 0 && isFetchingTerritory;

  const statementListTableIsLoading =
    isListLoading ||
    isLoading ||
    deleteStatementMutation.isPending ||
    addStatementAtTheEndMutation.isPending ||
    statementCreateMutation.isPending ||
    statementUpdateMutation.isPending ||
    moveStatementsMutation.isPending ||
    duplicateStatementsMutation.isPending ||
    cloneStatementMutation.isPending ||
    updateTerritoryMutation.isPending ||
    duplicateTerritoryMutation.isPending ||
    deleteStatementsMutation.isPending ||
    relationsCreateMutation.isPending ||
    autoOrderStatementsMutation.isPending ||
    (statementListOpened && !enableStatementListLoader);

  const tableWidth = useMemo(() => {
    if (isListNonEmpty || statementListTableIsLoading) {
      return contentWidth - 8;
    }
    return 0;
  }, [contentWidth, isListNonEmpty, statementListTableIsLoading]);

  return (
    <StyledStatementListBox>
      {
        <>
          <StatementListHeader
            territory={territory}
            isFetchingTerritory={isFetchingTerritory}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
            isAllSelected={isListNonEmpty && selectedRows.length === statements.length}
            moveStatementsMutation={moveStatementsMutation}
            duplicateStatementsMutation={duplicateStatementsMutation}
            replaceReferencesMutation={replaceReferencesMutation}
            appendReferencesMutation={appendReferencesMutation}
            updateTerritoryMutation={updateTerritoryMutation}
            // duplicateTerritoryMutation={duplicateTerritoryMutation}
            deleteStatementsMutation={deleteStatementsMutation}
            relationsCreateMutation={relationsCreateMutation}
            favoritedTerritoryIds={favoritedTerritoryIds}
            contentWidthTooNarrow={contentWidth < SECOND_PANEL_MIN_WIDTH + 60}
            statementsWithOrder={statementsWithOrder}
            autoOrderStatementsMutation={autoOrderStatementsMutation}
          />
          {!territoryId && (
            <StyledInfoWrapper>
              <StyledEmptyState>
                <BsInfoCircle size="23" />
              </StyledEmptyState>
              <StyledEmptyState>
                {"No territory selected yet. Pick one from the territory tree"}
              </StyledEmptyState>
            </StyledInfoWrapper>
          )}

          {territoryId &&
            statements.length === 0 &&
            displayMode === StatementListDisplayMode.LIST &&
            statementListOpened &&
            !isFetchingTerritory && (
              <>
                <StyledEmptyState>
                  <BsInfoCircle size="23" />
                </StyledEmptyState>
                <StyledEmptyState>{"No statements yet."}</StyledEmptyState>
              </>
            )}

          {territoryId && (
            <StyledContentWrapper

            // ref={contentRef}
            >
              <CustomScrollbar
                scrollerId="Statements"
                elementId="Statements-box-table"
                contentWidth={tableWidth}
                customStyle={{
                  display: "flex",
                  flexShrink: 0,
                  height: "100%",
                }}
              >
                <StyledTableWrapper $isListMode={displayMode === StatementListDisplayMode.LIST}>
                  {isListNonEmpty && (
                    <StatementListTable
                      statements={statementsWithOrder}
                      handleRowClick={(rowId: string) => {
                        dispatch(setShowWarnings(false));
                        if (statementId !== rowId) {
                          setStatementId(rowId);
                        } else {
                          scrollToAnchor(rowId);
                        }
                      }}
                      actantsUpdateMutation={statementUpdateMutation}
                      entities={entities}
                      right={right}
                      cloneStatementMutation={cloneStatementMutation}
                      setStatementToDelete={setStatementToDelete}
                      setShowSubmit={setShowSubmit}
                      addStatementAtCertainIndex={addStatementAtCertainIndex}
                      selectedRows={selectedRows}
                      setSelectedRows={setSelectedRows}
                      displayMode={displayMode}
                      isLoading={statementListTableIsLoading}
                      annotatorHoveredStatementId={annotatorHoveredStatementId}
                    />
                  )}
                </StyledTableWrapper>
              </CustomScrollbar>

              {statementListTableIsLoading &&
                tableWidth > 0 &&
                contentHeight > 0 &&
                enableStatementListLoader && (
                  <StyledLoaderWrap $width={tableWidth + 4} $height={contentHeight + 4}>
                    <Loader show size={50} />
                  </StyledLoaderWrap>
                )}
            </StyledContentWrapper>
          )}

          <Submit
            title="Delete statement"
            text={`Do you really want to delete statement [${
              statementToDelete?.labels[0] ? statementToDelete.labels[0] : statementToDelete?.id
            }]?`}
            show={showSubmit}
            entityToSubmit={statementToDelete}
            onCancel={() => {
              setShowSubmit(false);
              setStatementToDelete(undefined);
            }}
            onSubmit={() => {
              if (statementToDelete) {
                deleteStatementMutation.mutate(statementToDelete.id);
                setShowSubmit(false);
                setStatementToDelete(undefined);
              }
            }}
            loading={deleteStatementMutation.isPending}
          />
        </>
      }
    </StyledStatementListBox>
  );
};

export const MemoizedStatementListBox = React.memo(StatementListBox);
