import React, { useEffect, useRef, useState } from "react";
import { useDrop, DropTargetMonitor, XYCoord, useDrag } from "react-dnd";
import { setDraggedPropRow } from "redux/features/propGroup/draggedPropRowSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { ItemTypes, DragItem, DraggedPropRowItem } from "types";
import { StyledDndWrapper } from "./PropGroupRowDndWrapperStyles";

interface PropGroupRowDndWrapper {
  renderPropRow: React.ReactElement;
  id: string;
  index: number;
  moveProp: (dragIndex: number, hoverIndex: number) => void;
  itemType: ItemTypes;
  lvl: 1 | 2 | 3;
  parentId: string;
}
export const PropGroupRowDndWrapper: React.FC<PropGroupRowDndWrapper> = ({
  renderPropRow,
  id,
  index,
  moveProp,
  itemType,
  lvl,
  parentId,
}) => {
  const dispatch = useAppDispatch();
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: itemType,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex: number = item.index;
      const hoverIndex: number | undefined = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
      if (hoverIndex === undefined) {
        return;
      }
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveProp(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    item: { type: itemType, id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  useEffect(() => {
    if (isDragging) {
      dispatch(setDraggedPropRow({ id, parentId, index, lvl }));
    } else {
      dispatch(setDraggedPropRow({}));
    }
  }, [isDragging]);

  const tempDisabled = false;

  return (
    <>
      {!tempDisabled ? (
        <StyledDndWrapper ref={ref} data-handler-id={handlerId}>
          {renderPropRow}
        </StyledDndWrapper>
      ) : (
        <StyledDndWrapper>{renderPropRow}</StyledDndWrapper>
      )}
    </>
  );
};
