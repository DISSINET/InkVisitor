import { UserRole, UserRoleMode } from "@shared/enums";
import {
  IEntity,
  IAction,
  IResponseStatement,
  IStatement,
  IStatementData,
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
  statements: IStatement[];
  entities: IEntity[];
  right: UserRoleMode;
} = {
  statements: [],
  entities: [],
  right: UserRoleMode.Read,
};

export const StatementListBox: React.FC = () => {
  const queryClient = useQueryClient();

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
        setStatementId("");
        queryClient.invalidateQueries("territory");
        queryClient.invalidateQueries("tree");
        queryClient.invalidateQueries("entity");
      },
    }
  );

  const duplicateStatementMutation = useMutation(
    async (statementToDuplicate: IResponseStatement) => {
      const { ...newStatementObject } = statementToDuplicate;

      const duplicatedStatement = DStatement(newStatementObject as IStatement);
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
      newOrder = statements.length;
    } else {
      if (index < 1 && statements[0].data.territory) {
        // first one
        newOrder = statements[0].data.territory.order - 1;
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
        territoryId,
        localStorage.getItem("userrole") as UserRole
      );
      (newStatement.data.territory as { order: number; id: string }).order =
        newOrder;

      actantsCreateMutation.mutate(newStatement);
    }
  };

  const { statements, entities } = data || initialData;

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
            const subjectObject =
              entities && entities.find((e) => e.id === actantId);

            return subjectObject;
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
          const actionIds = row.values.data?.actants
            ? row.values.data.actions.map((a: any) => a.action)
            : [];

          const actionObjects = actionIds.map((actionId: string) => {
            const actantObject =
              entities && entities.find((e) => e && e.id === actionId);
            return actantObject && actantObject;
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
            const actantObject =
              entities && entities.find((e) => e && e.id === actantId);
            return actantObject && actantObject;
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
                        duplicateStatementMutation.mutate(
                          row.original as IResponseStatement
                        );
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
                        addStatementAtCertainIndex(row.index - 1);
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
                  row.toggleRowExpanded();
                }}
              >
                {row.isExpanded ? (
                  <FaChevronCircleUp />
                ) : (
                  <FaChevronCircleDown />
                )}
              </span>
            </ButtonGroup>
          );
        },
      },
      {
        Header: "",
        id: "exp-actions",
        Cell: ({ row }: Cell) => {
          const { actions }: { actions?: IAction[] } = row.original;
          const statement = row.original as IResponseStatement;
          if (actions) {
            return (
              <>
                <div>{actions.length > 0 ? <i>Actions</i> : ""}</div>
                <TagGroup>
                  <div style={{ display: "block" }}>
                    {actions.map((action: IAction, key: number) =>
                      renderListActantLong(action, key, true, statement)
                    )}
                  </div>
                </TagGroup>
              </>
            );
          } else {
            return <div />;
          }
        },
      },
      {
        Header: false,
        id: "exp-actants",
        Cell: ({ row }: Cell) => {
          const actantIds = row.values.data?.actants
            ? row.values.data.actants.map((a: any) => a.actant)
            : [];
          const statement = row.original as IResponseStatement;
          const actantObjects = actantIds.map((actantId: string) => {
            const actantObject =
              entities && entities.find((e) => e && e.id === actantId);
            return actantObject && actantObject;
          });

          return (
            <>
              <div>{actantObjects.length > 0 ? <i>Actants</i> : ""}</div>
              <TagGroup>
                <div style={{ display: "block" }}>
                  {actantObjects.map((actantObject: IEntity, key: number) =>
                    renderListActantLong(actantObject, key, true, statement)
                  )}
                </div>
              </TagGroup>
            </>
          );
        },
      },
      {
        Header: "",
        id: "exp-references",
        Cell: ({ row }: Cell) => {
          const refs = row.values.data?.references
            ? row.values.data.references.map((a: any) => a.resource)
            : [];

          const actantObjects = refs.map((actantId: string) => {
            const actantObject =
              entities && entities.find((e) => e && e.id === actantId);
            return actantObject && actantObject;
          });
          return (
            <>
              <div>{actantObjects.length > 0 ? <i>References</i> : ""}</div>
              <TagGroup>
                <div style={{ display: "block" }}>
                  {actantObjects.map((actantObject: IEntity, key: number) =>
                    renderListActantLong(actantObject, key)
                  )}
                </div>
              </TagGroup>
            </>
          );
        },
      },
      {
        Header: "",
        id: "exp-tags",
        Cell: ({ row }: Cell) => {
          const actantIds = row.values.data?.tags ? row.values.data.tags : [];
          const actantObjects = actantIds.map((actantId: string) => {
            const actantObject =
              entities && entities.find((e) => e && e.id === actantId);
            return actantObject && actantObject;
          });
          return (
            <>
              <div>{actantObjects.length > 0 ? <i>Tags</i> : ""}</div>
              <TagGroup>
                <div style={{ display: "block" }}>
                  {actantObjects.map((actantObject: IEntity, key: number) =>
                    renderListActantLong(actantObject, key)
                  )}
                </div>
              </TagGroup>
            </>
          );
        },
      },
    ];
  }, [data, statementId]);

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

      {statements && (
        <StyledTableWrapper id="Statements-box-table">
          <StatementListTable
            moveEndRow={moveEndRow}
            data={statements}
            columns={columns}
            handleRowClick={(rowId: string) => {
              setStatementId(rowId);
            }}
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
