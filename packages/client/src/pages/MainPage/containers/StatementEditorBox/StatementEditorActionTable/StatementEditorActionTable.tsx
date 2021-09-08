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
import { FaPlus, FaTrashAlt, FaUnlink } from "react-icons/fa";
import { useMutation, UseMutationResult, useQueryClient } from "react-query";
import { ActantType } from "@shared/enums";

interface FilteredActionObject {
  data: { action: IActant | undefined; sAction: IStatementAction };
}
interface StatementEditorActionTable {
  statement: IResponseStatement;
  statementId: string;
  handleRowClick?: Function;
  renderPropGroup: Function;
  updateActionsMutation: UseMutationResult<any, unknown, object, unknown>;
  addProp: (originId: string) => void;
  propsByOrigins: {
    [key: string]: {
      type: "action" | "actant";
      origin: string;
      props: any[];
      actant: IActant;
    };
  };
}
export const StatementEditorActionTable: React.FC<StatementEditorActionTable> =
  ({
    statement,
    statementId,
    handleRowClick = () => {},
    renderPropGroup,
    updateActionsMutation,
    addProp,
    propsByOrigins,
  }) => {
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
              // <StyledCell>
              <ActantTag
                actant={action}
                short={false}
                button={
                  <Button
                    key="d"
                    tooltip="unlink action"
                    icon={<FaUnlink />}
                    inverted={true}
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
                entityType={ActantType.Action}
                data={{
                  elvl: sAction.elvl,
                  certainty: sAction.certainty,
                  logic: sAction.logic,
                  mood: sAction.mood,
                  moodvariant: sAction.moodvariant,
                  operator: sAction.operator,
                  bundleStart: sAction.bundleStart,
                  bundleEnd: sAction.bundleEnd,
                }}
                handleUpdate={(newData) => {
                  updateAction(sAction.id, newData);
                }}
                loading={updateActionsMutation.isLoading}
              />
            ) : (
              <div />
            );
          },
        },
        {
          Header: "",
          id: "remove",
          Cell: ({ row }: Cell) => (
            <Button
              key="d"
              icon={<FaTrashAlt />}
              color="danger"
              inverted={true}
              tooltip="remove action row"
              onClick={() => {
                removeAction(row.values.data.sAction.id);
              }}
            />
          ),
        },
        {
          Header: "",
          id: "add",
          Cell: ({ row }: Cell) => {
            const propOriginId = row.values.data.sAction.action;
            // const propOriginId = row.values.data.action.id;
            // const propOrigin = propsByOrigins[propOriginId];
            // const originActant = propOrigin?.actant;
            return (
              <Button
                key="a"
                icon={<FaPlus />}
                color="plain"
                inverted={true}
                tooltip="add new prop"
                onClick={() => {
                  addProp(propOriginId);
                }}
              />
            );
          },
        },
      ];
    }, [filteredActions, updateActionsMutation]);

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
        <tbody {...getTableBodyProps()}>
          {rows.map((row: Row, i: number) => {
            prepareRow(row);
            return (
              <StatementEditorActionTableRow
                renderPropGroup={renderPropGroup}
                handleClick={handleRowClick}
                index={i}
                row={row}
                statement={statement}
                moveRow={moveRow}
                updateOrderFn={updateActionOrder}
                visibleColumns={visibleColumns}
                {...row.getRowProps()}
              />
            );
          })}
        </tbody>
      </StyledTable>
    );
  };
