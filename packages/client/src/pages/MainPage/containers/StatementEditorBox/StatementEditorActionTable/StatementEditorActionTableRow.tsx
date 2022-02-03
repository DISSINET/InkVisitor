import { ActantType } from "@shared/enums";
import { IResponseStatement } from "@shared/types";
import { AttributeIcon, Button, ButtonGroup } from "components";
import { useSearchParams } from "hooks";
import React, { useRef } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
  XYCoord,
} from "react-dnd";
import { FaGripVertical, FaPlus, FaTrashAlt, FaUnlink } from "react-icons/fa";
import { UseMutationResult } from "react-query";
import { ColumnInstance } from "react-table";
import { excludedSuggesterEntities } from "Theme/constants";
import { DragItem, ItemTypes } from "types";
import { EntitySuggester, EntityTag } from "../..";
import AttributesEditor from "../../AttributesEditor/AttributesEditor";
import { StyledTd, StyledTr } from "./StatementEditorActionTableStyles";

interface StatementEditorActionTableRow {
  row: any;
  index: number;
  moveRow: any;
  statement: IResponseStatement;
  userCanEdit?: boolean;
  updateOrderFn: () => void;
  addProp: (originId: string) => void;
  handleClick: Function;
  renderPropGroup: Function;
  visibleColumns: ColumnInstance<{}>[];
  updateActionsMutation: UseMutationResult<any, unknown, object, unknown>;
}

export const StatementEditorActionTableRow: React.FC<
  StatementEditorActionTableRow
> = ({
  row,
  index,
  moveRow,
  statement,
  userCanEdit = false,
  updateOrderFn,
  addProp,
  updateActionsMutation,
  handleClick = () => {},
  renderPropGroup,
  visibleColumns,
}) => {
  const { statementId } = useSearchParams();

  const dropRef = useRef<HTMLTableRowElement>(null);
  const dragRef = useRef<HTMLTableDataCellElement>(null);

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

  const [, drop] = useDrop({
    accept: ItemTypes.ACTANT_ROW,
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
      moveRow(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    item: { type: ItemTypes.ACTANT_ROW, index, id: row.values.id },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item: DragItem | undefined, monitor: DragSourceMonitor) => {
      if (item) updateOrderFn();
    },
  });

  const opacity = isDragging ? 0.2 : 1;

  preview(drop(dropRef));
  drag(dragRef);

  const renderActionCell = () => {
    const { action, sAction } = row.values.data;
    return action ? (
      <EntityTag
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
        <EntitySuggester
          onSelected={(newSelectedId: string) => {
            updateAction(sAction.id, {
              action: newSelectedId,
            });
          }}
          categoryTypes={[ActantType.Action]}
          excludedEntities={excludedSuggesterEntities}
          placeholder={"add new action"}
        />
      )
    );
  };

  const renderButtonsCell = () => {
    const { action, sAction } = row.values.data;
    const propOriginId = row.values.data.sAction.action;

    return (
      <ButtonGroup noMargin>
        {sAction && (
          <AttributesEditor
            modalTitle={`Action attribute`}
            actant={action}
            disabledAllAttributes={!userCanEdit}
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
            updateActantId={(newId: string) => {
              updateAction(sAction.id, { action: newId });
            }}
            userCanEdit={userCanEdit}
            classEntitiesActant={[ActantType.Action]}
            loading={updateActionsMutation.isLoading}
          />
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
        {sAction.logic == "2" && (
          <Button
            key="neg"
            tooltip="Negative logic"
            color="success"
            inverted={true}
            noBorder
            icon={<AttributeIcon attributeName={"negation"} />}
          />
        )}
        {sAction.operator && (
          <Button
            key="oper"
            tooltip="Logical operator type"
            color="success"
            inverted={true}
            noBorder
            icon={sAction.operator}
          />
        )}
      </ButtonGroup>
    );
  };

  return (
    <React.Fragment key={index}>
      <StyledTr
        ref={dropRef}
        opacity={opacity}
        isOdd={Boolean(index % 2)}
        isSelected={row.values.id === statementId}
        onClick={() => {
          handleClick(row.values.id);
        }}
      >
        {userCanEdit && (
          <td ref={dragRef} style={{ cursor: "move" }}>
            <FaGripVertical />
          </td>
        )}
        <StyledTd>{renderActionCell()}</StyledTd>
        <StyledTd>{renderButtonsCell()}</StyledTd>
      </StyledTr>

      {renderPropGroup(
        row.values.data.sAction.action,
        row.values.data.sAction.props,
        statement
      )}
    </React.Fragment>
  );
};
