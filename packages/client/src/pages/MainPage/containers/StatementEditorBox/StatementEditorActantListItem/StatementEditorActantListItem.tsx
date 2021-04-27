import React, { useRef } from "react";
import { useQueryClient } from "react-query";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
  XYCoord,
} from "react-dnd";
import { FaTrashAlt, FaUnlink } from "react-icons/fa";
import { FaGripVertical } from "react-icons/fa";

import { IActant, IResponseStatement, IStatementActant } from "@shared/types";
import { DragItem, ItemTypes } from "types";
import { actantPositionDict } from "../../../../../../../shared/dictionaries";
import { ActantTag, ActantSuggester, CertaintyToggle, ElvlToggle } from "../..";
import { Input, Button } from "components";
import { StyledActantListItem } from "../StatementEditorBoxStyles";
import api from "api";

interface StatementEditorActantListItem {
  index: number;
  actant: IActant;
  sActant: IStatementActant;
  statement: IResponseStatement;
  statementId: string;
  classEntitiesActant: string[];
  moveFn: (dragIndex: number, hoverIndex: number) => void;
  updateOrderFn: () => void;
}
export const StatementEditorActantListItem: React.FC<StatementEditorActantListItem> = ({
  index,
  actant,
  sActant,
  statement,
  statementId,
  classEntitiesActant,
  moveFn,
  updateOrderFn,
}) => {
  const queryClient = useQueryClient();
  const dropRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

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

  const [, drop] = useDrop({
    accept: ItemTypes.ROW,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!dropRef.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      const hoverBoundingRect = dropRef.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveFn(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    item: { type: ItemTypes.ROW, index, id: actant.id },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: updateOrderFn,
  });

  drag(drop(dropRef));

  return (
    <React.Fragment>
      <StyledActantListItem ref={dropRef}>
        <FaGripVertical style={{ cursor: "move" }} />
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
