import {
  IEntity,
  IResponseAudit,
  IResponseGeneric,
  IResponseStatement,
  IStatement,
} from "@shared/types";
import { AxiosResponse } from "axios";
import update from "immutability-helper";
import React, { useCallback, useEffect, useState } from "react";
import { UseMutationResult } from "react-query";
import { Column, Row, useExpanded, useTable } from "react-table";
import { StatementListRow } from "./StatementListRow";
import { StyledTable, StyledTh, StyledTHead } from "./StatementListTableStyles";

type StatementWithAudit = IResponseStatement & {
  audit: IResponseAudit | undefined;
};
interface StatementListTable {
  statements: IResponseStatement[];
  audits: IResponseAudit[];
  columns: Column<{}>[];
  handleRowClick?: (rowId: string) => void;
  actantsUpdateMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    {
      statementId: string;
      data: {};
    },
    unknown
  >;
  entities: { [key: string]: IEntity };
}
export const StatementListTable: React.FC<StatementListTable> = ({
  statements,
  audits,
  columns,
  handleRowClick = () => {},
  actantsUpdateMutation,
  entities,
}) => {
  const [statementsWithAudit, setStatementsWithAudit] = useState<
    StatementWithAudit[]
  >([]);

  useEffect(() => {
    setStatementsWithAudit(getStatementsWithAudit());
  }, [statements]);

  const getRowId = useCallback((row) => {
    return row.id;
  }, []);

  const getStatementsWithAudit: () => StatementWithAudit[] = () => {
    if (statements && audits) {
      return statements.map((st) => ({
        ...st,
        audit: audits.find((a) => a.entityId === st.id),
      }));
    } else {
      return [];
    }
  };

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    visibleColumns,
  } = useTable(
    {
      columns,
      data: statementsWithAudit,
      getRowId,
      initialState: {
        hiddenColumns: ["id"],
      },
    },
    useExpanded
  );

  const moveRow = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragRecord = statementsWithAudit[dragIndex];
      setStatementsWithAudit(
        update(statementsWithAudit, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragRecord],
          ],
        })
      );
    },
    [statementsWithAudit]
  );

  const moveEndRow = async (statementToMove: IStatement, index: number) => {
    if (statementToMove.data.territory && statements[index].data.territory) {
      const { order: thisOrder, territoryId } = statementToMove.data.territory;

      if (thisOrder !== statements[index].data.territory?.order) {
        let allOrders: number[] = statements.map((s) =>
          s.data.territory ? s.data.territory.order : 0
        );
        allOrders.sort((a, b) => (a && b ? (a > b ? 1 : -1) : 0));

        allOrders = allOrders.filter((o) => o !== thisOrder);
        allOrders.splice(index, 0, thisOrder);

        if (index === 0) {
          allOrders[index] = allOrders[1] - 1;
        } else if (index === allOrders.length - 1) {
          allOrders[index] = allOrders[index - 1] + 1;
        } else {
          allOrders[index] = (allOrders[index - 1] + allOrders[index + 1]) / 2;
        }

        actantsUpdateMutation.mutate({
          statementId: statementToMove.id,
          data: {
            territory: {
              territoryId: territoryId,
              order: allOrders[index],
            },
          },
        });
      }
    }
  };

  return (
    <StyledTable {...getTableProps()}>
      <StyledTHead>
        {headerGroups.map((headerGroup, key) => (
          <tr {...headerGroup.getHeaderGroupProps()} key={key}>
            <th></th>
            {headerGroup.headers.map((column, key) =>
              key < 6 ? (
                <StyledTh {...column.getHeaderProps()} key={key}>
                  {column.render("Header")}
                </StyledTh>
              ) : (
                <th key={key}></th>
              )
            )}
          </tr>
        ))}
      </StyledTHead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row: Row, i: number) => {
          prepareRow(row);
          return (
            <StatementListRow
              index={i}
              handleClick={handleRowClick}
              row={row}
              moveRow={moveRow}
              moveEndRow={moveEndRow}
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
