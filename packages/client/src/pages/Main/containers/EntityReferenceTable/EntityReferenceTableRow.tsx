import { IReference } from "@shared/types";
import React, { useContext, useRef } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { FaGripVertical } from "react-icons/fa";
import { ColumnInstance, Row } from "react-table";
import { ThemeContext } from "styled-components";
import { DragItem, ItemTypes } from "types";
import { dndHoverFn } from "utils";
import { StyledTd, StyledTr } from "./EntityReferenceTableStyles";

interface EntityReferenceTableRow {
  row: Row<IReference>;
  visibleColumns: ColumnInstance<IReference>[];
  hasOrder: boolean;
  index: number;
  updateOrderFn: () => void;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
}

export const EntityReferenceTableRow: React.FC<EntityReferenceTableRow> = ({
  row,
  visibleColumns,
  hasOrder,
  index,
  updateOrderFn,
  moveRow,
}) => {
  const dropRef = useRef<HTMLTableRowElement>(null);
  const dragRef = useRef<HTMLTableCellElement>(null);

  const [, drop] = useDrop<DragItem>({
    accept: ItemTypes.REFERENCE_ROW,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      dndHoverFn(item, index, monitor, dropRef, moveRow);
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.REFERENCE_ROW,
    item: { index, id: row.values.id },
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

  const themeContext = useContext(ThemeContext);

  return (
    <React.Fragment key={index}>
      <StyledTr ref={dropRef} opacity={opacity}>
        {hasOrder ? (
          <td ref={dragRef} style={{ cursor: "move" }}>
            <FaGripVertical color={themeContext.color.black} />
          </td>
        ) : (
          <td style={{ width: "2rem" }} />
        )}
        {row.cells.map((cell) => {
          return (
            <StyledTd {...cell.getCellProps()}>{cell.render("Cell")}</StyledTd>
          );
        })}
      </StyledTr>
    </React.Fragment>
  );
};
