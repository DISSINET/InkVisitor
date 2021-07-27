import React, { useMemo, useRef, useState } from "react";
import { Cell, Column } from "react-table";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  FaInfo,
  FaTrashAlt,
  FaPlus,
  FaRegCircle,
  FaDotCircle,
  FaClone,
} from "react-icons/fa";
import { useLocation, useHistory } from "react-router";
import { toast } from "react-toastify";
const queryString = require("query-string");

import { Button, ButtonGroup, Loader, TagGroup, Tooltip } from "components";
import { ActantTag } from "./../";
import api from "api";
import { IStatement, IActant, IAction } from "@shared/types";
import { ActantType } from "@shared/enums";
import { StatementListTable } from "./StatementListTable/StatementListTable";
import { StatementListHeader } from "./StatementListHeader/StatementListHeader";
import {
  StyledDots,
  StyledSelectorCell,
  StyledActionLabel,
} from "./StatementLitBoxStyles";
import { CStatement, DStatement } from "constructors";

const initialData: {
  statements: IStatement[];
  actants: IActant[];
  label: string;
} = {
  statements: [],
  actants: [],
  label: "",
};

export const StatementListBox: React.FC = () => {
  const queryClient = useQueryClient();
  let history = useHistory();
  let location = useLocation();
  var hashParams = queryString.parse(location.hash);
  const territoryId = hashParams.territory;
  const statementId = hashParams.statement;

  const { status, data, error, isFetching } = useQuery(
    ["territory", "statement-list", territoryId],
    async () => {
      const res = await api.territoryGet(territoryId);
      // console.log("data", res.data);
      return res.data;
    },
    { initialData: initialData, enabled: !!territoryId && api.isLoggedIn() }
  );

  const removeStatementMutation = useMutation(
    async (sId: string) => {
      await api.actantsDelete(sId);
    },
    {
      onSuccess: () => {
        toast.info(`Statement removed!`);
        queryClient.invalidateQueries("territory");
        queryClient.invalidateQueries("tree");
      },
    }
  );

  const duplicateStatementMutation = useMutation(
    async (statementToDuplicate: IStatement) => {
      const duplicatedStatement = DStatement(statementToDuplicate);
      await api.actantsCreate(duplicatedStatement);
    },
    {
      onSuccess: (data, variables) => {
        hashParams["statement"] = variables.id;
        history.push({
          hash: queryString.stringify(hashParams),
        });
        toast.info(`Statement duplicated!`);
        queryClient.invalidateQueries("territory");
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
        hashParams["statement"] = variables.id;
        history.push({
          hash: queryString.stringify(hashParams),
        });
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

    const newStatement: IStatement = CStatement(territoryId);
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
    queryClient.invalidateQueries(["territory", "statement-list", territoryId]);
  };

  const columns: Column<{}>[] = useMemo(() => {
    return [
      {
        Header: "ID",
        accessor: "id",
      },
      {
        Header: "Subjects",
        accessor: "data",
        Cell: ({ row }: Cell) => {
          const subjectIds = row.values.data?.actants
            ? row.values.data.actants
                .filter((a: any) => a.position === "s")
                .map((a: any) => a.actant)
            : [];

          const isOversized = subjectIds.length > 1;
          const subjectIdsSlice = subjectIds.slice(0, 1);

          return (
            <TagGroup>
              {subjectIdsSlice
                .filter((a: any) => a)
                .map((actantId: string, ai: number) => {
                  const subjectObject =
                    actants && actants.find((a) => a.id === actantId);

                  return (
                    subjectObject && (
                      <ActantTag key={ai} actant={subjectObject} short />
                    )
                  );
                })}
              {isOversized && <StyledDots>{"..."}</StyledDots>}
            </TagGroup>
          );
        },
      },
      {
        Header: "Type",
        accessor: "data.action",
        Cell: ({ row }: Cell) => {
          const actionTypeLabel = row.values.data?.action;
          const actionLabel: string = "";
          // actions?.find(
          //   (a: IAction) => a.id === actionTypeLabel
          // )?.label;

          return (
            <div>
              <div>
                {/* {actionLabel + " | " + row.values.data?.territory.order} */}
              </div>
              {actionLabel &&
                (actionLabel.length > 9 ? (
                  <Tooltip label={actionLabel}>
                    <StyledActionLabel>{actionLabel}</StyledActionLabel>
                  </Tooltip>
                ) : (
                  actionLabel
                ))}
            </div>
          );
        },
      },
      {
        Header: "Actants",
        Cell: ({ row }: Cell) => {
          const actantIds = row.values.data?.actants
            ? row.values.data.actants
                .filter((a: any) => a.position !== "s")
                .map((a: any) => a.actant)
            : [];
          const isOversized = actantIds.length > 4;
          const actantIdsSlice = actantIds.slice(0, 4);

          return (
            <TagGroup>
              {actantIdsSlice
                .filter((a: any) => a)
                .map((actantId: string, ai: number) => {
                  const actantObject =
                    actants && actants.find((a) => a && a.id === actantId);

                  return (
                    actantObject && (
                      <ActantTag key={ai} actant={actantObject} short />
                    )
                  );
                })}
              {isOversized && <StyledDots>{"..."}</StyledDots>}
            </TagGroup>
          );
        },
      },
      {
        Header: "",
        id: "expander",
        width: 300,
        Cell: ({ row }: Cell) => (
          <ButtonGroup noMargin>
            <span {...row.getToggleRowExpandedProps()}>
              <Button
                key="i"
                icon={<FaInfo size={14} />}
                tooltip="info"
                color="info"
                onClick={() => (row.isExpanded = !row.isExpanded)}
              />
            </span>

            <Button
              key="d"
              icon={<FaClone size={14} />}
              color="success"
              tooltip="duplicate"
              onClick={() => {
                duplicateStatementMutation.mutate(row.original as IStatement);
              }}
            />

            <Button
              key="r"
              icon={<FaTrashAlt size={14} />}
              color="danger"
              tooltip="delete"
              onClick={() => {
                removeStatementMutation.mutate((row.original as IStatement).id);
              }}
            />
            <Button
              key="add"
              icon={<FaPlus size={14} />}
              tooltip="add new statement before"
              color="warning"
              onClick={() => addStatementAtCertainIndex(row.index)}
            />
          </ButtonGroup>
        ),
      },
      {
        Header: "",
        id: "Selector",
        Cell: ({ row }: Cell) => {
          return (
            <StyledSelectorCell>
              {hashParams["statement"] === row.values.id ? (
                <FaDotCircle
                  size={18}
                  onClick={() => selectStatementRow(row.values.id)}
                />
              ) : (
                <FaRegCircle
                  size={18}
                  onClick={() => selectStatementRow(row.values.id)}
                />
              )}
            </StyledSelectorCell>
          );
        },
      },
    ];
  }, [data, hashParams["statement"]]);

  const selectStatementRow = (rowId: string) => {
    hashParams["statement"] = rowId;
    history.push({
      hash: queryString.stringify(hashParams),
    });
  };

  statements.sort((a, b) =>
    a.data.territory.order > b.data.territory.order ? 1 : -1
  );

  return (
    <>
      <StatementListHeader data={data ? data : initialData} />
      <StatementListTable
        moveEndRow={moveEndRow}
        data={statements}
        columns={columns}
        handleRowClick={(rowId: string) => {
          // selectStatementRow(rowId)
        }}
      />
      <Loader show={isFetching} />
    </>
  );
};
