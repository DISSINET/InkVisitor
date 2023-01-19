import { IEntity, OrderType } from "@shared/types";
import { Table } from "components";
import React, { useMemo } from "react";
import { CgPlayListAdd } from "react-icons/cg";
import { Cell, Column, Row, useTable } from "react-table";
import theme, { ThemeColor } from "Theme/theme";
import {
  StyledTable,
  StyledTd,
  StyledTdLastEdit,
  StyledTr,
} from "../StatementEditorOrderingTableUtils/StatementEditorOrderingTableStyles";
import {
  renderOrderingInfoColumn,
  renderOrderingMainColumn,
} from "../StatementEditorOrderingTableUtils/StatementEditorOrderingTableUtils";

interface StatementEditorNoOrderTable {
  elements: OrderType[];
  entities: { [key: string]: IEntity };
  addToOrdering: (elementId: string) => void;
}
export const StatementEditorNoOrderTable: React.FC<
  StatementEditorNoOrderTable
> = ({ elements, entities, addToOrdering }) => {
  const data = useMemo(() => elements, [elements]);

  const columns: Column<{}>[] = React.useMemo(
    () => [
      {
        id: "buttons",
        accesor: "data",
        Cell: ({ row }: Cell) => {
          const orderObject = row.original as OrderType;

          return (
            <CgPlayListAdd
              size={20}
              style={{ cursor: "pointer", color: theme.color.gray[700] }}
              onClick={() => addToOrdering(orderObject.elementId)}
            />
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
      {
        id: "lastEdit",
        Header: "Edited",
        Cell: ({ row }: Cell) => {
          return false;
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

  return (
    <StyledTable {...getTableProps()}>
      <tbody {...getTableBodyProps()}>
        {rows.map((row: Row, i: number) => {
          prepareRow(row);
          return (
            <StyledTr
              id={(row.original as OrderType).elementId}
              noOrder
              borderColor={(row.original as OrderType).type}
            >
              {row.cells.map((cell: Cell) => {
                if (cell.column.id === "lastEdit") {
                  return (
                    <StyledTdLastEdit key="audit">
                      {/* {lastEditdateText} */}
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
          );
        })}
      </tbody>
    </StyledTable>
  );
};
