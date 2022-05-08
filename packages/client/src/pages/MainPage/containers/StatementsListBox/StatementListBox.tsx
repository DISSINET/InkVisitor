import { Order, UserRole, UserRoleMode } from "@shared/enums";
import {
  IAction,
  IEntity,
  IResponseAudit,
  IResponseStatement,
  IStatement,
} from "@shared/types";
import api from "api";
import {
  Button,
  ButtonGroup,
  Loader,
  Submit,
  TagGroup,
  Tooltip,
} from "components";
import { CStatement, DStatement } from "constructors";
import { useSearchParams } from "hooks";
import React, { useEffect, useMemo, useState } from "react";
import { BsArrowDown, BsArrowUp } from "react-icons/bs";
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
import { setRowsExpanded } from "redux/features/statementList/rowsExpandedSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { EntityTag } from "./../";
import { StatementListContextMenu } from "./StatementListContextMenu/StatementListContextMenu";
import { StatementListHeader } from "./StatementListHeader/StatementListHeader";
import { StatementListTable } from "./StatementListTable/StatementListTable";
import {
  StyledDots,
  StyledTableWrapper,
  StyledText,
} from "./StatementLitBoxStyles";

const initialData: {
  statements: (IResponseStatement & { audit?: IResponseAudit })[];
  entities: { [key: string]: IEntity };
  right: UserRoleMode;
} = {
  statements: [],
  entities: {},
  right: UserRoleMode.Read,
};

export const StatementListBox: React.FC = () => {
  const queryClient = useQueryClient();

  const dispatch = useAppDispatch();
  const rowsExpanded: { [key: string]: boolean } = useAppSelector(
    (state) => state.statementList.rowsExpanded
  );

  const { territoryId, setTerritoryId, statementId, setStatementId } =
    useSearchParams();

  const [showSubmit, setShowSubmit] = useState(false);
  const [statementToDelete, setStatementToDelete] = useState<IStatement>();

  const { status, data, error, isFetching } = useQuery(
    ["territory", "statement-list", territoryId],
    async () => {
      const res = await api.territoryGet(territoryId);
      return res.data;
    },
    {
      enabled: !!territoryId && api.isLoggedIn(),
      retry: 2,
    }
  );

  const { statements, entities } = data || initialData;

  const { data: audits, isFetching: isFetchingAudits } = useQuery(
    ["territory", "statement-list", "audits", territoryId],
    async () => {
      const res = await api.auditsForStatements(territoryId);
      return res.data;
    },
    {
      enabled: !!territoryId && api.isLoggedIn(),
      retry: 2,
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
      await api.entityDelete(sId);
    },
    {
      onSuccess: () => {
        toast.info(`Statement removed!`);
        queryClient.invalidateQueries("territory").then(() => {
          setStatementId("");
        });
      },
    }
  );

  const duplicateStatement = (statementToDuplicate: IResponseStatement) => {
    const { ...newStatementObject } = statementToDuplicate;

    const duplicatedStatement = DStatement(newStatementObject as IStatement);
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
      newOrder = Order.Last;
    } else {
      if (index < 1 && statements[0].data.territory) {
        // first one
        newOrder = Order.First;
      } else if (
        statements[index - 1].data.territory &&
        statements[index].data.territory
      ) {
        // somewhere between
        newOrder =
          ((
            statements[index - 1].data.territory as {
              order: number;
              id: string;
            }
          ).order +
            (statements[index].data.territory as { order: number; id: string })
              .order) /
          2;
      }
    }

    if (newOrder) {
      const newStatement: IStatement = CStatement(
        localStorage.getItem("userrole") as UserRole,
        territoryId
      );
      (newStatement.data.territory as { order: number; id: string }).order =
        newOrder;

      actantsCreateMutation.mutate(newStatement);
    }
  };

  const moveEndRow = async (statementToMove: IStatement, index: number) => {
    // return if order don't change

    if (statementToMove.data.territory && statements[index].data.territory) {
      if (
        statementToMove.data.territory.order !==
        statements[index].data.territory?.order
      ) {
        // whether row is moving top-bottom direction
        const topDown =
          statementToMove.data.territory.order <
          (statements[index].data.territory as { id: string; order: number })
            .order;

        const thisOrder = statementToMove.data.territory.order;
        let allOrders: number[] = statements.map((s) =>
          s.data.territory ? s.data.territory.order : 0
        );
        allOrders.sort((a, b) => (a && b ? (a > b ? 1 : -1) : 0));
        const thisIndex = allOrders.indexOf(thisOrder);

        allOrders = allOrders.filter((o) => o !== thisOrder);
        allOrders.splice(index, 0, thisOrder);

        if (index === 0) {
          allOrders[index] = allOrders[1] - 1;
        } else if (index === allOrders.length - 1) {
          allOrders[index] = allOrders[index - 1] + 1;
        } else {
          allOrders[index] = (allOrders[index - 1] + allOrders[index + 1]) / 2;
        }

        const res = await api.entityUpdate(statementToMove.id, {
          data: {
            territory: {
              id: statementToMove.data.territory.id,
              order: allOrders[index],
            },
          },
        });
        queryClient.invalidateQueries("territory");
      }
    }
  };

  const renderListActant = (actantObject: IEntity, key: number) => {
    return (
      actantObject && (
        <EntityTag
          key={key}
          actant={actantObject}
          showOnly="entity"
          tooltipPosition="bottom center"
        />
      )
    );
  };

  const renderListActantLong = (
    actantObject: IEntity,
    key: number,
    attributes?: boolean,
    statement?: IResponseStatement
  ) => {
    return (
      actantObject && (
        <div key={key}>
          <div style={{ marginTop: "4px", display: "flex" }}>
            <EntityTag
              key={key}
              actant={actantObject}
              tooltipPosition="bottom center"
            />
          </div>
          <div>
            {/* {statement ? renderPropGroup(actantObject.id, statement) : ""} */}
          </div>
        </div>
      )
    );
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
              actant={statement as IEntity}
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
          const subjectIds = row.values.data?.actants
            ? row.values.data.actants
                .filter((a: any) => a.position === "s")
                .map((a: any) => a.actant)
            : [];

          const subjectObjects = subjectIds.map((actantId: string) => {
            return entities[actantId];
          });

          const isOversized = subjectIds.length > 2;

          return (
            <TagGroup>
              {subjectObjects
                .slice(0, 2)
                .map((subjectObject: IEntity, key: number) =>
                  renderListActant(subjectObject, key)
                )}
              {isOversized && (
                <Tooltip
                  offsetX={-14}
                  position="right center"
                  color="success"
                  noArrow
                  items={
                    <TagGroup>
                      {subjectObjects
                        .slice(2)
                        .map((subjectObject: IEntity, key: number) =>
                          renderListActant(subjectObject, key)
                        )}
                    </TagGroup>
                  }
                >
                  <StyledDots>{"..."}</StyledDots>
                </Tooltip>
              )}
            </TagGroup>
          );
        },
      },
      {
        Header: "Actions",
        Cell: ({ row }: Cell) => {
          const actionIds = row.values.data?.actions
            ? row.values.data.actions.map((a: any) => a.action)
            : [];

          const actionObjects = actionIds.map((actionId: string) => {
            return entities[actionId];
          });

          if (actionObjects) {
            const isOversized = actionIds.length > 2;
            return (
              <TagGroup>
                {actionObjects
                  .slice(0, 2)
                  .map((action: IAction, key: number) =>
                    renderListActant(action, key)
                  )}
                {isOversized && (
                  <Tooltip
                    offsetX={-14}
                    position="right center"
                    color="success"
                    noArrow
                    items={
                      <TagGroup>
                        {actionObjects
                          .slice(2)
                          .map((action: IAction, key: number) =>
                            renderListActant(action, key)
                          )}
                      </TagGroup>
                    }
                  >
                    <StyledDots>{"..."}</StyledDots>
                  </Tooltip>
                )}
              </TagGroup>
            );
          } else {
            return <div />;
          }
        },
      },
      {
        Header: "Objects",
        Cell: ({ row }: Cell) => {
          const actantIds = row.values.data?.actants
            ? row.values.data.actants
                .filter((a: any) => a.position !== "s")
                .map((a: any) => a.actant)
            : [];
          const isOversized = actantIds.length > 4;

          const actantObjects = actantIds.map((actantId: string) => {
            return entities[actantId];
          });
          return (
            <TagGroup>
              {actantObjects
                .slice(0, 4)
                .map((actantObject: IEntity, key: number) =>
                  renderListActant(actantObject, key)
                )}
              {isOversized && (
                <Tooltip
                  offsetX={-14}
                  position="right center"
                  color="success"
                  noArrow
                  items={
                    <TagGroup>
                      {actantObjects
                        .slice(4)
                        .map((actantObject: IEntity, key: number) =>
                          renderListActant(actantObject, key)
                        )}
                    </TagGroup>
                  }
                >
                  <StyledDots>{"..."}</StyledDots>
                </Tooltip>
              )}
            </TagGroup>
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
              {data?.right !== UserRoleMode.Read && (
                <StatementListContextMenu
                  buttons={[
                    <Button
                      key="r"
                      icon={<FaTrashAlt size={14} />}
                      color="danger"
                      tooltip="delete"
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
                      tooltip="duplicate"
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
                      tooltip="add new statement before"
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
                      tooltip="add new statement after"
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

  statements.sort((a, b) =>
    a.data.territory && b.data.territory
      ? a.data.territory.order > b.data.territory.order
        ? 1
        : -1
      : 0
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

      {statements && audits && (
        <StyledTableWrapper id="Statements-box-table">
          <StatementListTable
            moveEndRow={moveEndRow}
            data={statements.map((st) => ({
              ...st,
              audit: audits.find((a) => a.entity === st.id),
            }))}
            columns={columns}
            handleRowClick={(rowId: string) => {
              setStatementId(rowId);
            }}
            entities={entities}
          />
        </StyledTableWrapper>
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
          moveTerritoryMutation.isLoading
        }
      />
    </>
  );
};
