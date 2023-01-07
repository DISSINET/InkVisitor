import { EntityEnums, UserEnums } from "@shared/enums";
import {
  IAction,
  IEntity,
  IResponseStatement,
  IStatement,
} from "@shared/types";
import api from "api";
import { Button, ButtonGroup, Loader, Submit, TagGroup } from "components";
import { EntityTag } from "components/advanced";
import { CStatement, DStatement } from "constructors";
import { useSearchParams } from "hooks";
import React, { useEffect, useMemo, useState } from "react";
import { BsArrowDown, BsArrowUp, BsInfoCircle } from "react-icons/bs";
import {
  FaChevronCircleDown,
  FaChevronCircleUp,
  FaClone,
  FaPlus,
  FaTrashAlt,
} from "react-icons/fa";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Cell, Column } from "react-table";
import { toast } from "react-toastify";
import { setStatementListOpened } from "redux/features/layout/statementListOpenedSlice";
import { setRowsExpanded } from "redux/features/statementList/rowsExpandedSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { StatementListContextMenu } from "./StatementListContextMenu/StatementListContextMenu";
import { StatementListHeader } from "./StatementListHeader/StatementListHeader";
import { StatementListTable } from "./StatementListTable/StatementListTable";
import {
  StyledEmptyState,
  StyledTableWrapper,
  StyledText,
} from "./StatementLitBoxStyles";

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

  const {
    territoryId,
    setTerritoryId,
    statementId,
    setStatementId,
    detailIdArray,
    removeDetailId,
  } = useSearchParams();

  useEffect(() => {
    if (!detailIdArray.length && !statementListOpened) {
      dispatch(setStatementListOpened(true));
    }
  }, [detailIdArray, statementListOpened]);

  const [showSubmit, setShowSubmit] = useState(false);
  const [statementToDelete, setStatementToDelete] = useState<IStatement>();

  const { status, data, error, isFetching } = useQuery(
    ["territory", "statement-list", territoryId, statementListOpened],
    async () => {
      const res = await api.territoryGet(territoryId);
      return res.data;
    },
    {
      enabled: !!territoryId && api.isLoggedIn() && statementListOpened,
    }
  );

  const { statements, entities } = data || initialData;

  const { data: audits, isFetching: isFetchingAudits } = useQuery(
    ["territory", "statement-list", "audits", territoryId, statementListOpened],
    async () => {
      const res = await api.auditsForStatements(territoryId);
      return res.data;
    },
    {
      enabled: !!territoryId && api.isLoggedIn() && statementListOpened,
    }
  );

  useEffect(() => {
    if (statements.length !== Object.keys(rowsExpanded).length) {
      const arrayWithIds = statements.map((s, key) => [s.id, false]);
      const arrayWithKeys = Object.fromEntries(arrayWithIds);
      dispatch(setRowsExpanded(arrayWithKeys));
    }
  }, [statements, rowsExpanded]);

  const userId = localStorage.getItem("userid");
  const {
    status: userStatus,
    data: userData,
    error: userError,
    isFetching: userIsFetching,
  } = useQuery(
    ["user"],
    async () => {
      if (userId) {
        const res = await api.usersGet(userId);
        return res.data;
      }
    },
    { enabled: api.isLoggedIn() }
  );

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

  const removeStatementMutation = useMutation(
    async (sId: string) => {
      if (statementId === sId) {
      }
      await api.entityDelete(sId);
    },
    {
      onSuccess: (data, sId) => {
        toast.info(`Statement removed!`);
        if (detailIdArray.includes(sId)) {
          removeDetailId(sId);
          queryClient.invalidateQueries("detail-tab-entities");
        }
        queryClient.invalidateQueries("territory").then(() => {
          setStatementId("");
        });
      },
    }
  );

  const duplicateStatement = (statementToDuplicate: IResponseStatement) => {
    const { ...newStatementObject } = statementToDuplicate;

    const duplicatedStatement = DStatement(
      newStatementObject as IStatement,
      localStorage.getItem("userrole") as UserEnums.Role
    );
    duplicateStatementMutation.mutate(duplicatedStatement);
  };

  const duplicateStatementMutation = useMutation(
    async (duplicatedStatement: IStatement) => {
      await api.entityCreate(duplicatedStatement);
    },
    {
      onSuccess: (data, variables) => {
        setStatementId(variables.id);
        toast.info(`Statement duplicated!`);
        queryClient.invalidateQueries("territory");
        queryClient.invalidateQueries("entity");
      },
      onError: () => {
        toast.error(`Error: Statement not duplicated!`);
      },
    }
  );

  const addStatementAtTheEndMutation = useMutation(
    async (newStatement: IStatement) => {
      await api.entityCreate(newStatement);
    },
    {
      onSuccess: (data, variables) => {
        setStatementId(variables.id);
        queryClient.invalidateQueries("territory");
        queryClient.invalidateQueries("tree");
      },
    }
  );

  const actantsCreateMutation = useMutation(
    async (newStatement: IStatement) => await api.entityCreate(newStatement),
    {
      onSuccess: (data, variables) => {
        toast.info(`Statement created!`);
        queryClient.invalidateQueries([
          "territory",
          "statement-list",
          territoryId,
        ]);
        setStatementId(variables.id);
        queryClient.invalidateQueries("tree");
      },
      onError: () => {
        toast.error(`Error: Statement not created!`);
      },
    }
  );

  const addStatementAtCertainIndex = async (index: number) => {
    let newOrder: number | false = false;

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
        territoryId
      );
      (
        newStatement.data.territory as { order: number; territoryId: string }
      ).order = newOrder;

      actantsCreateMutation.mutate(newStatement);
    }
  };

  const columns: Column<{}>[] = useMemo(() => {
    return [
      {
        Header: "ID",
        accessor: "id",
      },
      {
        Header: "",
        id: "Statement",
        Cell: ({ row }: Cell) => {
          const statement = row.original as IStatement;
          return (
            <EntityTag
              entity={statement as IEntity}
              showOnly="entity"
              tooltipText={statement.data.text}
            />
          );
        },
      },
      {
        Header: "Subj.",
        accessor: "data",
        Cell: ({ row }: Cell) => {
          const subjectIds: string[] = row.values.data?.actants
            ? row.values.data.actants
                .filter((a: any) => a.position === "s")
                .map((a: any) => a.entityId)
            : [];
          const subjectObjects = subjectIds.map(
            (actantId: string) => entities[actantId]
          );
          const definedSubjects = subjectObjects.filter((s) => s !== undefined);

          return (
            <>
              {definedSubjects ? (
                <TagGroup definedEntities={definedSubjects} />
              ) : (
                <div />
              )}
            </>
          );
        },
      },
      {
        Header: "Actions",
        Cell: ({ row }: Cell) => {
          const actionIds = row.values.data?.actions
            ? row.values.data.actions.map((a: any) => a.actionId)
            : [];
          const actionObjects: IAction[] = actionIds.map(
            (actionId: string) => entities[actionId]
          );
          const definedActions = actionObjects.filter((a) => a !== undefined);

          return (
            <>
              {definedActions ? (
                <TagGroup definedEntities={definedActions} />
              ) : (
                <div />
              )}
            </>
          );
        },
      },
      {
        Header: "Objects",
        Cell: ({ row }: Cell) => {
          const actantIds = row.values.data?.actants
            ? row.values.data.actants
                .filter((a: any) => a.position !== "s")
                .map((a: any) => a.entityId)
            : [];
          const actantObjects: IEntity[] = actantIds.map(
            (actantId: string) => entities[actantId]
          );
          const definedObjects = actantObjects.filter((o) => o !== undefined);

          return (
            <>
              {definedObjects ? (
                <TagGroup definedEntities={definedObjects} oversizeLimit={4} />
              ) : (
                <div />
              )}
            </>
          );
        },
      },
      {
        Header: "Text",
        Cell: ({ row }: Cell) => {
          const { text } = row.values.data;
          const maxWordsCount = 20;
          const trimmedText = text.split(" ").slice(0, maxWordsCount).join(" ");
          if (text?.match(/(\w+)/g)?.length > maxWordsCount) {
            return <StyledText>{trimmedText}...</StyledText>;
          }
          return <StyledText>{trimmedText}</StyledText>;
        },
      },
      {
        id: "lastEdit",
        Header: "Edited",
        Cell: ({ row }: Cell) => {
          return false;
        },
      },
      {
        Header: "",
        id: "expander",
        width: 300,
        Cell: ({ row }: Cell) => {
          return (
            <ButtonGroup>
              {data?.right !== UserEnums.RoleMode.Read && (
                <StatementListContextMenu
                  buttons={[
                    <Button
                      key="r"
                      icon={<FaTrashAlt size={14} />}
                      color="danger"
                      tooltipLabel="delete"
                      onClick={() => {
                        setStatementToDelete(
                          row.original as IResponseStatement
                        );
                        setShowSubmit(true);
                      }}
                    />,
                    <Button
                      key="d"
                      icon={<FaClone size={14} />}
                      color="warning"
                      tooltipLabel="duplicate"
                      onClick={() => {
                        duplicateStatement(row.original as IResponseStatement);
                      }}
                    />,
                    <Button
                      key="add-up"
                      icon={
                        <>
                          <FaPlus size={14} />
                          <BsArrowUp size={14} />
                        </>
                      }
                      tooltipLabel="add new statement before"
                      color="info"
                      onClick={() => {
                        addStatementAtCertainIndex(row.index);
                      }}
                    />,
                    <Button
                      key="add-down"
                      icon={
                        <>
                          <FaPlus size={14} />
                          <BsArrowDown size={14} />
                        </>
                      }
                      tooltipLabel="add new statement after"
                      color="success"
                      onClick={() => {
                        addStatementAtCertainIndex(row.index + 1);
                      }}
                    />,
                  ]}
                />
              )}
              <span
                {...row.getToggleRowExpandedProps()}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  const newObject = {
                    ...rowsExpanded,
                    [row.values.id]: !rowsExpanded[row.values.id],
                  };
                  dispatch(setRowsExpanded(newObject));
                }}
              >
                {rowsExpanded[row.values.id] ? (
                  <FaChevronCircleUp />
                ) : (
                  <FaChevronCircleDown />
                )}
              </span>
            </ButtonGroup>
          );
        },
      },
    ];
  }, [data, statementId, rowsExpanded]);

  const actantsUpdateMutation = useMutation(
    async (statementObject: { statementId: string; data: {} }) =>
      await api.entityUpdate(statementObject.statementId, {
        data: statementObject.data,
      }),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries("territory");
      },
      onError: () => {
        toast.error(`Error: Statement order not changed!`);
      },
    }
  );

  const moveTerritoryMutation = useMutation(
    async (newParentId: string) =>
      await api.treeMoveTerritory(territoryId, newParentId, 0),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries("tree");
        queryClient.invalidateQueries("territory");
      },
    }
  );

  return (
    <>
      {data && (
        <StatementListHeader
          data={data}
          addStatementAtTheEndMutation={addStatementAtTheEndMutation}
          moveTerritoryMutation={moveTerritoryMutation}
          isFavorited={isFavorited}
        />
      )}
      {statements && audits ? (
        <StyledTableWrapper id="Statements-box-table">
          <StatementListTable
            statements={statements}
            audits={audits}
            columns={columns}
            handleRowClick={(rowId: string) => {
              setStatementId(rowId);
            }}
            actantsUpdateMutation={actantsUpdateMutation}
            entities={entities}
          />
        </StyledTableWrapper>
      ) : (
        <>
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
        loading={removeStatementMutation.isLoading}
      />
      <Loader
        show={
          isFetching ||
          isFetchingAudits ||
          removeStatementMutation.isLoading ||
          duplicateStatementMutation.isLoading ||
          addStatementAtTheEndMutation.isLoading ||
          actantsCreateMutation.isLoading ||
          actantsUpdateMutation.isLoading ||
          moveTerritoryMutation.isLoading
        }
      />
    </>
  );
};

export const MemoizedStatementListBox = React.memo(StatementListBox);
