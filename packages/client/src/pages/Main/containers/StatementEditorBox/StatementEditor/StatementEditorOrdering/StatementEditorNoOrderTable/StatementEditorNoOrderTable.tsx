import { IEntity, OrderType } from "@shared/types";
import { Tooltip } from "components";
import React, { useMemo, useState } from "react";
import { CgPlayListAdd } from "react-icons/cg";
import { Cell, CellProps, Column, Row, useTable } from "react-table";
import theme from "Theme/theme";
import {
  StyledTable,
  StyledTd,
  StyledTr,
} from "../StatementEditorOrderingStyles";
import {
  renderOrderingInfoColumn,
  renderOrderingMainColumn,
} from "../StatementEditorOrderingUtils";

type CellType = CellProps<OrderType>;

interface StatementEditorNoOrderTable {
  elements: OrderType[];
  entities: { [key: string]: IEntity };
  addToOrdering: (elementId: string) => void;
}
export const StatementEditorNoOrderTable: React.FC<
  StatementEditorNoOrderTable
> = ({ elements, entities, addToOrdering }) => {
  const data = useMemo(() => elements, [elements]);

  const columns = useMemo<Column<OrderType>[]>(
    () => [
      {
        id: "buttons",
        Cell: ({ row }: CellType) => {
          const orderObject = row.original as OrderType;

          const [referenceElement, setReferenceElement] =
            useState<HTMLDivElement | null>(null);
          const [showTooltip, setShowTooltip] = useState(false);

          return (
            <>
              <Tooltip
                visible={showTooltip}
                referenceElement={referenceElement}
                label="add order"
                position="left"
              />

              <div
                ref={setReferenceElement}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <CgPlayListAdd
                  size={20}
                  style={{ cursor: "pointer", color: theme.color.gray[700] }}
                  onClick={() => addToOrdering(orderObject.elementId)}
                />
              </div>
            </>
          );
        },
      },
      {
        id: "main",
        Cell: ({ row }: CellType) => {
          const orderObject = row.original;

          return renderOrderingMainColumn(orderObject, entities);
        },
      },
      {
        id: "info",
        Cell: ({ row }: CellType) => {
          const orderObject = row.original;

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
    });

  return (
    <StyledTable {...getTableProps()}>
      <tbody {...getTableBodyProps()}>
        {rows.map((row: Row<OrderType>, i: number) => {
          prepareRow(row);
          return (
            <StyledTr
              key={row.original.elementId}
              noOrder
              borderColor={row.original.type}
            >
              {row.cells.map((cell: Cell<OrderType>) => {
                return (
                  <StyledTd {...cell.getCellProps()}>
                    {cell.render("Cell")}
                  </StyledTd>
                );
              })}
            </StyledTr>
          );
        })}
      </tbody>
    </StyledTable>
  );
};
