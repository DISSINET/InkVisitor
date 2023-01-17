import { IEntity, OrderType } from "@shared/types";
import { Table } from "components";
import React, { useMemo } from "react";
import { CgPlayListRemove } from "react-icons/cg";
import { RiArrowDownCircleLine, RiArrowUpCircleLine } from "react-icons/ri";
import { Cell, Column } from "react-table";
import theme from "Theme/theme";
import {
  renderOrderingInfoColumn,
  renderOrderingMainColumn,
} from "../StatementEditorOrderingColumnHelper/StatementEditorOrderingColumnHelper";
import {
  StyledButtonsWrap,
  StyledCgPlayListRemove,
  StyledRiArrowDownCircleLine,
  StyledRiArrowUpCircleLine,
} from "./StatementEditorOrderTableStyles";

interface StatementEditorOrderTable {
  elements: OrderType[];
  entities: { [key: string]: IEntity };
  removeFromOrdering: (elementId: string) => void;
  changeOrder: (elementIdToMove: string, newOrder: number) => void;
}
export const StatementEditorOrderTable: React.FC<StatementEditorOrderTable> = ({
  elements,
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
