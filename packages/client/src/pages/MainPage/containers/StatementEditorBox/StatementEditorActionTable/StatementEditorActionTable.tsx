import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Column, useTable, useExpanded, Row, Cell } from "react-table";
import update from "immutability-helper";
import { StyledTable } from "../StatementEditorActionTable/StatementEditorActionTableStyles";
import { StatementEditorActionTableRow } from "./StatementEditorActionTableRow";
import {
  IAction,
  IActant,
  IResponseGeneric,
  IResponseStatement,
  IStatementAction,
} from "@shared/types";
import { ActantSuggester, ActantTag } from "../..";
import { AttributesEditor } from "../../AttributesEditor/AttributesEditor";
import { Button, ButtonGroup } from "components";
import { FaPlus, FaTrashAlt, FaUnlink } from "react-icons/fa";
import { UseMutationResult } from "react-query";
import { ActantType } from "@shared/enums";

interface FilteredActionObject {
  data: { action: IActant | undefined; sAction: IStatementAction };
}
interface StatementEditorActionTable {
  statement: IResponseStatement;
  statementId: string;
  userCanEdit?: boolean;
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
export const StatementEditorActionTable: React.FC<StatementEditorActionTable> = ({
  statement,
  statementId,
  userCanEdit = false,
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
      const action = statement.actants?.find((a) => a.id === sAction.action);
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
        Cell: ({ row }: Cell) => {
          const { action, sAction } = row.values.data;
          return action ? (
            <ActantTag
              actant={action}
              button={
                userCanEdit && (
                  <Button
                    key="d"
                    tooltip="unlink action"
                    icon={<FaUnlink />}
                    inverted
                    color="plain"
                    onClick={() => {
                      updateAction(sAction.id, {
                        action: "",
                      });
                    }}
                  />
                )
              }
            />
          ) : (
            userCanEdit && (
              <ActantSuggester
                onSelected={(newSelectedId: string) => {
                  updateAction(sAction.id, {
                    action: newSelectedId,
                  });
                }}
                categoryIds={["A"]}
                excludeEntities={["V"]}
                placeholder={"add new action"}
              />
            )
          );
        },
      },
      {
        id: "Attributes & Buttons",
        Cell: ({ row }: Cell) => {
          const { action, sAction } = row.values.data;
          const propOriginId = row.values.data.sAction.action;
          return (
            <ButtonGroup noMargin>
              {sAction ? (
                <AttributesEditor
                  modalTitle={`Action involvement [${
                    action ? action.label : ""
                  }]`}
                  disabledAllAttributes={!userCanEdit}
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
              )}
              {userCanEdit && (
                <Button
                  key="d"
                  icon={<FaTrashAlt />}
                  color="plain"
                  inverted={true}
                  tooltip="remove action row"
                  onClick={() => {
                    removeAction(row.values.data.sAction.id);
                  }}
                />
              )}
              {userCanEdit && (
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
              )}
            </ButtonGroup>
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
              userCanEdit={userCanEdit}
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
