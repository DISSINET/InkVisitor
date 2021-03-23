import React, { useRef } from "react";
import { DropTargetMonitor, useDrag, useDrop, XYCoord } from "react-dnd";
import { FaGripVertical } from "react-icons/fa";
import { Cell } from "react-table";
const queryString = require("query-string");

import { ItemTypes } from "types";
import { StyledTr, StyledTd } from "./StatementListStyles";

type DragItem = {
  index: number;
  id: string;
  type: string;
};
interface StatementListRow {
  row: any;
  index: number;
  moveRow: any;
}

export const StatementListRow: React.FC<StatementListRow> = ({
  row,
  index,
  moveRow,
}) => {
  var hashParams = queryString.parse(location.hash);
  const statementId = hashParams.statement;

  const dropRef = useRef<HTMLTableRowElement>(null);
  const dragRef = useRef<HTMLTableDataCellElement>(null);

  const [, drop] = useDrop({
    accept: ItemTypes.ROW,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!dropRef.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      // Determine rectangle on screen
      const hoverBoundingRect = dropRef.current?.getBoundingClientRect();
      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      // Time to actually perform the action
      moveRow(dragIndex, hoverIndex);
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    item: { type: ItemTypes.ROW, index },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.5 : 1;

  // drop(dropRef);
  // drag(dragRef);
  drag(drop(dragRef));

  return (
    <StyledTr
      ref={dropRef}
      opacity={opacity}
      isOdd={Boolean(index % 2)}
      isSelected={row.values.id === statementId}
    >
      {row.cells.map((cell: Cell) => {
        return (
          <StyledTd {...cell.getCellProps()}>{cell.render("Cell")}</StyledTd>
        );
      })}
      <td ref={dragRef} style={{ cursor: "move" }}>
        <FaGripVertical />
      </td>
    </StyledTr>
  );
};
