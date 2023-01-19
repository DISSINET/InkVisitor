import { IEntity, OrderType } from "@shared/types";
import update from "immutability-helper";
import React, { useCallback, useMemo } from "react";
import { Cell, Column, Row, useTable } from "react-table";
import {
  StyledButtonsWrap,
  StyledTable,
} from "../StatementEditorOrderingTableUtils/StatementEditorOrderingTableStyles";
import {
  renderOrderingInfoColumn,
  renderOrderingMainColumn,
} from "../StatementEditorOrderingTableUtils/StatementEditorOrderingTableUtils";
import { StatementEditorOrderTableRow } from "./StatementEditorOrderTableRow";
import {
  StyledCgPlayListRemove,
  StyledRiArrowDownCircleLine,
  StyledRiArrowUpCircleLine,
} from "./StatementEditorOrderTableStyles";

interface StatementEditorOrderTable {
  elements: OrderType[];
  setElements: React.Dispatch<React.SetStateAction<OrderType[]>>;
  entities: { [key: string]: IEntity };
  removeFromOrdering: (elementId: string) => void;
  changeOrder: (elementIdToMove: string, newOrder: number) => void;
}
export const StatementEditorOrderTable: React.FC<StatementEditorOrderTable> = ({
  elements,
  setElements,
  entities,
  removeFromOrdering,
  changeOrder,
}) => {
  const data = useMemo(() => elements, [elements]);

  const columns: Column<{}>[] = React.useMemo(
    () => [
      {
        id: "buttons",
        accesor: "data",
        Cell: ({ row }: Cell) => {
          const orderObject = row.original as OrderType;
          const isFirst = row.index === 0;
          const isLast = row.index === elements.length - 1;

          return (
            <StyledButtonsWrap>
              <StyledRiArrowUpCircleLine
                size={18}
                $isFirst={isFirst}
                onClick={() =>
                  !isFirst
                    ? changeOrder(orderObject.elementId, row.index - 1)
                    : {}
                }
              />
              <StyledRiArrowDownCircleLine
                size={18}
                $isLast={isLast}
                onClick={() =>
                  !isLast
                    ? changeOrder(orderObject.elementId, row.index + 1)
                    : {}
                }
              />
              <StyledCgPlayListRemove
                size={20}
                onClick={() => removeFromOrdering(orderObject.elementId)}
              />
            </StyledButtonsWrap>
          );
        },
      },
      {
        id: "main",
        accessor: "data",
        Cell: ({ row }: Cell) => {
          const orderObject = row.original as OrderType;

          return renderOrderingMainColumn(orderObject, entities);
        },
      },
      {
        id: "info",
        Cell: ({ row }: Cell) => {
          const orderObject = row.original as OrderType;

          return renderOrderingInfoColumn(orderObject, entities);
        },
      },
    ],
    [elements, entities]
  );

  const { getTableProps, getTableBodyProps, rows, prepareRow, visibleColumns } =
    useTable({
      columns,
      data: data,
      initialState: {
        hiddenColumns: ["id"],
      },
    });

  const moveRow = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragRecord = elements[dragIndex];
      setElements(
        update(elements, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragRecord],
          ],
        })
      );
    },
    [elements]
  );

  return (
    <StyledTable {...getTableProps()}>
      <tbody {...getTableBodyProps()}>
        {rows.map((row: Row, i: number) => {
          prepareRow(row);
          return (
            <StatementEditorOrderTableRow
              index={i}
              row={row}
              moveRow={moveRow}
              moveEndRow={changeOrder}
              visibleColumns={visibleColumns}
              entities={entities}
              {...row.getRowProps()}
            />
          );
        })}
      </tbody>
    </StyledTable>
  );
};
