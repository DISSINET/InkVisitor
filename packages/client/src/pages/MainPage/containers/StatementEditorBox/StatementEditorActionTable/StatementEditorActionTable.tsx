import { IResponseStatement, IStatementAction } from "@shared/types";
import update from "immutability-helper";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { UseMutationResult } from "react-query";
import { Column, useExpanded, useTable } from "react-table";
import { FilteredActionObject } from "types";
import { StatementEditorActionTableRow } from "./StatementEditorActionTableRow";

interface StatementEditorActionTable {
  statement: IResponseStatement;
  userCanEdit?: boolean;
  updateActionsMutation: UseMutationResult<any, unknown, object, unknown>;
  addProp: (originId: string) => void;
  updateProp: (propId: string, changes: any) => void;
  removeProp: (propId: string) => void;
  movePropToIndex: (propId: string, oldIndex: number, newIndex: number) => void;
  territoryParentId?: string;
}
export const StatementEditorActionTable: React.FC<
  StatementEditorActionTable
> = ({
  statement,
  userCanEdit = false,
  updateActionsMutation,
  addProp,
  updateProp,
  removeProp,
  movePropToIndex,
  territoryParentId,
}) => {
  const [filteredActions, setFilteredActions] = useState<
    FilteredActionObject[]
  >([]);

  useEffect(() => {
    const filteredActions: FilteredActionObject[] = statement.data.actions.map(
      (sAction, key) => {
        const action = statement.entities[sAction.actionId];
        return { id: key, data: { action, sAction } };
      }
    );
    setFilteredActions(filteredActions);
  }, [statement]);

  const updateActionOrder = () => {
    if (userCanEdit) {
      const actions: IStatementAction[] = filteredActions.map(
        (filteredAction) => filteredAction.data.sAction
      );
      if (JSON.stringify(statement.data.actions) !== JSON.stringify(actions)) {
        updateActionsMutation.mutate({
          actions: actions,
        });
      }
    }
  };

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

  const columns: Column<{}>[] = useMemo(() => {
    return [
      {
        Header: "ID",
        accessor: "id",
      },
      {
        Header: "Action",
        accessor: "data",
      },
      {
        id: "Attributes & Buttons",
      },
    ];
  }, [filteredActions, updateActionsMutation.isLoading]);

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

  return (
    <>
      {/* <StyledTable {...getTableProps()}>
        <tbody {...getTableBodyProps()}>
          {rows.map((row: Row, i: number) => {
            prepareRow(row);
            return (
              <StatementEditorActionTableRow
                index={i}
                row={row}
                statement={statement}
                moveRow={moveRow}
                userCanEdit={userCanEdit}
                updateOrderFn={updateActionOrder}
                visibleColumns={visibleColumns}
                updateActionsMutation={updateActionsMutation}
                addProp={addProp}
                updateProp={updateProp}
                removeProp={removeProp}
                movePropToIndex={movePropToIndex}
                territoryParentId={territoryParentId}
                {...row.getRowProps()}
              />
            );
          })}
        </tbody>
      </StyledTable> */}

      {filteredActions.length > 0 &&
        filteredActions.map((filteredAction, key) => {
          return (
            <StatementEditorActionTableRow
              index={key}
              filteredAction={filteredAction}
              statement={statement}
              moveRow={moveRow}
              userCanEdit={userCanEdit}
              updateOrderFn={updateActionOrder}
              visibleColumns={visibleColumns}
              updateActionsMutation={updateActionsMutation}
              addProp={addProp}
              updateProp={updateProp}
              removeProp={removeProp}
              movePropToIndex={movePropToIndex}
              territoryParentId={territoryParentId}
            />
          );
        })}
    </>
  );
};
