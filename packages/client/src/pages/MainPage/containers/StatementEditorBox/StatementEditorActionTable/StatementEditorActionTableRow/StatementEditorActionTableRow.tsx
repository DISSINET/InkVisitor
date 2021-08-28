import { IResponseStatement } from "@shared/types";
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
const queryString = require("query-string");

import { DragItem, ItemTypes } from "types";
import {
  StyledTr,
  StyledTd,
  StyledSubRow,
} from "./StatementEditorActionTableRowStyles";

interface StatementEditorActionTableRow {
  row: any;
  index: number;
  moveRow: any;
  statement: IResponseStatement;
  updateOrderFn: () => void;
  handleClick: Function;
  renderPropGroup: Function;
  visibleColumns: ColumnInstance<{}>[];
}

export const StatementEditorActionTableRow: React.FC<StatementEditorActionTableRow> =
  ({
    row,
    index,
    moveRow,
    statement,
    updateOrderFn,
    handleClick = () => {},
    renderPropGroup,
    visibleColumns,
  }) => {
    var hashParams = queryString.parse(location.hash);
    const statementId = hashParams.statement;

    const dropRef = useRef<HTMLTableRowElement>(null);
    const dragRef = useRef<HTMLTableDataCellElement>(null);

    const [, drop] = useDrop({
      accept: ItemTypes.ACTANT_ROW,
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
        const hoverClientY =
          (clientOffset as XYCoord).y - hoverBoundingRect.top;
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
      item: { type: ItemTypes.ACTANT_ROW, index, id: row.values.id },
      collect: (monitor: DragSourceMonitor) => ({
        isDragging: monitor.isDragging(),
      }),
      end: updateOrderFn,
    });

    const opacity = isDragging ? 0.2 : 1;

    preview(drop(dropRef));
    drag(dragRef);

    return (
      <React.Fragment key={index}>
        <StyledTr
          ref={dropRef}
          opacity={opacity}
          isOdd={Boolean(index % 2)}
          isSelected={row.values.id === statementId}
          onClick={() => {
            handleClick(row.values.id);
          }}
        >
          <td ref={dragRef} style={{ cursor: "move", width: "1%" }}>
            <FaGripVertical />
          </td>
          {row.cells.map((cell: Cell) => {
            return (
              <StyledTd {...cell.getCellProps()}>
                {cell.render("Cell")}
              </StyledTd>
            );
          })}
        </StyledTr>

        <tr>
          <td colSpan={visibleColumns.length + 1}>
            <StyledSubRow>
              {renderPropGroup(row.values.data.action.id, statement)}
            </StyledSubRow>
          </td>
        </tr>
      </React.Fragment>
    );
  };
