import { EntityEnums } from "@shared/enums";
import { IProp, IResponseStatement } from "@shared/types";
import { AttributeIcon, Button, ButtonGroup } from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import { useSearchParams } from "hooks";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { FaGripVertical, FaPlus, FaTrashAlt, FaUnlink } from "react-icons/fa";
import { UseMutationResult } from "react-query";
import { setDraggedActantRow } from "redux/features/rowDnd/draggedActantRowSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { excludedSuggesterEntities } from "Theme/constants";
import {
  DraggedActantRowItem,
  DraggedPropRowCategory,
  DragItem,
  FilteredActionObject,
  ItemTypes,
} from "types";
import { dndHoverFn } from "utils";
import AttributesEditor from "../../AttributesEditor/AttributesEditor";
import { PropGroup } from "../../PropGroup/PropGroup";
import {
  StyledGrid,
  StyledGridColumn,
} from "./StatementEditorActionTableStyles";

interface StatementEditorActionTableRow {
  filteredAction: FilteredActionObject;
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  statement: IResponseStatement;
  userCanEdit?: boolean;
  updateOrderFn: () => void;
  addProp: (originId: string) => void;
  updateProp: (propId: string, changes: any) => void;
  removeProp: (propId: string) => void;
  movePropToIndex: (propId: string, oldIndex: number, newIndex: number) => void;
  updateActionsMutation: UseMutationResult<any, unknown, object, unknown>;
  territoryParentId?: string;
  territoryActants?: string[];
  hasOrder?: boolean;
}

export const StatementEditorActionTableRow: React.FC<
  StatementEditorActionTableRow
> = ({
  filteredAction,
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
  territoryParentId,
  territoryActants,
  hasOrder,
}) => {
  const isInsideTemplate = statement.isTemplate || false;
  const { statementId, territoryId } = useSearchParams();

  const dropRef = useRef<HTMLTableRowElement>(null);
  const dragRef = useRef<HTMLTableCellElement>(null);

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
    item: {
      type: ItemTypes.ACTION_ROW,
      index,
      id: filteredAction.id.toString(),
    },
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
    const { action, sAction } = filteredAction.data;
    return action ? (
      <EntityTag
        fullWidth
        entity={action}
        button={
          userCanEdit && (
            <Button
              key="d"
              tooltipLabel="unlink action"
              icon={<FaUnlink />}
              inverted
              color="plain"
              onClick={() => {
                updateAction(sAction.id, {
                  actionId: "",
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
              actionId: newSelectedId,
            });
          }}
          openDetailOnCreate
          categoryTypes={[EntityEnums.Class.Action]}
          excludedEntities={excludedSuggesterEntities}
          placeholder={"add new action"}
          isInsideTemplate={isInsideTemplate}
          territoryParentId={territoryParentId}
          territoryActants={territoryActants}
        />
      )
    );
  };

  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const renderButtonsCell = () => {
    const { action, sAction } = filteredAction.data;
    const { actionId: propOriginId, id: rowId } = sAction;

    return (
      <ButtonGroup noMarginRight>
        {sAction && (
          <AttributesEditor
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
            modalTitle={`Action attribute`}
            entity={action}
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
              updateAction(sAction.id, { actionId: newId });
            }}
            userCanEdit={userCanEdit}
            classEntitiesActant={[EntityEnums.Class.Action]}
            loading={updateActionsMutation.isLoading}
            isInsideTemplate={isInsideTemplate}
            territoryParentId={territoryParentId}
          />
        )}
        {userCanEdit && (
          <Button
            key="d"
            icon={<FaTrashAlt />}
            color="plain"
            inverted
            tooltipLabel="remove action row"
            onClick={() => {
              removeAction(filteredAction.data.sAction.id);
            }}
          />
        )}
        {userCanEdit && (
          <Button
            key="a"
            icon={<FaPlus />}
            color="plain"
            inverted
            tooltipLabel="add new prop"
            onClick={() => {
              addProp(rowId);
            }}
          />
        )}
        {sAction.logic == "2" && (
          <Button
            key="neg"
            tooltipLabel="Negative logic"
            color="success"
            inverted
            noBorder
            icon={<AttributeIcon attributeName={"negation"} />}
            onClick={() => setModalOpen(true)}
          />
        )}
        {sAction.bundleOperator && (
          <Button
            key="oper"
            tooltipLabel="Logical operator type"
            color="success"
            inverted
            noBorder
            icon={sAction.bundleOperator}
            onClick={() => setModalOpen(true)}
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
            isInsideTemplate={isInsideTemplate}
            territoryParentId={territoryParentId}
          />
        );
      }
    },
    [statement]
  );

  return (
    <React.Fragment key={index}>
      <StyledGrid ref={dropRef} style={{ opacity }} hasOrder={hasOrder}>
        {userCanEdit && hasOrder ? (
          <StyledGridColumn ref={dragRef} style={{ cursor: "move" }}>
            <FaGripVertical />
          </StyledGridColumn>
        ) : (
          <StyledGridColumn />
        )}
        <StyledGridColumn>{renderActionCell()}</StyledGridColumn>
        <StyledGridColumn>{renderButtonsCell()}</StyledGridColumn>
      </StyledGrid>

      {!(
        draggedActantRow.category &&
        draggedActantRow.category === DraggedPropRowCategory.ACTION
      ) &&
        renderPropGroup(
          filteredAction.data.sAction.actionId,
          filteredAction.data.sAction.props,
          DraggedPropRowCategory.ACTION
        )}
    </React.Fragment>
  );
};
