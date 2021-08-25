import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Column, useTable, useExpanded, Row, Cell } from "react-table";
import update from "immutability-helper";
import {
  StyledTable,
  StyledTHead,
  StyledTh,
} from "../StatementEditorActionTable/StatementEditorActionTableStyles";
import { StatementEditorActionTableRow } from "./StatementEditorActionTableRow/StatementEditorActionTableRow";
import {
  IAction,
  IActant,
  IResponseGeneric,
  IResponseStatement,
  IStatementAction,
} from "@shared/types";
import { ActantSuggester, ActantTag, CertaintyToggle, ElvlToggle } from "../..";
import { StatementEditorAttributes } from "./../StatementEditorAttributes/StatementEditorAttributes";
import { Button, Input } from "components";
import { FaTrashAlt, FaUnlink } from "react-icons/fa";
import { useMutation, UseMutationResult, useQueryClient } from "react-query";
import { AxiosResponse } from "axios";
import api from "api";
const queryString = require("query-string");

interface FilteredActionObject {
  data: { action: IActant | undefined; sAction: IStatementAction };
}
interface StatementEditorActionTable {
  statement: IResponseStatement;
  statementId: string;
  handleRowClick?: Function;
  updateActionsMutation: UseMutationResult<any, unknown, object, unknown>;
}
export const StatementEditorActionTable: React.FC<StatementEditorActionTable> =
  ({
    statement,
    statementId,
    handleRowClick = () => {},
    updateActionsMutation,
  }) => {
    const queryClient = useQueryClient();
    var hashParams = queryString.parse(location.hash);
    const territoryId = hashParams.territory;

    const [filteredActions, setFilteredActions] = useState<
      FilteredActionObject[]
    >([]);

    useEffect(() => {
      const filteredActions = statement.data.actions.map((sAction, key) => {
        const action = statement.actants.find((a) => a.id === sAction.action);
        return { id: key, data: { action, sAction } };
      });
      setFilteredActions(filteredActions);
    }, [statement]);

    const updateAction = (statementActionId: string, changes: any) => {
      if (statement && statementActionId) {
        const updatedActions = statement.data.actions.map((a) =>
          a.id === statementActionId ? { ...a, ...changes } : a
        );
        const newData = { actions: updatedActions };
        updateActionsMutation.mutate(newData);
      }
    };
    const removeAction = (statementActionId: string) => {
      if (statement) {
        const updatedActions = statement.data.actions.filter(
          (a) => a.id !== statementActionId
        );
        const newData = { actions: updatedActions };
        updateActionsMutation.mutate(newData);
      }
    };

    const updateActionOrder = () => {
      const actions: IStatementAction[] = filteredActions.map(
        (filteredAction) => filteredAction.data.sAction
      );
      updateActionsMutation.mutate({
        actions: actions,
      });
    };

    const columns: Column<{}>[] = useMemo(() => {
      return [
        {
          Header: "ID",
          accessor: "id",
        },
        {
          Header: "Action",
          accessor: "data",
          Cell: ({ row }: Cell) => {
            const { action, sAction } = row.values.data;
            return action ? (
              <ActantTag
                actant={action}
                short={false}
                button={
                  <Button
                    key="d"
                    tooltip="unlink action"
                    icon={<FaUnlink />}
                    color="danger"
                    onClick={() => {
                      updateAction(sAction.id, {
                        action: "",
                      });
                    }}
                  />
                }
              />
            ) : (
              <ActantSuggester
                onSelected={(newSelectedId: string) => {
                  updateAction(sAction.id, {
                    action: newSelectedId,
                  });
                }}
                categoryIds={["A"]}
                placeholder={"add new action"}
              />
            );
          },
        },
        {
          id: "Attributes",
          Cell: ({ row }: Cell) => {
            const { action, sAction } = row.values.data;
            return action && sAction ? (
              <StatementEditorAttributes
                modalTitle={action.label}
                data={{
                  elvl: sAction.elvl,
                  certainty: sAction.certainty,
                  logic: sAction.logic,
                  mood: sAction.mood,
                  moodvariant: sAction.moodvariant,
                  operator: sAction.operator,
                }}
                handleUpdate={(newData) => {
                  updateAction(sAction.id, newData);
                }}
              />
            ) : (
              <div />
            );
          },
        },
        {
          Header: "",
          id: "expander",
          Cell: ({ row }: Cell) => (
            <Button
              key="d"
              icon={<FaTrashAlt />}
              color="danger"
              tooltip="remove action row"
              onClick={() => {
                removeAction(row.values.data.sAction.id);
              }}
            />
          ),
        },
      ];
    }, [filteredActions]);

    const getRowId = useCallback((row) => {
      return row.id;
    }, []);
    const {
      getTableProps,
      getTableBodyProps,
      headerGroups,
      rows,
      prepareRow,
      visibleColumns,
    } = useTable(
      {
        columns,
        data: filteredActions,
        getRowId,
        initialState: {
          hiddenColumns: ["id"],
        },
      },
      useExpanded
    );

    const moveRow = useCallback(
      (dragIndex: number, hoverIndex: number) => {
        const dragRecord = filteredActions[dragIndex];
        setFilteredActions(
          update(filteredActions, {
            $splice: [
              [dragIndex, 1],
              [hoverIndex, 0, dragRecord],
            ],
          })
        );
      },
      [filteredActions]
    );

    return (
      <StyledTable {...getTableProps()}>
        <StyledTHead>
          {headerGroups.map((headerGroup, key) => (
            <tr {...headerGroup.getHeaderGroupProps()} key={key}>
              <th></th>
              {headerGroup.headers.map((column, key) => (
                <StyledTh {...column.getHeaderProps()} key={key}>
                  {column.render("Header")}
                </StyledTh>
              ))}
            </tr>
          ))}
        </StyledTHead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row: Row, i: number) => {
            prepareRow(row);
            return (
              <StatementEditorActionTableRow
                handleClick={handleRowClick}
                index={i}
                row={row}
                moveRow={moveRow}
                updateOrderFn={updateActionOrder}
                {...row.getRowProps()}
              />
            );
          })}
        </tbody>
      </StyledTable>
    );
  };
