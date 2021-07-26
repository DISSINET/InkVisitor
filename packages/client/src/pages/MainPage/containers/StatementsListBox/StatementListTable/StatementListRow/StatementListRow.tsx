import React, { useRef } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
  XYCoord,
} from "react-dnd";
import { FaGripVertical } from "react-icons/fa";
import { Cell } from "react-table";
const queryString = require("query-string");

import { DragItem, ItemTypes } from "types";
import { StatementListRowExpanded } from "./StatementListRowExpanded";
import { StyledTr, StyledTd } from "./StatementListRowStyles";

interface StatementListRow {
  row: any;
  index: number;
  moveRow: any;
  moveEndRow: Function;
  handleClick: Function;
  visibleColumns: any;
}

export const StatementListRow: React.FC<StatementListRow> = ({
  row,
  index,
  moveRow,
  moveEndRow,
  handleClick = () => {},
  visibleColumns,
}) => {
  var hashParams = queryString.parse(location.hash);
  const statementId = hashParams.statement;

  const dropRef = useRef<HTMLTableRowElement>(null);
  const dragRef = useRef<HTMLTableDataCellElement>(null);

  const [, drop] = useDrop({
    accept: ItemTypes.STATEMENT_ROW,
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
    item: { type: ItemTypes.STATEMENT_ROW, index, id: row.values.id },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item: DragItem | undefined, monitor: DragSourceMonitor) => {
      moveEndRow(row.values, index);
    },
  });

  const opacity = isDragging ? 0.2 : 1;

  preview(drop(dropRef));
  drag(dragRef);

  return (
    <React.Fragment key={row.values.data.territory.order}>
      <StyledTr
        ref={dropRef}
        opacity={opacity}
        isOdd={Boolean(index % 2)}
        isSelected={row.values.id === statementId}
        onClick={() => {
          handleClick(row.values.id);
        }}
      >
        <td ref={dragRef} style={{ cursor: "move" }}>
          <FaGripVertical />
        </td>
        {row.cells.map((cell: Cell) => {
          return (
            <StyledTd {...cell.getCellProps()}>{cell.render("Cell")}</StyledTd>
          );
        })}
      </StyledTr>
      {row.isExpanded ? (
        <StatementListRowExpanded row={row} visibleColumns={visibleColumns} />
      ) : null}
    </React.Fragment>
  );
};
