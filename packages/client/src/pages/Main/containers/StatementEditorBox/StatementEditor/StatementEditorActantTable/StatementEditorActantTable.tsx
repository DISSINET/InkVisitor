import { EntityEnums } from "@inkvisitor/shared/enums";
import {
  IProp,
  IResponseStatement,
  IStatementActant,
  IStatementData,
} from "@inkvisitor/shared/types";
import update from "immutability-helper";
import React, { useCallback, useState } from "react";
import { FilteredActantObject } from "types";
import { StatementEditorActantTableRow } from "./StatementEditorActantTableRow";
import { StyledEditorActantTableWrapper } from "./StatementEditorActantTableStyles";

const toFilteredActants = (statement: IResponseStatement): FilteredActantObject[] =>
  statement.data.actants.map((sActant, key) => {
    const actant = statement.entities[sActant.entityId];
    return { id: key, data: { actant, sActant } };
  });

interface StatementEditorActantTable {
  statement: IResponseStatement;
  userCanEdit?: boolean;
  classEntitiesActant: EntityEnums.Class[];
  addProp: (originId: string) => void;
  updateProp: (propId: string, changes: Partial<IProp>) => void;
  removeProp: (propId: string) => void;
  movePropToIndex: (propId: string, oldIndex: number, newIndex: number) => void;
  territoryParentId?: string;
  addClassification: (originId: string) => void;
  addIdentification: (originId: string) => void;

  handleDataAttributeChange: (
    changes: Partial<IStatementData>,
    instantUpdate?: boolean
  ) => void;
}
export const StatementEditorActantTable: React.FC<
  StatementEditorActantTable
> = ({
  statement,
  userCanEdit = false,
  classEntitiesActant,
  addProp,
  updateProp,
  removeProp,
  movePropToIndex,
  territoryParentId,
  addClassification,
  addIdentification,

  handleDataAttributeChange,
}) => {
  // local copy of the actants so drag-reordering can update rows before the
  // order is saved; rebuilt whenever a new statement object arrives
  const [filteredActants, setFilteredActants] = useState<FilteredActantObject[]>(() =>
    toFilteredActants(statement)
  );
  const [actantsSource, setActantsSource] = useState(statement);
  if (actantsSource !== statement) {
    setActantsSource(statement);
    setFilteredActants(toFilteredActants(statement));
  }

  const updateActantsOrder = () => {
    if (userCanEdit) {
      const actants: IStatementActant[] = filteredActants?.map(
        (filteredActant) => filteredActant.data.sActant
      );
      if (JSON.stringify(statement.data.actants) !== JSON.stringify(actants)) {
        handleDataAttributeChange({ actants }, true);
      }
    }
  };

  const moveRow = useCallback((dragIndex: number, hoverIndex: number) => {
    setFilteredActants((prevFilteredActants) =>
      update(prevFilteredActants, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, prevFilteredActants[dragIndex]],
        ],
      })
    );
  }, []);

  return (
    <div style={{ overflow: "auto" }}>
      {filteredActants.length > 0 && (
        <StyledEditorActantTableWrapper>
          {filteredActants.map((filteredActant, key) => {
            return (
              <StatementEditorActantTableRow
                key={key}
                index={key}
                filteredActant={filteredActant}
                statement={statement}
                moveRow={moveRow}
                userCanEdit={userCanEdit}
                updateOrderFn={updateActantsOrder}
                classEntitiesActant={classEntitiesActant}
                addProp={addProp}
                updateProp={updateProp}
                removeProp={removeProp}
                movePropToIndex={movePropToIndex}
                territoryParentId={territoryParentId}
                addClassification={addClassification}
                addIdentification={addIdentification}
                hasOrder={filteredActants.length > 1}
                handleDataAttributeChange={handleDataAttributeChange}
              />
            );
          })}
        </StyledEditorActantTableWrapper>
      )}
    </div>
  );
};
