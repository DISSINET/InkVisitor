import { Annotator } from "@inkvisitor/annotator/src/lib";
import { EntityEnums, UserEnums } from "@shared/enums";
import {
  IDocument,
  IEntity,
  IReference,
  IResponseEntity,
  IResponseStatement,
  IStatement,
  ITerritory,
  Relation,
} from "@shared/types";
import { IAnchorsNode } from "@shared/types/document";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { CustomScrollbar, Loader, Submit, ToastWithLink } from "components";
import { CStatement } from "constructors";
import { useResizeObserver, useSearchParams, useDebounce } from "hooks";
import React, { useEffect, useMemo, useState } from "react";
import { BsInfoCircle } from "react-icons/bs";
import { toast } from "react-toastify";
import { setStatementListOpened } from "redux/features/layout/mainPage/statementListOpenedSlice";
import { setShowWarnings } from "redux/features/statementEditor/showWarningsSlice";
import { setDisableStatementListScroll } from "redux/features/statementList/disableStatementListScrollSlice";
import { setRowsExpanded } from "redux/features/statementList/rowsExpandedSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import {
  COLLAPSED_PANEL_WIDTH,
  COLLAPSED_TABLE_WIDTH,
  SECOND_PANEL_MIN_WIDTH,
} from "Theme/constants";
import {
  EntitiesDeleteSuccessResponse,
  StatementListDisplayMode,
  StatementOrderCorrection,
} from "types";
import { StatementListHeader } from "./StatementListHeader/StatementListHeader";
import { StatementListTable } from "./StatementListTable/StatementListTable";
import { StatementListTextAnnotator } from "./StatementListTextAnnotator/StatementListTextAnnotator";
import useAnnotator from "hooks/useAnnotator";
import { StyledEmptyState, StyledTableWrapper } from "./StatementListBoxStyles";

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
  const rowsExpanded: string[] = useAppSelector(
    (state) => state.statementList.rowsExpanded
  );
  const statementListOpened: boolean = useAppSelector(
    (state) => state.layout.mainPage.statementListOpened
  );
  const isLoading: boolean = useAppSelector(
    (state) => state.statementList.isLoading
  );

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

  const {
    territoryId,
    setTerritoryId,
    statementId,
    setStatementId,
    detailIdArray,
    removeDetailId,
    appendDetailId,
    annotatorOpened,
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

  const displayMode: StatementListDisplayMode = useMemo(() => {
    if (annotatorOpened === null) {
      return StatementListDisplayMode.TEXT;
    }
    return annotatorOpened
      ? StatementListDisplayMode.TEXT
      : StatementListDisplayMode.LIST;
  }, [annotatorOpened]);

  const {
    status,
    data: territory,
    error,
    isFetching: isFetchingTerritory,
  } = useQuery({
    queryKey: ["territory", "statement-list", territoryId, statementListOpened],
    queryFn: async () => {
      const res = await api.territoryGet(territoryId);
      return res.data;
    },
    enabled: !!territoryId && api.isLoggedIn() && statementListOpened,
  });

  const { statements, entities, right } = territory || initialData;

  useEffect(() => {
    dispatch(setRowsExpanded([]));
  }, [territoryId]);

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
        return res.data;
      }
    },
    enabled: api.isLoggedIn() && !!userId,
  });

  const favoritedTerritoryIds = useMemo(() => {
    if (userData?.storedTerritories) {
      return userData.storedTerritories.map(
        (territory) => territory.territory.id
      );
    }
    return [];
  }, [userData?.storedTerritories]);

  useEffect(() => {
    if (error && (error as any).error === "TerritoryDoesNotExits") {
      setTerritoryId("");
    }
  }, [error]);

  const deleteStatementMutation = useMutation({
    mutationFn: async (sId: string) =>
      await api.entityDelete(sId, { ignoreErrorToast: true }),
    onSuccess: (data, sId) => {
      toast.info(
        <ToastWithLink
          children={`Statement deleted!`}
          linkText={"Restore"}
          onLinkClick={async () => {
            const response = await api.entityRestore(sId);
            toast.info("Statement restored");
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
    onError: (error) => {
      if (
        (error as any).error === "InvalidDeleteError" &&
        (error as any).data &&
        (error as any).data.length > 0
      ) {
        const { data } = error as any;
        toast.warning(
          "Statement cannot be deleted, click to open the conflicting entity in detail",
          {
            autoClose: 6000,
            onClick: () => {
              appendDetailId(data[0]);
            },
          }
        );
      } else {
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
    mutationFn: async (newStatement: IStatement) =>
      await api.entityCreate(newStatement),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["territory", "statement-list", territoryId],
      });
      setStatementId(variables.id);
      queryClient.invalidateQueries({ queryKey: ["tree"] });
      dispatch(setDisableStatementListScroll(false));
    },
    onError: () => {
      toast.error(`Error: Statement not created!`);
    },
  });

  const addStatementAtCertainIndex = async (index: number) => {
    let newOrder: number | false = false;

    if (userData) {
      if (index + 1 > statements.length) {
        // last one
        newOrder = EntityEnums.Order.Last;
      } else {
        if (index < 1 && statements[0].data.territory) {
          // first one
          newOrder = EntityEnums.Order.First;
        } else if (
          statements[index - 1].data.territory &&
          statements[index].data.territory
        ) {
          // somewhere between
          newOrder =
            ((
              statements[index - 1].data.territory as {
                order: number;
                territoryId: string;
              }
            ).order +
              (
                statements[index].data.territory as {
                  order: number;
                  territoryId: string;
                }
              ).order) /
            2;
        }
      }

      if (newOrder) {
        const newStatement: IStatement = CStatement(
          localStorage.getItem("userrole") as UserEnums.Role,
          userData.options,
          "",
          "",
          territoryId
        );
        (
          newStatement.data.territory as { order: number; territoryId: string }
        ).order = newOrder;

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
    mutationFn: async (data: {
      statements: string[];
      newTerritoryId: string;
    }) => await api.statementsBatchMove(data.statements, data.newTerritoryId),
    onSuccess: (variables, data) => {
      queryClient.invalidateQueries({ queryKey: ["territory"] });
      queryClient.invalidateQueries({ queryKey: ["tree"] });
      toast.info(
        `${data.statements.length} statement${
          data.statements.length > 1 ? "s" : ""
        } moved`
      );
      setSelectedRows([]);
      setTerritoryId(data.newTerritoryId);
    },
  });

  const duplicateStatementsMutation = useMutation({
    mutationFn: async (data: {
      statements: string[];
      newTerritoryId: string;
    }) => await api.statementsBatchCopy(data.statements, data.newTerritoryId),
    onSuccess: (variables, data) => {
      queryClient.invalidateQueries({ queryKey: ["territory"] });
      queryClient.invalidateQueries({ queryKey: ["tree"] });
      toast.info(
        `${data.statements.length} statement${
          data.statements.length > 1 ? "s" : ""
        } duplicated`
      );
      setSelectedRows([]);
      setTerritoryId(data.newTerritoryId);
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

  const handleCreateStatement = (
    text: string = "",
    statementId: string | undefined = undefined
  ) => {
    if (userData && territory) {
      const newStatement: IStatement = CStatement(
        localStorage.getItem("userrole") as UserEnums.Role,
        userData.options,
        text,
        "",
        territoryId,
        statementId
      );
      addStatementAtTheEndMutation.mutate(newStatement);
    }
  };

  const updateTerritoryMutation = useMutation({
    mutationFn: async (tObject: {
      territoryId: string;
      changes: Partial<ITerritory>;
    }) => await api.entityUpdate(tObject.territoryId, tObject.changes),
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
    }) =>
      await api.territoriesCopy(
        tObject.territoryId,
        tObject.targets,
        tObject.withChildren
      ),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tree"] });
      queryClient.invalidateQueries({ queryKey: ["territory"] });
    },
  });

  const deleteStatementsMutation = useMutation({
    mutationFn: () =>
      api.entitiesDelete(selectedRows, { ignoreErrorToast: true }),
    onSuccess: (responseArray, variables) => {
      const currentStatementRowDeleted = responseArray.find(
        (row) => row.entityId === statementId
      );
      if (
        currentStatementRowDeleted &&
        !(currentStatementRowDeleted as any).error
      ) {
        setStatementId("");
      }

      const deletedRows = responseArray.filter((row) => !(row as any).error);
      const deletedIds = (deletedRows as EntitiesDeleteSuccessResponse[]).map(
        (row) => row.entityId
      );

      if (deletedIds.length < selectedRows.length) {
        toast.error(
          `Some statements (${
            selectedRows.length - deletedIds.length
          }) are not possible to delete`
        );
      }

      setSelectedRows(selectedRows.filter((r) => !deletedIds.includes(r)));
      dispatch(
        setRowsExpanded(rowsExpanded.filter((r) => !deletedIds.includes(r)))
      );

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
        toast.success(
          `${successCount} relation${successCount === 1 ? "" : "s"} created`
        );
      }
      if (errorCount > 0) {
        if (errorRows[0].details.error === "RelationPathExist") {
          toast.error(
            `${errorCount} relation${
              errorCount === 1 ? "" : "s"
            } to this entity already existed`
          );
        } else {
          toast.error(
            `Some relations ${errorCount} were not possible to create`
          );
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

  // const autoOrderStatementsMutation = useMutation({
  //   mutationFn: async () => {
  //     if (!selectedDocument) return;

  //     const statementAnchors = collectStatementAnchors(
  //       selectedDocument.anchors
  //     );
  //     const correctPositionMap = new Map(
  //       statementAnchors.map((anchor, index) => [anchor.anchor, index])
  //     );

  //     // Separate anchored and non-anchored statements
  //     const anchoredStatements = statements.filter((s) =>
  //       correctPositionMap.has(s.id)
  //     );
  //     const nonAnchoredStatements = statements.filter(
  //       (s) => !correctPositionMap.has(s.id)
  //     );

  //     // Sort anchored statements by their correct position
  //     const sortedAnchoredStatements = anchoredStatements.sort((a, b) => {
  //       const posA = correctPositionMap.get(a.id) ?? 0;
  //       const posB = correctPositionMap.get(b.id) ?? 0;
  //       return posA - posB;
  //     });

  //     // Interleave anchored and non-anchored statements based on their original relative positions
  //     const finalOrder: IResponseStatement[] = [];
  //     let anchoredIndex = 0;
  //     let nonAnchoredIndex = 0;

  //     statements.forEach((statement) => {
  //       if (correctPositionMap.has(statement.id)) {
  //         finalOrder.push(sortedAnchoredStatements[anchoredIndex++]);
  //       } else {
  //         finalOrder.push(nonAnchoredStatements[nonAnchoredIndex++]);
  //       }
  //     });

  //     // Update each statement's order
  //     const updates = finalOrder.map((statement, index) => {
  //       const order = index * 100; // Use increments of 100 to leave room for future insertions
  //       return api.entityUpdate(statement.id, {
  //         data: {
  //           ...statement.data,
  //           territory: {
  //             ...statement.data.territory,
  //             order,
  //           },
  //         },
  //       });
  //     });

  //     await Promise.all(updates);
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["territory"] });
  //     toast.info("Statements reordered according to document");
  //   },
  //   onError: () => {
  //     toast.error("Failed to reorder statements");
  //   },
  // });

  const {
    ref: contentRef,
    // TODO: calculate height - contentHeight / 2 - StatementListHeader height
    height: contentHeight = 0,
    // width: contentWidth = 0,
  } = useResizeObserver<HTMLDivElement>({
    debounceDelay: 50,
  });

  const contentWidth = useDebounce(
    useAppSelector((state) => state.layout.mainPage.secondPanelRealWidth),
    100
  );

  const [storedAnnotatorResourceId, setStoredAnnotatorResourceId] = useState<
    string | false
  >(false);
  const [storedAnnotatorScroll, setStoredAnnotatorScroll] = useState<number>(0);

  // so the annotator jumps to the anchor
  useEffect(() => {
    setStoredAnnotatorResourceId(false);
    setStoredAnnotatorScroll(0);
  }, [territoryId]);

  // its needed as the scroll event is executed even when the annotator is not active
  useEffect(() => {
    if (!storedAnnotatorResourceId) {
      setStoredAnnotatorScroll(0);
    }
  }, [storedAnnotatorResourceId]);

  // delay of show content for fluent animation on open
  const [showStatementList, setShowStatementList] = useState(true);

  useEffect(() => {
    if (statementListOpened) {
      setTimeout(() => {
        setShowStatementList(true);
      }, 500);
    } else {
      setShowStatementList(false);
    }
  }, [statementListOpened]);

  const [annotator, setAnnotator] = useState<Annotator | undefined>(undefined);

  const { setAnnotator: useAnnotatorSetAnnotator } = useAnnotator();

  useEffect(() => {
    if (annotator) {
      useAnnotatorSetAnnotator(annotator);
    }
  }, [annotator, useAnnotatorSetAnnotator]);
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

  const [isInitialized, setIsInitialized] = useState(false);

  // if no resource is selected, select the document with this territoryId in document references
  const loadDefaultResource = () => {
    if (resources && documents && !isInitialized) {
      const resourceWithAnchor = resources.find((resource) => {
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
  } = useQuery<IDocument | false>({
    queryKey: ["document", selectedDocumentId],
    queryFn: async () => {
      if (selectedDocumentId) {
        const res = await api.documentGet(selectedDocumentId);
        return res.data;
      }
      return false;
    },
    enabled: api.isLoggedIn() && !!selectedDocumentId,
  });

  // collect all statement anchors that are in the statements list
  const collectStatementAnchors = (anchors: IAnchorsNode[]): IAnchorsNode[] => {
    const statementIds = new Set(statements.map((s) => s.id));
    return anchors.reduce((acc: any[], anchor) => {
      if (
        anchor.class === EntityEnums.Class.Statement &&
        statementIds.has(anchor.anchor)
      ) {
        acc.push(anchor);
      }
      if (anchor.children) {
        acc.push(...collectStatementAnchors(anchor.children));
      }
      return acc;
    }, []);
  };

  // adds object orderCorrection to each statement with info about the order in the list vs the annotator
  const statementsWithOrder: (IResponseStatement & {
    orderCorrection?: StatementOrderCorrection;
    isAnchored?: boolean;
  })[] = useMemo(() => {
    if (!selectedDocument || !statements.length) return statements;

    // Collect anchors from the document and remove duplicates
    const statementAnchors = Array.from(
      new Map(
        collectStatementAnchors(selectedDocument.anchors).map((anchor) => [
          anchor.anchor,
          anchor,
        ])
      ).values()
    );

    // Create a map of statement IDs to their correct positions
    const correctPositionMap = new Map(
      // this index is the position of the statement IN THE DOCUMENT
      statementAnchors.map((anchor, index) => [anchor.anchor, index])
    );

    // First, create a map of all statements with their original indexes
    const statementsWithCorrectPosition = statements.map(
      (statement, index) => ({
        statement,
        isAnchored: correctPositionMap.has(statement.id),
        correctPosition: correctPositionMap.get(statement.id),
      })
    );

    // Filter and sort only anchored statements
    const anchoredStatements = statementsWithCorrectPosition.filter(
      (item) => item.isAnchored
    );

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
            (item.correctPosition ?? 0) <
            (currentAnchoredPositions.get(item.statement.id) ?? 0),
          shouldMoveDown:
            (item.correctPosition ?? 0) >
            (currentAnchoredPositions.get(item.statement.id) ?? 0),
          distance: Math.abs(
            (item.correctPosition ?? 0) -
              (currentAnchoredPositions.get(item.statement.id) ?? 0)
          ),
        },
      ])
    );

    // Reconstruct the array in original order with corrections
    return statementsWithCorrectPosition.map(({ statement, isAnchored }) => ({
      ...statement,
      isAnchored,
      orderCorrection: isAnchored
        ? anchoredCorrections.get(statement.id)
        : null,
    }));
  }, [selectedDocument, statements]);

  const userCanEdit = useMemo(
    () => territory?.right !== UserEnums.RoleMode.Read,
    [territory]
  );

  const isListNonEmpty = statements.length > 0;

  const statementListTableIsLoading =
    isFetchingTerritory ||
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
    // autoOrderStatementsMutation.isPending ||
    (statementListOpened && !showStatementList);

  const tableWidth = useMemo(() => {
    if (isListNonEmpty || statementListTableIsLoading) {
      return displayMode === StatementListDisplayMode.LIST
        ? contentWidth - 8
        : COLLAPSED_TABLE_WIDTH;
    }
    return 0;
  }, [displayMode, contentWidth, isListNonEmpty, statementListTableIsLoading]);

  return (
    <>
      {showStatementList && (
        <>
          <StatementListHeader
            territory={territory}
            isFetchingTerritory={isFetchingTerritory}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
            isAllSelected={
              isListNonEmpty && selectedRows.length === statements.length
            }
            moveStatementsMutation={moveStatementsMutation}
            duplicateStatementsMutation={duplicateStatementsMutation}
            replaceReferencesMutation={replaceReferencesMutation}
            appendReferencesMutation={appendReferencesMutation}
            updateTerritoryMutation={updateTerritoryMutation}
            duplicateTerritoryMutation={duplicateTerritoryMutation}
            deleteStatementsMutation={deleteStatementsMutation}
            relationsCreateMutation={relationsCreateMutation}
            favoritedTerritoryIds={favoritedTerritoryIds}
            contentWidthTooSmall={contentWidth < SECOND_PANEL_MIN_WIDTH + 60}
            // statementsWithOrder={statements}
            statementsWithOrder={statementsWithOrder}
            // autoOrderStatementsMutation={autoOrderStatementsMutation}
          />

          {!territoryId && (
            <>
              <StyledEmptyState>
                <BsInfoCircle size="23" />
              </StyledEmptyState>
              <StyledEmptyState>
                {"No territory selected yet. Pick one from the territory tree"}
              </StyledEmptyState>
            </>
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

          <div
            style={{
              display: "flex",
              height: "100%",
              // maxHeight: "calc(100%)",
              overflow: "hidden",
            }}
            ref={contentRef}
          >
            <CustomScrollbar
              scrollerId="Statements"
              elementId="Statements-box-table"
              contentWidth={tableWidth}
              customStyle={{
                display: "flex",
                flexShrink: 0,
                // fix for overheight because of marginTop which is necessary to make space for annotator header
                marginTop:
                  displayMode === StatementListDisplayMode.TEXT
                    ? "6rem"
                    : undefined,
                height:
                  displayMode === StatementListDisplayMode.TEXT
                    ? "calc(100% - 6rem)"
                    : "100%",
              }}
            >
              <StyledTableWrapper
                $isListMode={displayMode === StatementListDisplayMode.LIST}
              >
                {isListNonEmpty && (
                  <StatementListTable
                    // statements={statements}
                    statements={statementsWithOrder}
                    handleRowClick={(rowId: string) => {
                      dispatch(setShowWarnings(false));
                      if (statementId !== rowId) {
                        setStatementId(rowId);
                      } else {
                        annotator?.scrollToAnchor(rowId);
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
                    annotator={annotator}
                    isLoading={statementListTableIsLoading}
                  />
                )}
              </StyledTableWrapper>
            </CustomScrollbar>

            {displayMode === StatementListDisplayMode.TEXT && (
              <StatementListTextAnnotator
                key={territoryId}
                contentHeight={contentHeight}
                contentWidth={contentWidth - 10}
                statements={statements}
                handleCreateStatement={handleCreateStatement}
                // handleCreateTerritory={handleCreateTerritory}
                territoryId={territoryId}
                territory={territory}
                statementId={statementId}
                storedAnnotatorResourceId={storedAnnotatorResourceId}
                setStoredAnnotatorResourceId={setStoredAnnotatorResourceId}
                storedAnnotatorScroll={storedAnnotatorScroll}
                setStoredAnnotatorScroll={(newScroll) => {
                  if (storedAnnotatorResourceId) {
                    setStoredAnnotatorScroll(newScroll);
                  }
                }}
                hlEntities={hlEntities}
                setHlEntities={setHlEntities}
                entities={entities}
                right={right}
                setShowSubmit={setShowSubmit}
                addStatementAtCertainIndex={addStatementAtCertainIndex}
                annotator={annotator}
                setAnnotator={setAnnotator}
                selectedDocumentId={selectedDocumentId}
                selectedDocument={selectedDocument}
                selectedDocumentIsFetching={selectedDocumentIsFetching}
                selectedDocumentError={selectedDocumentError}
                selectedResource={selectedResource}
                resources={resources}
                documents={documents}
                setSelectedResourceId={setSelectedResourceId}
                displayMode={displayMode}
                showStatementList={
                  isListNonEmpty || statementListTableIsLoading
                }
                userCanEdit={userCanEdit}
              />
            )}

            {statementListTableIsLoading &&
              tableWidth > 0 &&
              contentHeight > 0 && (
                <div
                  style={{
                    width: tableWidth,
                    height:
                      displayMode === StatementListDisplayMode.TEXT
                        ? contentHeight - 56
                        : contentHeight,
                    flexShrink: 0,
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    zIndex: 1,
                  }}
                >
                  <Loader show size={50} />
                </div>
              )}
          </div>

          <Submit
            title="Delete statement"
            text={`Do you really want to delete statement [${
              statementToDelete?.labels[0]
                ? statementToDelete.labels[0]
                : statementToDelete?.id
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
      )}
    </>
  );
};

export const MemoizedStatementListBox = React.memo(StatementListBox);
