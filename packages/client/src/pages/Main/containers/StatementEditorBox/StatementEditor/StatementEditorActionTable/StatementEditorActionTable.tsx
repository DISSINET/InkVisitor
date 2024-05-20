import {
  IResponseStatement,
  IStatementAction,
  IStatementData,
} from "@shared/types";
import update from "immutability-helper";
import React, { useCallback, useEffect, useState } from "react";
import { FilteredActionObject } from "types";
import { StatementEditorActionTableRow } from "./StatementEditorActionTableRow";
import { StyledEditorActionTableWrapper } from "./StatementEditorActionTableStyles";

interface StatementEditorActionTable {
  statement: IResponseStatement;
  userCanEdit?: boolean;
  addProp: (originId: string) => void;
  updateProp: (propId: string, changes: any) => void;
  removeProp: (propId: string) => void;
  movePropToIndex: (propId: string, oldIndex: number, newIndex: number) => void;
  territoryParentId?: string;
  territoryActants?: string[];

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
  territoryActants,

  handleDataAttributeChange,
}) => {
  const [filteredActions, setFilteredActions] = useState<
    FilteredActionObject[]
  >([]);

  // TODO: how to temporarily show action from suggester before it comes from BE
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
                territoryActants={territoryActants}
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
