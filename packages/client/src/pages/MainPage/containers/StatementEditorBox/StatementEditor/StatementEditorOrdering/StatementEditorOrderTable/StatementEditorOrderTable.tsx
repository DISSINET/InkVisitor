import { IEntity, OrderType } from "@shared/types";
import { Tooltip } from "components";
import update from "immutability-helper";
import React, { useCallback, useMemo, useState } from "react";
import { Cell, Column, Row, useTable } from "react-table";
import {
  StyledButtonsWrap,
  StyledCgPlayListRemove,
  StyledRiArrowDownCircleLine,
  StyledRiArrowUpCircleLine,
  StyledTable,
} from "../StatementEditorOrderingStyles";
import {
  renderOrderingInfoColumn,
  renderOrderingMainColumn,
} from "../StatementEditorOrderingUtils";
import { StatementEditorOrderTableRow } from "./StatementEditorOrderTableRow";

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

          const [referenceElement, setReferenceElement] =
            useState<HTMLDivElement | null>(null);
          const [showTooltip, setShowTooltip] = useState(false);

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

              <Tooltip
                visible={showTooltip}
                referenceElement={referenceElement}
                label="remove order"
              />
              <div
                ref={setReferenceElement}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <StyledCgPlayListRemove
                  size={20}
                  onClick={() => removeFromOrdering(orderObject.elementId)}
                />
              </div>
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
