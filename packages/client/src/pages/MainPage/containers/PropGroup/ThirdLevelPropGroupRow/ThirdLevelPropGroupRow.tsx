import React, { useRef } from "react";
import { useDrop, DropTargetMonitor, XYCoord, useDrag } from "react-dnd";
import { ItemTypes, DragItem } from "types";

interface ThirdLevelPropGroupRow {
  renderPropRow: React.ReactElement;
  id: string;
  index: number;
  moveProp: (dragIndex: number, hoverIndex: number) => void;
  itemType: ItemTypes;
}
export const ThirdLevelPropGroupRow: React.FC<ThirdLevelPropGroupRow> = ({
  renderPropRow,
  id,
  index,
  moveProp,
  itemType,
}) => {
  // useRef
  const ref = useRef<HTMLDivElement>(null);

  // useDrop
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

  // useDrag
  const [{ isDragging }, drag] = useDrag({
    item: { type: itemType, id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div ref={ref} data-handler-id={handlerId}>
      {renderPropRow}
    </div>
  );
};
