import React, { MouseEventHandler, useEffect, useMemo, useState } from "react";
import { Cell, Column, ColumnInstance } from "react-table";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  FaTrashAlt,
  FaPlus,
  FaClone,
  FaEdit,
  FaChevronCircleDown,
  FaChevronCircleUp,
} from "react-icons/fa";
import { toast } from "react-toastify";

import {
  Button,
  ButtonGroup,
  Loader,
  Submit,
  TagGroup,
  Tooltip,
} from "components";
import { ActantTag } from "./../";
import api from "api";
import {
  IStatement,
  IActant,
  IAction,
  IStatementAction,
  IStatementProp,
  IResponseStatement,
} from "@shared/types";
import { AttributesEditor } from "../AttributesEditor/AttributesEditor";
import { StatementListTable } from "./StatementListTable/StatementListTable";
import { StatementListHeader } from "./StatementListHeader/StatementListHeader";
import {
  StyledDots,
  StyledTableWrapper,
  StyledText,
} from "./StatementLitBoxStyles";

import {
  StyledPropsActantList,
  StyledPropLineColumn,
} from "../StatementEditorBox/StatementEditorBoxStyles";
import { CStatement, DStatement } from "constructors";
import { useSearchParams } from "hooks";
import { StatementListContextMenu } from "./StatementListContextMenu/StatementListContextMenu";
import { BsArrowUp, BsArrowDown } from "react-icons/bs";
import { UserRole, UserRoleMode } from "@shared/enums";

const initialData: {
  statements: IStatement[];
  actants: IActant[];
  right: UserRoleMode;
} = {
  statements: [],
  actants: [],
  right: UserRoleMode.Read,
};

export const StatementListBox: React.FC = () => {
  const queryClient = useQueryClient();

  const {
    territoryId,
    setTerritoryId,
    statementId,
    setStatementId,
  } = useSearchParams();

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

  const {
    status: statusStatement,
    data: statement,
    error: errorStatement,
    isFetching: isFetchingStatement,
  } = useQuery(
    ["statement", statementId],
    async () => {
      const res = await api.statementGet(statementId);
      return res.data;
    },
    { enabled: !!statementId && api.isLoggedIn(), retry: 2 }
  );

  useEffect(() => {
    if (statement && !territoryId) {
      setTerritoryId(statement.data.territory.id);
    }
  }, [statement, territoryId]);

  useEffect(() => {
    if (error && (error as any).error === "TerritoryDoesNotExits") {
      setTerritoryId("");
    }
  }, [error]);

  const removeStatementMutation = useMutation(
    async (sId: string) => {
      await api.actantsDelete(sId);
    },
    {
      onSuccess: () => {
        toast.info(`Statement removed!`);
        setStatementId("");
        queryClient.invalidateQueries("territory");
        queryClient.invalidateQueries("tree");
        queryClient.invalidateQueries("actant");
      },
    }
  );

  const renderPropGroup = (
    propOriginId: string,
    statement: IResponseStatement
  ) => {
    // getting origin actants of properties
    const propsByOrigins = useMemo(() => {
      if (statement) {
        const allProps = statement?.data.props;
        const statementActants = statement.data.actants.concat(
          statement.data.actions
        );
        const allPossibleOrigins = [...(statementActants || [])];

        const originProps: {
          [key: string]: {
            //type: "action" | "actant";
            origin: string;
            props: any[];
            actant: IActant;
          };
        } = {};

        allPossibleOrigins.forEach((origin) => {
          originProps[origin.actant || (origin.action as string)] = {
            //type: origin.class === "A" ? "action" : "actant",
            origin: origin.actant || origin.action,
            props: [],
            actant: origin,
          };
        });

        // 1st level
        allProps.forEach((prop) => {
          const originProp = originProps[prop.origin];
          if (originProp) {
            originProp.props.push({ ...prop, ...{ props: [] } });
          }
        });

        // 2nd level
        allProps.forEach((prop) => {
          Object.keys(originProps).forEach((opKey: string) => {
            const op = originProps[opKey];
            op.props.forEach((op2) => {
              if (op2.id === prop.origin) {
                op2.props.push(prop);
              }
            });
          });
        });

        return originProps;
      } else {
        return {};
      }
    }, [JSON.stringify(statement)]);

    const propOrigin = propsByOrigins[propOriginId];
    const originActant = propOrigin?.actant;

    if (originActant && propOrigin.props.length > 0) {
      return (
        <React.Fragment key={originActant.id}>
          {propOrigin.props.map((prop1: any, pi1: number) => {
            return (
              <React.Fragment key={prop1 + pi1}>
                {renderPropRow(statement, prop1, "1", pi1, false)}
                {prop1.props.map((prop2: any, pi2: number) => {
                  return renderPropRow(
                    statement,
                    prop2,
                    "2",
                    pi2,
                    pi2 === prop1.props.length - 1
                  );
                })}
              </React.Fragment>
            );
          })}
        </React.Fragment>
      );
    }
  };

  const renderPropRow = (
    statement: IResponseStatement,
    prop: IStatementProp,
    level: "1" | "2",
    order: number,
    lastSecondLevel: boolean
  ) => {
    const propTypeActant =
      actants && actants.find((a) => a && a.id === prop.type.id);
    const propValueActant =
      actants && actants.find((a) => a && a.id === prop.value.id);

    return (
      <React.Fragment key={prop.origin + level + "|" + order}>
        <div style={{ display: "flex" }}>
          <StyledPropLineColumn
            padded={level === "2"}
            lastSecondLevel={lastSecondLevel}
          >
            {propTypeActant ? (
              <ActantTag actant={propTypeActant} short={false} />
            ) : (
              ""
            )}
          </StyledPropLineColumn>
          <StyledPropLineColumn
            padded={level === "2"}
            lastSecondLevel={lastSecondLevel}
          >
            {propValueActant ? (
              <ActantTag actant={propValueActant} short={false} />
            ) : (
              ""
            )}
          </StyledPropLineColumn>
        </div>
      </React.Fragment>
    );
  };

  const duplicateStatementMutation = useMutation(
    async (statementToDuplicate: IResponseStatement) => {
      const {
        actions,
        audits,
        usedIn,
        actants,
        ...newStatementObject
      } = statementToDuplicate;

      const duplicatedStatement = DStatement(newStatementObject as IStatement);
      await api.actantsCreate(duplicatedStatement);
    },
    {
      onSuccess: (data, variables) => {
        setStatementId(variables.id);
        toast.info(`Statement duplicated!`);
        queryClient.invalidateQueries("territory");
        queryClient.invalidateQueries("actant");
      },
      onError: () => {
        toast.error(`Error: Statement not duplicated!`);
      },
    }
  );

  const addStatementAtTheEndMutation = useMutation(
    async (newStatement: IStatement) => {
      await api.actantsCreate(newStatement);
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
    async (newStatement: IStatement) => await api.actantsCreate(newStatement),
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
    let newOrder =
      index === 0
        ? statements[0].data.territory.order - 1
        : (statements[index - 1].data.territory.order +
            statements[index].data.territory.order) /
          2;

    const newStatement: IStatement = CStatement(
      territoryId,
      localStorage.getItem("userrole") as UserRole
    );
    newStatement.data.territory.order = newOrder;

    actantsCreateMutation.mutate(newStatement);
  };

  const { statements, actants } = data || initialData;

  const moveEndRow = async (statementToMove: IStatement, index: number) => {
    // return if order don't change
    if (
      statementToMove.data.territory.order ===
      statements[index].data.territory.order
    ) {
      return;
    }

    // whether row is moving top-bottom direction
    const topDown =
      statementToMove.data.territory.order <
      statements[index].data.territory.order;

    const thisOrder = statementToMove.data.territory.order;
    let allOrders = statements.map((s) => s.data.territory.order);
    allOrders.sort((a, b) => (a > b ? 1 : -1));
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

    const res = await api.actantsUpdate(statementToMove.id, {
      data: {
        territory: {
          id: statementToMove.data.territory.id,
          order: allOrders[index],
        },
      },
    });
    queryClient.invalidateQueries("territory");
  };

  const renderListActant = (actantObject: IActant, key: number) => {
    return (
      actantObject && (
        <ActantTag
          key={key}
          actant={actantObject}
          short
          tooltipPosition="bottom center"
        />
      )
    );
  };

  const renderListActantLong = (
    actantObject: IActant,
    key: number,
    attributes?: boolean,
    statement?: IResponseStatement
  ) => {
    return (
      actantObject && (
        <div key={key}>
          <div style={{ marginTop: "4px", display: "flex" }}>
            <ActantTag
              key={key}
              actant={actantObject}
              tooltipPosition="bottom center"
            />
            {attributes ? (
              <AttributesEditor
                modalTitle={`Actant involvement [${
                  actantObject ? actantObject.label : "undefined"
                }]`}
                userCanEdit={false}
                disabled
                entityType={actantObject ? actantObject.class : false}
                data={
                  {
                    /* TODO make this work
                elvl: actantObject.data.elvl,
                certainty: actantObject.data.certainty,
                logic: actantObject.data.logic,
                virtuality: actantObject.data.virtuality,
                partitivity: actantObject.data.partitivity,
                operator: actantObject.data.operator,
                bundleStart: actantObject.data.bundleStart,
                bundleEnd: actantObject.data.bundleEnd,
              */
                  }
                }
                handleUpdate={(newData) => {}}
              />
            ) : (
              ""
            )}
          </div>
          <div>
            {statement ? renderPropGroup(actantObject.id, statement) : ""}
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
            <ActantTag
              actant={statement as IActant}
              short
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
              actants && actants.find((a) => a.id === actantId);

            return subjectObject;
          });

          const isOversized = subjectIds.length > 2;

          return (
            <TagGroup>
              {subjectObjects
                .slice(0, 2)
                .map((subjectObject: IActant, key: number) =>
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
                        .map((subjectObject: IActant, key: number) =>
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
          const { actions }: { actions?: IAction[] } = row.original;

          if (actions) {
            const isOversized = actions.length > 2;
            return (
              <TagGroup>
                {actions
                  .slice(0, 2)
                  .map((action: IActant, key: number) =>
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
                        {actions
                          .slice(2)
                          .map((action: IActant, key: number) =>
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
              actants && actants.find((a) => a && a.id === actantId);
            return actantObject && actantObject;
          });
          return (
            <TagGroup>
              {actantObjects
                .slice(0, 4)
                .map((actantObject: IActant, key: number) =>
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
                        .map((actantObject: IActant, key: number) =>
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
              actants && actants.find((a) => a && a.id === actantId);
            return actantObject && actantObject;
          });

          return (
            <>
              <div>{actantObjects.length > 0 ? <i>Actants</i> : ""}</div>
              <TagGroup>
                <div style={{ display: "block" }}>
                  {actantObjects.map((actantObject: IActant, key: number) =>
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
              actants && actants.find((a) => a && a.id === actantId);
            return actantObject && actantObject;
          });
          return (
            <>
              <div>{actantObjects.length > 0 ? <i>References</i> : ""}</div>
              <TagGroup>
                <div style={{ display: "block" }}>
                  {actantObjects.map((actantObject: IActant, key: number) =>
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
              actants && actants.find((a) => a && a.id === actantId);
            return actantObject && actantObject;
          });
          return (
            <>
              <div>{actantObjects.length > 0 ? <i>Tags</i> : ""}</div>
              <TagGroup>
                <div style={{ display: "block" }}>
                  {actantObjects.map((actantObject: IActant, key: number) =>
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
    a.data.territory.order > b.data.territory.order ? 1 : -1
  );

  return (
    <>
      {data && (
        <StatementListHeader
          data={data}
          addStatementAtTheEndMutation={addStatementAtTheEndMutation}
        />
      )}

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
          actantsCreateMutation.isLoading
        }
      />
    </>
  );
};
