import { IEntity } from "@shared/types";
import { useSearchParams } from "hooks";
import React, { useEffect, useMemo, useRef } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { FaGripVertical } from "react-icons/fa";
import { Cell, ColumnInstance } from "react-table";
import { setDraggedRowId } from "redux/features/statementList/draggedRowIdSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { DragItem, ItemTypes } from "types";
import { dndHoverFn } from "utils";
import { StatementListRowExpanded } from "./StatementListRowExpanded/StatementListRowExpanded";
import {
  StyledTd,
  StyledTdLastEdit,
  StyledTr,
} from "./StatementListTableStyles";

interface StatementListRow {
  row: any;
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  moveEndRow: Function;
  handleClick: Function;
  visibleColumns: ColumnInstance<{}>[];
  entities: { [key: string]: IEntity };
}

export const StatementListRow: React.FC<StatementListRow> = ({
  row,
  index,
  moveRow,
  moveEndRow,
  handleClick = () => {},
  visibleColumns,
  entities,
}) => {
  const dispatch = useAppDispatch();

  const rowsExpanded: boolean[] = useAppSelector(
    (state) => state.statementList.rowsExpanded
  );
  const draggedRowId: string = useAppSelector(
    (state) => state.statementList.draggedRowId
  );
  const { statementId } = useSearchParams();
  const audit = row.original.audit;

  const lastEditdateText = useMemo(() => {
    if (audit && audit.last && audit.last[0] && audit.last[0].date) {
      const today = new Date().setHours(0, 0, 0, 0);
      const lastEditDate = audit.last[0].date;
      const lastEditDay = new Date(lastEditDate).setHours(0, 0, 0, 0);

      if (today === lastEditDay) {
        return (
          "today " +
          new Date(lastEditDate).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      } else {
        new Date(lastEditDate).toLocaleDateString("en-GB");
      }
    } else {
      return "";
    }

    return;
  }, [audit]);

  const dropRef = useRef<HTMLTableRowElement>(null);
  const dragRef = useRef<HTMLTableDataCellElement>(null);

  const [, drop] = useDrop({
    accept: ItemTypes.STATEMENT_ROW,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      dndHoverFn(item, index, monitor, dropRef, moveRow);
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    item: { type: ItemTypes.STATEMENT_ROW, index, id: row.original.id },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item: DragItem | undefined, monitor: DragSourceMonitor) => {
      moveEndRow(row.original, index);
    },
  });

  const opacity = isDragging ? 0.2 : 1;

  useEffect(() => {
    isDragging
      ? dispatch(setDraggedRowId(row.values.id))
      : dispatch(setDraggedRowId(""));
  }, [isDragging]);

  preview(drop(dropRef));
  drag(dragRef);

  return (
    <React.Fragment key={row.original.data.territory.order}>
      <StyledTr
        ref={dropRef}
        opacity={opacity}
        isOdd={Boolean(index % 2)}
        isSelected={row.original.id === statementId}
        onClick={(e: any) => {
          handleClick(row.original.id);
          e.stopPropagation();
        }}
        id={`statement${row.original.id}`}
      >
        <td
          ref={dragRef}
          style={{ cursor: "move" }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <FaGripVertical />
        </td>
        {row.cells.map((cell: Cell) => {
          if (cell.column.id === "lastEdit") {
            return (
              <StyledTdLastEdit key="audit">
                {lastEditdateText}
              </StyledTdLastEdit>
            );
          }
          if (
            [
              "Statement",
              "Actions",
              "Objects",
              "data",
              "Text",
              "expander",
            ].includes(cell.column.id)
          ) {
            return (
              <StyledTd {...cell.getCellProps()}>
                {cell.render("Cell")}
              </StyledTd>
            );
          }
        })}
      </StyledTr>
      {rowsExpanded[row.values.id] && !draggedRowId ? (
        <StatementListRowExpanded
          row={row}
          visibleColumns={visibleColumns}
          entities={entities}
        />
      ) : null}
    </React.Fragment>
  );
};
