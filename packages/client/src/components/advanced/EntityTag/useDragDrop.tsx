import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import React, { useEffect, useMemo } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { setDraggedEntity } from "redux/features/territoryTree/draggedEntitySlice";
import { useAppDispatch } from "redux/hooks";
import { DraggedEntityReduxItem, EntityDragItem, ItemTypes } from "types";
import { dndHoverFn } from "utils/utils";

const useDragDrop = ({
  entity,
  isTemplate,
  isDiscouraged,
  entityIsReadOnly,
  propId,
  entityClass,
  disableDrag,
  index,
  lvl,
  updateOrderFn,
  draggedEntity,
  dispatch,
  moveFn,
  ref,
}: {
  entity: IEntity | undefined;
  isTemplate: boolean;
  isDiscouraged: boolean;
  entityIsReadOnly?: boolean;
  propId: string;
  entityClass: EntityEnums.ExtendedClass;
  disableDrag: boolean;
  index: number;
  lvl: number | undefined;
  updateOrderFn: (item: EntityDragItem) => void;
  draggedEntity: DraggedEntityReduxItem;
  dispatch: ReturnType<typeof useAppDispatch>;
  moveFn?: (dragIndex: number, hoverIndex: number) => void;
  ref: React.RefObject<HTMLDivElement>;
}) => {
  const canDrag = useMemo(
    () => entityClass !== EntityEnums.Extension.Empty && !disableDrag,
    [entityClass, disableDrag]
  );

  const [, drop] = useDrop<EntityDragItem>({
    accept: ItemTypes.TAG,
    hover(item: EntityDragItem, monitor: DropTargetMonitor) {
      if (moveFn && draggedEntity && draggedEntity.lvl === lvl) {
        dndHoverFn(item, index, monitor, ref, moveFn);
      }
    },
  });

  const [{ isDragging }, drag] = useDrag<
    EntityDragItem,
    unknown,
    { isDragging: boolean }
  >({
    type: ItemTypes.TAG,
    item: {
      id: propId,
      index,
      entityClass: entityClass as EntityEnums.Class,
      isTemplate,
      isDiscouraged,
      entityIsReadOnly,
      entity: entity || false,
    },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag,
    end: (item, monitor) => item && item.index !== index && updateOrderFn(item),
  });

  useEffect(() => {
    if (isDragging) {
      if (canDrag && draggedEntity.id !== propId) {
        dispatch(setDraggedEntity({ id: propId, index, lvl }));
      }
    } else if (draggedEntity.id === propId) {
      dispatch(setDraggedEntity({}));
    }
  }, [isDragging]);

  drag(drop(ref));

  return [isDragging, canDrag, drag, drop];
};

export default useDragDrop;
