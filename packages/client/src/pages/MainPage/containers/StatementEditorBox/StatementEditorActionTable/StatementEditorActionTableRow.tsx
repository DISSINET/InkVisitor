import { EntityClass } from "@shared/enums";
import { IProp, IResponseStatement } from "@shared/types";
import { AttributeIcon, Button, ButtonGroup } from "components";
import { useSearchParams } from "hooks";
import React, { useCallback, useEffect, useRef } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { FaGripVertical, FaPlus, FaTrashAlt, FaUnlink } from "react-icons/fa";
import { UseMutationResult } from "react-query";
import { ColumnInstance } from "react-table";
import { setDraggedActantRow } from "redux/features/rowDnd/draggedActantRowSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { excludedSuggesterEntities } from "Theme/constants";
import {
  DraggedActantRowItem,
  DraggedPropRowCategory,
  DragItem,
  ItemTypes,
} from "types";
import { dndHoverFn } from "utils";
import { EntitySuggester, EntityTag } from "../..";
import AttributesEditor from "../../AttributesEditor/AttributesEditor";
import { PropGroup } from "../../PropGroup/PropGroup";
import { StyledTd, StyledTr } from "./StatementEditorActionTableStyles";

interface StatementEditorActionTableRow {
  row: any;
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  statement: IResponseStatement;
  userCanEdit?: boolean;
  updateOrderFn: () => void;
  addProp: (originId: string) => void;
  updateProp: (propId: string, changes: any) => void;
  removeProp: (propId: string) => void;
  movePropToIndex: (propId: string, oldIndex: number, newIndex: number) => void;
  handleClick: Function;
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
  updateProp,
  removeProp,
  movePropToIndex,
  updateActionsMutation,
  handleClick = () => {},
  visibleColumns,
}) => {
  const { statementId, territoryId } = useSearchParams();

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
    accept: ItemTypes.ACTION_ROW,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      dndHoverFn(item, index, monitor, dropRef, moveRow);
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    item: { type: ItemTypes.ACTION_ROW, index, id: row.values.id },
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
        // fullWidth
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
          openDetailOnCreate
          categoryTypes={[EntityClass.Action]}
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
      <ButtonGroup noMarginRight>
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
              bundleOperator: sAction.bundleOperator,
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
            classEntitiesActant={[EntityClass.Action]}
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
        {sAction.bundleOperator && (
          <Button
            key="oper"
            tooltip="Logical operator type"
            color="success"
            inverted={true}
            noBorder
            icon={sAction.bundleOperator}
          />
        )}
      </ButtonGroup>
    );
  };

  const dispatch = useAppDispatch();
  const draggedActantRow: DraggedActantRowItem = useAppSelector(
    (state) => state.rowDnd.draggedActantRow
  );

  useEffect(() => {
    if (isDragging) {
      dispatch(
        setDraggedActantRow({ category: DraggedPropRowCategory.ACTION })
      );
    } else {
      dispatch(setDraggedActantRow({}));
    }
  }, [isDragging]);

  const renderPropGroup = useCallback(
    (originId: string, props: IProp[], category: DraggedPropRowCategory) => {
      const originActant = statement.entities[originId];

      if (props.length > 0) {
        return (
          <PropGroup
            boxEntity={statement}
            originId={originActant ? originActant.id : ""}
            entities={statement.entities}
            props={props}
            territoryId={territoryId}
            updateProp={updateProp}
            removeProp={removeProp}
            addProp={addProp}
            movePropToIndex={movePropToIndex}
            userCanEdit={userCanEdit}
            openDetailOnCreate={false}
            category={category}
          />
        );
      }
    },
    [statement]
  );

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

      {!(
        draggedActantRow.category &&
        draggedActantRow.category === DraggedPropRowCategory.ACTION
      ) &&
        renderPropGroup(
          row.values.data.sAction.action,
          row.values.data.sAction.props,
          DraggedPropRowCategory.ACTION
        )}
    </React.Fragment>
  );
};
