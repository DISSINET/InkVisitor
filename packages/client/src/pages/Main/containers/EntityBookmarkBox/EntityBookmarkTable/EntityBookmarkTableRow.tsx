import { IEntity, IResponseBookmarkFolder } from "@shared/types";
import React, { useContext, useRef } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { FaGripVertical } from "react-icons/fa";
import { ColumnInstance, Row } from "react-table";
import { DragItem, ItemTypes } from "types";
import { dndHoverFn } from "utils/utils";
import { StyledTd, StyledTr } from "./EntityBookmarkTableStyles";
import { ThemeContext } from "styled-components";

interface EntityBookmarkTableRow {
  row: Row<IEntity>;
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  folder: IResponseBookmarkFolder;
  updateOrderFn: () => void;
  visibleColumns: ColumnInstance<IEntity>[];
  hasOrder: boolean;
}

export const EntityBookmarkTableRow: React.FC<EntityBookmarkTableRow> = ({
  row,
  index,
  moveRow,
  folder,
  updateOrderFn,
  visibleColumns,
  hasOrder,
}) => {
  const dropRef = useRef<HTMLTableRowElement>(null);
  const dragRef = useRef<HTMLTableCellElement>(null);

  const [, drop] = useDrop<DragItem>({
    accept: ItemTypes.ENTITY_ROW,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      dndHoverFn(item, index, monitor, dropRef, moveRow);
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.ENTITY_ROW,
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
      <StyledTr ref={dropRef} opacity={opacity} isOdd={Boolean(index % 2)}>
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
