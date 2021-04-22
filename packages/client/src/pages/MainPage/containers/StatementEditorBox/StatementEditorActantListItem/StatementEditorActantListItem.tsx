import React from "react";
import { useQueryClient } from "react-query";
import { DragSourceMonitor, useDrag } from "react-dnd";
import { FaTrashAlt, FaUnlink } from "react-icons/fa";
import { FaGripVertical } from "react-icons/fa";

import { IActant, IResponseStatement, IStatementActant } from "@shared/types";
import { DragItem, ItemTypes } from "types";
import { actantPositionDict } from "../../../../../../../shared/dictionaries";
import { ActantTag, ActantSuggester, CertaintyToggle, ElvlToggle } from "../..";
import { Input, Button } from "components";
import api from "api";

import { StyledActantListItem } from "../StatementEditorBoxStyles";

interface StatementEditorActantListItem {
  index: number;
  actant: IActant;
  sActant: IStatementActant;
  statement: IResponseStatement;
  statementId: string;
  classEntitiesActant: string[];
}
export const StatementEditorActantListItem: React.FC<StatementEditorActantListItem> = ({
  index,
  actant,
  sActant,
  statement,
  statementId,
  classEntitiesActant,
}) => {
  const queryClient = useQueryClient();

  const updateActant = (statementActantId: string, changes: any) => {
    if (statement && statementActantId) {
      const updatedActants = statement.data.actants.map((a) =>
        a.id === statementActantId ? { ...a, ...changes } : a
      );
      const newData = { ...statement.data, ...{ actants: updatedActants } };
      updateApiCall(newData);
    }
  };
  const removeActant = (statementActantId: string) => {
    if (statement) {
      const updatedActants = statement.data.actants.filter(
        (a) => a.id !== statementActantId
      );
      const newData = { ...statement.data, ...{ actants: updatedActants } };
      updateApiCall(newData);
    }
  };
  const updateApiCall = async (changes: object) => {
    const res = await api.actantsUpdate(statementId, {
      data: changes,
    });
    queryClient.invalidateQueries(["statement"]);
  };

  const [{ isDragging }, drag, preview] = useDrag({
    item: { type: ItemTypes.ROW, index, id: sActant.id },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item: DragItem | undefined, monitor: DragSourceMonitor) => {},
    // api.territoryMoveStatement(`${row.values.id}`, index),
  });

  return (
    <React.Fragment>
      <StyledActantListItem>
        <FaGripVertical />
      </StyledActantListItem>

      <StyledActantListItem>
        {actant ? (
          <ActantTag
            actant={actant}
            short={false}
            button={
              <Button
                key="d"
                tooltip="unlink actant"
                icon={<FaUnlink />}
                color="danger"
                onClick={() => {
                  updateActant(sActant.id, {
                    actant: "",
                  });
                }}
              />
            }
          />
        ) : (
          <ActantSuggester
            onSelected={(newSelectedId: string) => {
              updateActant(sActant.id, {
                actant: newSelectedId,
              });
            }}
            categoryIds={classEntitiesActant}
          />
        )}
      </StyledActantListItem>
      <StyledActantListItem>
        <Input
          type="select"
          value={sActant.position}
          options={actantPositionDict}
          onChangeFn={(newPosition: any) => {
            updateActant(sActant.id, {
              position: newPosition,
            });
          }}
        ></Input>
      </StyledActantListItem>
      <StyledActantListItem>
        <ElvlToggle
          value={sActant.elvl}
          onChangeFn={(newValue: string) => {
            updateActant(sActant.id, {
              elvl: newValue,
            });
          }}
        />
        <CertaintyToggle
          value={sActant.certainty}
          onChangeFn={(newValue: string) => {
            updateActant(sActant.id, {
              certainty: newValue,
            });
          }}
        />
      </StyledActantListItem>
      <StyledActantListItem>
        <Button
          key="d"
          icon={<FaTrashAlt />}
          color="danger"
          tooltip="remove actant row"
          onClick={() => {
            removeActant(sActant.id);
          }}
        />
      </StyledActantListItem>
    </React.Fragment>
  );
};
