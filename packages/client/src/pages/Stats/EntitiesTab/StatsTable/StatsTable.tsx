import { IRequestStats, IResponseStats } from "@inkvisitor/shared/types";
import { useUsersGetMoreQuery } from "hooks/react-query/useUsersGetMoreQuery";
import { useMemo } from "react";
import { Column, useTable } from "react-table";
import { TABLE_PADDING } from "../../constants";
import { getDataCategories, transformDataForTable } from "../../utils";
import {
  StyledTable,
  StyledTableContainer,
  StyledTd,
  StyledTh,
} from "./StatsTableStyles";

interface StatsTableProps {
  data: IResponseStats;
  height: number;
  width: number;
  request: IRequestStats;
}

interface TableRow {
  timeKey: string;
  [key: string]: string | number;
}

export const StatsTable = ({
  data,
  height,
  request,
  width,
}: StatsTableProps) => {
  const { values } = data;
  const { aggregateBy } = request;

  const { data: dataUsers } = useUsersGetMoreQuery();

  const userKeyMap = useMemo<Record<string, string>>(() => {
    const mapNames: Record<string, string> = {};
    for (const user of dataUsers || []) {
      mapNames[user.id] = user.name.replace(".", "_");
    }
    return mapNames;
  }, [dataUsers]);

  const dataCategories = useMemo(
    () => getDataCategories(aggregateBy, userKeyMap, values),
    [aggregateBy, userKeyMap, JSON.stringify(values)]
  );

  const tableData = useMemo(
    () =>
      transformDataForTable(values, dataCategories, aggregateBy, userKeyMap),
    [values, dataCategories, aggregateBy, userKeyMap, JSON.stringify(values)]
  );

  const columns = useMemo<Column<TableRow>[]>(
    () => [
      {
        Header: "Time",
        accessor: "timeKey",
        width: 200,
      },
      ...dataCategories.map((category) => ({
        Header: category,
        accessor: category,
        Cell: ({ value }: { value: number | string }) => value,
        id: category,
        width: 200,
        minWidth: 200,
        maxWidth: 200,
      })),
    ],
    [dataCategories]
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({
      columns,
      data: tableData,
    });

  return (
    <StyledTableContainer $height={height} $width={width}>
      <StyledTable {...getTableProps()} $width={width - TABLE_PADDING}>
        <thead>
          {headerGroups.map((headerGroup) => {
            const { key, ...restHeaderGroupProps } =
              headerGroup.getHeaderGroupProps();
            return (
              <tr key={key} {...restHeaderGroupProps}>
                {headerGroup.headers.map((column, index) => {
                  const { key, ...restHeaderProps } = column.getHeaderProps();
                  return (
                    <StyledTh
                      key={key}
                      {...restHeaderProps}
                      $isSticky={index === 0}
                    >
                      {column.render("Header")}
                    </StyledTh>
                  );
                })}
              </tr>
            );
          })}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);
            const { key, ...restRowProps } = row.getRowProps();
            return (
              <tr key={key} {...restRowProps}>
                {row.cells.map((cell, index) => {
                  const { key, ...restCellProps } = cell.getCellProps();
                  return (
                    <StyledTd
                      key={key}
                      {...restCellProps}
                      $isSticky={index === 0}
                    >
                      {cell.render("Cell")}
                    </StyledTd>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </StyledTable>
    </StyledTableContainer>
  );
};
