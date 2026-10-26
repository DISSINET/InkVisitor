import {
  IProp,
  IResponseStatement,
  IStatementAction,
  IStatementData,
} from "@inkvisitor/shared/types";
import update from "immutability-helper";
import React, { useCallback, useState } from "react";
import { FilteredActionObject } from "types";
import { StatementEditorActionTableRow } from "./StatementEditorActionTableRow";
import { StyledEditorActionTableWrapper } from "./StatementEditorActionTableStyles";

const toFilteredActions = (statement: IResponseStatement): FilteredActionObject[] =>
  statement.data.actions.map((sAction, key) => {
    const action = statement.entities[sAction.actionId];
    return { id: key, data: { action, sAction } };
  });

interface StatementEditorActionTable {
  statement: IResponseStatement;
  userCanEdit?: boolean;
  addProp: (originId: string) => void;
  updateProp: (propId: string, changes: Partial<IProp>) => void;
  removeProp: (propId: string) => void;
  movePropToIndex: (propId: string, oldIndex: number, newIndex: number) => void;
  territoryParentId?: string;

  handleDataAttributeChange: (
    changes: Partial<IStatementData>,
    instantUpdate?: boolean
  ) => void;
}
export const StatementEditorActionTable: React.FC<
  StatementEditorActionTable
> = ({
  statement,
  userCanEdit = false,
  addProp,
  updateProp,
  removeProp,
  movePropToIndex,
  territoryParentId,

  handleDataAttributeChange,
}) => {
  // local copy of the actions so drag-reordering can update rows before the
  // order is saved; rebuilt whenever a new statement object arrives
  // TODO: how to temporarily show action from suggester before it comes from BE
  const [filteredActions, setFilteredActions] = useState<FilteredActionObject[]>(() =>
    toFilteredActions(statement)
  );
  const [actionsSource, setActionsSource] = useState(statement);
  if (actionsSource !== statement) {
    setActionsSource(statement);
    setFilteredActions(toFilteredActions(statement));
  }

  const updateActionOrder = () => {
    if (userCanEdit) {
      const actions: IStatementAction[] = filteredActions.map(
        (filteredAction) => filteredAction.data.sAction
      );
      if (JSON.stringify(statement.data.actions) !== JSON.stringify(actions)) {
        handleDataAttributeChange({ actions }, true);
      }
    }
  };

  const moveRow = useCallback((dragIndex: number, hoverIndex: number) => {
    setFilteredActions((prevFilteredActions) =>
      update(prevFilteredActions, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, prevFilteredActions[dragIndex]],
        ],
      })
    );
  }, []);

  return (
    <div style={{ overflow: "auto" }}>
      {filteredActions.length > 0 && (
        <StyledEditorActionTableWrapper>
          {filteredActions.map((filteredAction, key) => {
            return (
              <StatementEditorActionTableRow
                key={key}
                index={key}
                filteredAction={filteredAction}
                statement={statement}
                moveRow={moveRow}
                userCanEdit={userCanEdit}
                updateOrderFn={updateActionOrder}
                addProp={addProp}
                updateProp={updateProp}
                removeProp={removeProp}
                movePropToIndex={movePropToIndex}
                territoryParentId={territoryParentId}
                hasOrder={filteredActions.length > 1}
                handleDataAttributeChange={handleDataAttributeChange}
              />
            );
          })}
        </StyledEditorActionTableWrapper>
      )}
    </div>
  );
};
