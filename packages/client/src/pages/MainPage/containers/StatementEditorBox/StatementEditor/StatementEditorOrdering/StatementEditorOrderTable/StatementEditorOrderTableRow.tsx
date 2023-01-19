import { IEntity, OrderType } from "@shared/types";
import React, { useRef } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { Cell, ColumnInstance } from "react-table";
import { DragItem, ItemTypes } from "types";
import { dndHoverFn } from "utils";
import {
  StyledTd,
  StyledTdLastEdit,
  StyledTr,
} from "../StatementEditorOrderingStyles";

interface StatementEditorOrderTableRow {
  row: any;
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  moveEndRow: (elementIdToMove: string, index: number) => void;
  visibleColumns: ColumnInstance<{}>[];
  entities: { [key: string]: IEntity };
}
export const StatementEditorOrderTableRow: React.FC<
  StatementEditorOrderTableRow
> = ({ row, index, moveRow, moveEndRow, visibleColumns, entities }) => {
  const ref = useRef<HTMLTableRowElement>(null);

  const [, drop] = useDrop({
    accept: ItemTypes.STATEMENT_ORDER_ROW,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      dndHoverFn(item, index, monitor, ref, moveRow);
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    item: { type: ItemTypes.STATEMENT_ORDER_ROW, index, id: row.original.id },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item: DragItem | undefined, monitor: DragSourceMonitor) => {
      moveEndRow(row.original, index);
    },
  });

  const opacity = isDragging ? 0.2 : 1;

  drag(drop(ref));

  // const audit = row.original.audit;

  // const lastEditDateText = () => {
  //   if (audit && audit.last && audit.last[0] && audit.last[0].date) {
  //     const today = new Date().setHours(0, 0, 0, 0);
  //     const lastEditDate = audit.last[0].date;
  //     const lastEditDay = new Date(lastEditDate).setHours(0, 0, 0, 0);

  //     if (today === lastEditDay) {
  //       return (
  //         "today " +
  //         new Date(lastEditDate).toLocaleTimeString("en-GB", {
  //           hour: "2-digit",
  //           minute: "2-digit",
  //         })
  //       );
  //     } else {
  //       new Date(lastEditDate).toLocaleDateString("en-GB");
  //     }
  //   } else {
  //     return "";
  //   }

  //   return;
  // };

  return (
    <React.Fragment>
      <StyledTr
        ref={ref}
        opacity={opacity}
        id={row.original.elementId}
        borderColor={(row.original as OrderType).type}
      >
        {row.cells.map((cell: Cell) => {
          if (cell.column.id === "lastEdit") {
            return (
              <StyledTdLastEdit key="audit">
                {/* {lastEditDateText()} */}
              </StyledTdLastEdit>
            );
          }
          if (["buttons", "main", "info"].includes(cell.column.id)) {
            return (
              <StyledTd {...cell.getCellProps()}>
                {cell.render("Cell")}
              </StyledTd>
            );
          }
        })}
      </StyledTr>
    </React.Fragment>
  );
};
