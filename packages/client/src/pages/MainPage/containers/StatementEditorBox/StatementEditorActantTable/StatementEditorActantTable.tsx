import { EntityEnums } from "@shared/enums";
import { IEntity, IResponseStatement, IStatementActant } from "@shared/types";
import update from "immutability-helper";
import React, { useCallback, useMemo, useState } from "react";
import { UseMutationResult } from "react-query";
import { FilteredActantObject } from "types";
import { StatementEditorActantTableRow } from "./StatementEditorActantTableRow";

interface StatementEditorActantTable {
  statement: IResponseStatement;
  userCanEdit?: boolean;
  classEntitiesActant: EntityEnums.Class[];
  updateStatementDataMutation: UseMutationResult<any, unknown, object, unknown>;
  addProp: (originId: string) => void;
  updateProp: (propId: string, changes: any) => void;
  removeProp: (propId: string) => void;
  movePropToIndex: (propId: string, oldIndex: number, newIndex: number) => void;
  territoryParentId?: string;
  addClassification: (originId: string) => void;
  addIdentification: (originId: string) => void;
  territoryActants?: string[];
}
export const StatementEditorActantTable: React.FC<
  StatementEditorActantTable
> = ({
  statement,
  userCanEdit = false,
  classEntitiesActant,
  updateStatementDataMutation,
  addProp,
  updateProp,
  removeProp,
  movePropToIndex,
  territoryParentId,
  addClassification,
  addIdentification,
  territoryActants,
}) => {
  const [filteredActants, setFilteredActants] = useState<
    FilteredActantObject[]
  >([]);

  useMemo(() => {
    const filteredActants: FilteredActantObject[] = statement.data.actants.map(
      (sActant, key) => {
        const actant = statement.entities[sActant.entityId];
        return { id: key, data: { actant, sActant } };
      }
    );
    setFilteredActants(filteredActants);
  }, [statement]);

  const updateActantsOrder = () => {
    if (userCanEdit) {
      const actants: IStatementActant[] = filteredActants.map(
        (filteredActant) => filteredActant.data.sActant
      );
      if (JSON.stringify(statement.data.actants) !== JSON.stringify(actants)) {
        updateStatementDataMutation.mutate({ actants });
      }
    }
  };

  const moveRow = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragRecord = filteredActants[dragIndex];
      setFilteredActants(
        update(filteredActants, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragRecord],
          ],
        })
      );
    },
    [filteredActants]
  );

  return (
    <>
      {filteredActants.length > 0 &&
        filteredActants.map((filteredActant, key) => {
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
              updateStatementDataMutation={updateStatementDataMutation}
              addProp={addProp}
              updateProp={updateProp}
              removeProp={removeProp}
              movePropToIndex={movePropToIndex}
              territoryParentId={territoryParentId}
              addClassification={addClassification}
              addIdentification={addIdentification}
              territoryActants={territoryActants}
              hasOrder={filteredActants.length > 1}
            />
          );
        })}
    </>
  );
};
