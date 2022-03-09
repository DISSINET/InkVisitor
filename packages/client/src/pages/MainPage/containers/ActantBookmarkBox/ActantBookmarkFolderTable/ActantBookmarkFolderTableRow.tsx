import { IResponseBookmarkFolder } from "@shared/types";
import React, { useRef } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
  XYCoord,
} from "react-dnd";
import { FaGripVertical } from "react-icons/fa";
import { Cell, ColumnInstance } from "react-table";
import { DragItem, ItemTypes } from "types";
import { dndHoverFn } from "utils";
import { StyledTd, StyledTr } from "./ActantBookmarkFolderTableStyles";

interface ActantBookmarkFolderTableRow {
  row: any;
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  folder: IResponseBookmarkFolder;
  updateOrderFn: () => void;
  visibleColumns: ColumnInstance<{}>[];
}

export const ActantBookmarkFolderTableRow: React.FC<
  ActantBookmarkFolderTableRow
> = ({ row, index, moveRow, folder, updateOrderFn, visibleColumns }) => {
  const dropRef = useRef<HTMLTableRowElement>(null);
  const dragRef = useRef<HTMLTableDataCellElement>(null);

  const [, drop] = useDrop({
    accept: ItemTypes.ACTANT_ROW,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      dndHoverFn(item, index, monitor, dropRef, moveRow);
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

  return (
    <React.Fragment key={index}>
      <StyledTr ref={dropRef} opacity={opacity} isOdd={Boolean(index % 2)}>
        <td ref={dragRef} style={{ cursor: "move" }}>
          <FaGripVertical />
        </td>
        {row.cells.map((cell: Cell) => {
          return (
            <StyledTd {...cell.getCellProps()}>{cell.render("Cell")}</StyledTd>
          );
        })}
      </StyledTr>
    </React.Fragment>
  );
};
