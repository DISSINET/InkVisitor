import { IEntity, OrderType } from "@shared/types";
import { Table } from "components";
import React, { useMemo } from "react";
import { CgPlayListAdd } from "react-icons/cg";
import { Cell, Column } from "react-table";
import theme from "Theme/theme";
import {
  renderOrderingInfoColumn,
  renderOrderingMainColumn,
} from "../StatementEditorOrderingColumnHelper/StatementEditorOrderingColumnHelper";

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
        id: "button",
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
    ],
    [elements, entities]
  );

  return (
    <Table
      data={data}
      columns={columns}
      perPage={1000}
      disableHeading
      disableHeader
      firstColumnMinWidth
    />
  );
};
