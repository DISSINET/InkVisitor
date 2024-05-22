import { EntityEnums, UserEnums } from "@shared/enums";
import {
  IEntity,
  IReference,
  IResponseStatement,
  IStatement,
  ITerritory,
} from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Loader, Submit, ToastWithLink } from "components";
import { CStatement, CTerritory } from "constructors";
import { useSearchParams } from "hooks";
import React, { useEffect, useState } from "react";
import { BsInfoCircle } from "react-icons/bs";
import { toast } from "react-toastify";
import { setStatementListOpened } from "redux/features/layout/statementListOpenedSlice";
import { setShowWarnings } from "redux/features/statementEditor/showWarningsSlice";
import { setDisableStatementListScroll } from "redux/features/statementList/disableStatementListScrollSlice";
import { setRowsExpanded } from "redux/features/statementList/rowsExpandedSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { StatementListHeader } from "./StatementListHeader/StatementListHeader";
import { StatementListTable } from "./StatementListTable/StatementListTable";
import { StatementListTextAnnotator } from "./StatementListTextAnnotator/StatementListTextAnnotator";
import { StyledEmptyState, StyledTableWrapper } from "./StatementLitBoxStyles";
import { StatementListDisplayMode } from "types";
import useResizeObserver from "use-resize-observer";

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
  const rowsExpanded: { [key: string]: boolean } = useAppSelector(
    (state) => state.statementList.rowsExpanded
  );
  const statementListOpened: boolean = useAppSelector(
    (state) => state.layout.statementListOpened
  );
  const isLoading: boolean = useAppSelector(
    (state) => state.statementList.isLoading
  );

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

  const [displayMode, setDisplayMode] = useState<StatementListDisplayMode>(
    StatementListDisplayMode.TEXT
  );

  const handleDisplayModeChange = (
    newDisplayMode: StatementListDisplayMode
  ) => {
    setDisplayMode(newDisplayMode);
  };

  const { status, data, error, isFetching } = useQuery({
    queryKey: ["territory", "statement-list", territoryId, statementListOpened],
    queryFn: async () => {
      const res = await api.territoryGet(territoryId);
      return res.data;
    },
    enabled: !!territoryId && api.isLoggedIn() && statementListOpened,
  });

  const { statements, entities, right } = data || initialData;

  useEffect(() => {
    if (statements.length !== Object.keys(rowsExpanded).length) {
      const arrayWithIds = statements.map((s, key) => [s.id, false]);
      const arrayWithKeys = Object.fromEntries(arrayWithIds);
      dispatch(setRowsExpanded(arrayWithKeys));
    }
  }, [statements, rowsExpanded]);

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

  const [storedTerritoryIds, setStoredTerritoryIds] = useState<string[]>([]);
  useEffect(() => {
    if (userData?.storedTerritories) {
      setStoredTerritoryIds(
        userData.storedTerritories.map((territory) => territory.territory.id)
      );
    }
  }, [userData?.storedTerritories]);
  const isFavorited = data && storedTerritoryIds?.includes(data.id);

  useEffect(() => {
    if (error && (error as any).error === "TerritoryDoesNotExits") {
      setTerritoryId("");
    }
  }, [error]);

  const removeStatementMutation = useMutation({
    mutationFn: async (sId: string) => {
      if (statementId === sId) {
      }
      await api.entityDelete(sId);
    },
    onSuccess: (data, sId) => {
      toast.info(
        <ToastWithLink
          children={`Statement removed!`}
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
        toast.info("Click to open conflicting entity in detail", {
          autoClose: 6000,
          onClick: () => {
            appendDetailId(data[0]);
          },
        });
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
  const territoryCreateMutation = useMutation({
    mutationFn: async (newTerritory: ITerritory) =>
      await api.entityCreate(newTerritory),
    onSuccess: (data, variables) => {
      toast.info(`Sub Teritory created!`);
      queryClient.invalidateQueries({ queryKey: ["tree"] });
    },
    onError: () => {
      toast.error(`Error: Sub Territory not created!`);
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
    if (userData && data) {
      const newStatement: IStatement = CStatement(
        localStorage.getItem("userrole") as UserEnums.Role,
        userData.options,
        "",
        "",
        territoryId,
        statementId
      );
      newStatement.data.text = text;
      const { statements } = data;

      const lastStatement = statements[statements.length - 1];
      if (!statements.length) {
        addStatementAtTheEndMutation.mutate(newStatement);
      } else if (
        newStatement?.data?.territory &&
        lastStatement?.data?.territory
      ) {
        newStatement.data.territory.order = statements.length
          ? lastStatement.data.territory.order + 1
          : 1;
        addStatementAtTheEndMutation.mutate(newStatement);
      }
    }
  };

  const handleCreateTerritory = (newTerritoryId?: string) => {
    if (userData && data) {
      const newTerritory: ITerritory = CTerritory(
        localStorage.getItem("userrole") as UserEnums.Role,
        userData.options,
        `subT of ${data.label}`,
        data.detail,
        territoryId,
        Infinity,
        newTerritoryId
      );

      territoryCreateMutation.mutate(newTerritory);
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

  const {
    ref: contentRef,
    height: contentHeight = 0,
    width: contentWidth = 0,
  } = useResizeObserver<HTMLDivElement>();

  return (
    <>
      {data && (
        <StatementListHeader
          territory={data}
          isFavorited={isFavorited}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          isAllSelected={
            statements.length > 0 && selectedRows.length === statements.length
          }
          moveStatementsMutation={moveStatementsMutation}
          duplicateStatementsMutation={duplicateStatementsMutation}
          replaceReferencesMutation={replaceReferencesMutation}
          appendReferencesMutation={appendReferencesMutation}
          displayMode={displayMode}
          handleDisplayModeChange={handleDisplayModeChange}
          updateTerritoryMutation={updateTerritoryMutation}
          duplicateTerritoryMutation={duplicateTerritoryMutation}
        />
      )}

      {/* TODO: measure statement list header dynamically */}
      <div
        style={{
          display: "flex",
          maxHeight: "calc(100% - 101px)",
          overflow: "auto",
        }}
        ref={contentRef}
      >
        <StyledTableWrapper id="Statements-box-table">
          <StatementListTable
            statements={statements}
            handleRowClick={(rowId: string) => {
              dispatch(setShowWarnings(false));
              setStatementId(rowId);
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
            contentWidth={contentWidth}
          />
        </StyledTableWrapper>

        {data && displayMode === StatementListDisplayMode.TEXT && (
          <StatementListTextAnnotator
            contentHeight={contentHeight}
            contentWidth={contentWidth}
            statements={statements}
            handleCreateStatement={handleCreateStatement}
            handleCreateTerritory={handleCreateTerritory}
            territoryId={territoryId}
            entities={entities}
            right={right}
            setShowSubmit={setShowSubmit}
            addStatementAtCertainIndex={addStatementAtCertainIndex}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
          />
        )}
      </div>

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

      <Submit
        title="Delete statement"
        text={`Do you really want to delete statement [${
          statementToDelete?.label
            ? statementToDelete.label
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
            removeStatementMutation.mutate(statementToDelete.id);
            setShowSubmit(false);
            setStatementToDelete(undefined);
          }
        }}
        loading={removeStatementMutation.isPending}
      />
      <Loader
        show={
          isFetching ||
          removeStatementMutation.isPending ||
          addStatementAtTheEndMutation.isPending ||
          statementCreateMutation.isPending ||
          statementUpdateMutation.isPending ||
          moveStatementsMutation.isPending ||
          duplicateStatementsMutation.isPending ||
          cloneStatementMutation.isPending ||
          updateTerritoryMutation.isPending ||
          duplicateTerritoryMutation.isPending ||
          isLoading
        }
      />
    </>
  );
};

export const MemoizedStatementListBox = React.memo(StatementListBox);
