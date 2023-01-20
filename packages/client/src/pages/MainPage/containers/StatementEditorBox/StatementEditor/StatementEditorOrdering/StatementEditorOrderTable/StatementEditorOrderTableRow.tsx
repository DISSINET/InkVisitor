import { IEntity, OrderType } from "@shared/types";
import React, { useRef } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { Cell, ColumnInstance, Row } from "react-table";
import { DragItem, ItemTypes } from "types";
import { dndHoverFn } from "utils";
import { StyledTd, StyledTr } from "../StatementEditorOrderingStyles";

interface StatementEditorOrderTableRow {
  row: Row<{}>;
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  moveEndRow: (elementIdToMove: string, index: number) => void;
  visibleColumns: ColumnInstance<{}>[];
  entities: { [key: string]: IEntity };
}
export const StatementEditorOrderTableRow: React.FC<
  StatementEditorOrderTableRow
> = ({ row, index, moveRow, moveEndRow, visibleColumns, entities }) => {
  const { elementId } = row.original as OrderType;

  const ref = useRef<HTMLTableRowElement>(null);

  const [, drop] = useDrop({
    accept: ItemTypes.STATEMENT_ORDER_ROW,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      dndHoverFn(item, index, monitor, ref, moveRow);
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    item: {
      type: ItemTypes.STATEMENT_ORDER_ROW,
      index,
      id: elementId,
    },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item: DragItem | undefined, monitor: DragSourceMonitor) => {
      moveEndRow(elementId, index);
    },
  });

  const opacity = isDragging ? 0.2 : 1;

  drag(drop(ref));

  return (
    <React.Fragment>
      <StyledTr
        key={elementId}
        ref={ref}
        opacity={opacity}
        borderColor={(row.original as OrderType).type}
      >
        {row.cells.map((cell: Cell) => {
          return (
            <StyledTd {...cell.getCellProps()}>{cell.render("Cell")}</StyledTd>
          );
        })}
      </StyledTr>
    </React.Fragment>
  );
};
