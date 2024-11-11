import { IEntity, IResponseStatement, IStatement } from "@shared/types";
import { useSearchParams } from "hooks";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import {
  FaChevronCircleDown,
  FaChevronCircleUp,
  FaGripVertical,
} from "react-icons/fa";
import { BeatLoader } from "react-spinners";
import { Cell, ColumnInstance, Row } from "react-table";
import { setDraggedRowId } from "redux/features/statementList/draggedRowIdSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { ThemeContext } from "styled-components";
import { DragItem, ItemTypes, StatementListDisplayMode } from "types";
import { dndHoverFn } from "utils/utils";
import { StatementListRowExpanded } from "./StatementListRowExpanded/StatementListRowExpanded";
import { StyledTd, StyledTdMove, StyledTr } from "./StatementListTableStyles";
import useIsRowVisible from "./useRowIsVisible";
import { setRowsExpanded } from "redux/features/statementList/rowsExpandedSlice";

interface StatementListRow {
  row: Row<IResponseStatement>;
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  moveEndRow: (statementToMove: IStatement, index: number) => Promise<void>;
  handleClick: (rowId: string) => void;
  visibleColumns: ColumnInstance<IResponseStatement>[];
  entities: { [key: string]: IEntity };
  isSelected: boolean;
  displayMode: StatementListDisplayMode;
}

export const StatementListRow: React.FC<StatementListRow> = ({
  row,
  index,
  moveRow,
  moveEndRow,
  handleClick = () => {},
  visibleColumns,
  entities,
  isSelected,
  displayMode,
}) => {
  const dispatch = useAppDispatch();

  const rowsExpanded: string[] = useAppSelector(
    (state) => state.statementList.rowsExpanded
  );
  const draggedRowId: string = useAppSelector(
    (state) => state.statementList.draggedRowId
  );
  const { statementId } = useSearchParams();

  const dropRef = useRef<HTMLTableRowElement>(null);
  const dragRef = useRef<HTMLTableCellElement>(null);

  const isVisible = useIsRowVisible(dropRef);

  const [, drop] = useDrop<DragItem>({
    accept: ItemTypes.STATEMENT_ROW,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      dndHoverFn(item, index, monitor, dropRef, moveRow);
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.STATEMENT_ROW,
    item: { index, id: row.original.id },
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
      ? dispatch(setDraggedRowId(row.original.id))
      : dispatch(setDraggedRowId(""));
  }, [isDragging]);

  preview(drop(dropRef));
  drag(dragRef);

  const themeContext = useContext(ThemeContext);

  return (
    <React.Fragment key={row.original.data.territory?.order}>
      <StyledTr
        ref={dropRef}
        opacity={opacity}
        $isOpened={row.original.id === statementId}
        $isSelected={isSelected}
        onClick={(e) => {
          handleClick(row.original.id);
          e.stopPropagation();
        }}
        // for scrollTo fn
        id={`statement${row.original.id}`}
      >
        {isVisible ? (
          <React.Fragment>
            {row.cells.map((cell: Cell<IResponseStatement>) => {
              if (cell.column.id === "move") {
                return (
                  <StyledTdMove
                    key="move"
                    ref={dragRef}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    <FaGripVertical color={themeContext?.color.black} />
                  </StyledTdMove>
                );
              } else {
                return (
                  <StyledTd {...cell.getCellProps()}>
                    {cell.render("Cell")}
                  </StyledTd>
                );
              }
            })}
            {displayMode !== StatementListDisplayMode.TEXT && (
              <StyledTd
                style={{
                  justifyContent: "center",
                }}
              >
                <span
                  {...row.getToggleRowExpandedProps()}
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    const rowId = row.original.id;
                    if (!rowsExpanded.includes(rowId)) {
                      dispatch(setRowsExpanded(rowsExpanded.concat(rowId)));
                    } else {
                      dispatch(
                        setRowsExpanded(rowsExpanded.filter((r) => r !== rowId))
                      );
                    }
                  }}
                >
                  {rowsExpanded.includes(row.original.id) ? (
                    <FaChevronCircleUp size={18} />
                  ) : (
                    <FaChevronCircleDown size={18} />
                  )}
                </span>
              </StyledTd>
            )}
          </React.Fragment>
        ) : (
          <StyledTd colSpan={visibleColumns.length + 1}>
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <BeatLoader
                size={7}
                margin={4}
                style={{ marginLeft: "0.3rem", marginTop: "0.1rem" }}
                color="black"
              />
            </div>
          </StyledTd>
        )}
      </StyledTr>
      {rowsExpanded.includes(row.original.id) &&
      !draggedRowId &&
      displayMode === StatementListDisplayMode.LIST ? (
        <StatementListRowExpanded
          row={row}
          visibleColumns={visibleColumns}
          entities={entities}
        />
      ) : null}
    </React.Fragment>
  );
};
