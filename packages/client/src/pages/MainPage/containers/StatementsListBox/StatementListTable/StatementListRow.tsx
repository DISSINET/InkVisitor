import api from "api";
import { useSearchParams } from "hooks";
import React, { useMemo, useRef } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { FaGripVertical } from "react-icons/fa";
import { useQuery } from "react-query";
import { Cell, ColumnInstance } from "react-table";
import { DragItem, ItemTypes } from "types";
import { dndHoverFn } from "utils";
import { StatementListRowExpanded } from "./StatementListRowExpanded";
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
}

export const StatementListRow: React.FC<StatementListRow> = ({
  row,
  index,
  moveRow,
  moveEndRow,
  handleClick = () => {},
  visibleColumns,
}) => {
  const { statementId } = useSearchParams();

  const {
    status: statusAudit,
    data: audit,
    error: auditError,
    isFetching: isFetchingAudit,
  } = useQuery(
    ["audit", row.values.id],
    async () => {
      const res = await api.auditGet(row.values.id);
      return res.data;
    },
    { enabled: row && !!row.values.id, retry: 2 }
  );

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
      {row.isExpanded ? (
        <StatementListRowExpanded row={row} visibleColumns={visibleColumns} />
      ) : null}
    </React.Fragment>
  );
};
