import { IRequestStats, IResponseStats } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { useMemo } from "react";
import { Column, useTable } from "react-table";
import styled from "styled-components";
import { getDataCategories, transformDataForTable } from "./utils";
import { OTHERS_KEY, TABLE_PADDING } from "./constants";

interface StatsTableProps {
  data: IResponseStats;
  height: number;
  width: number;
  request: IRequestStats;
}

const TableContainer = styled.div<{ $height: number; $width: number }>`
  width: ${(props) => props.$width}px;
  height: ${(props) => props.$height}px;
  overflow: auto;
  border: 1px solid ${(props) => props.theme.color.gray[200]};
  border-radius: ${(props) => props.theme.borderRadius.md};
`;

const Table = styled.table<{ $width: number }>`
  border-collapse: collapse;
  width: ${(props) => props.$width}px;
  table-layout: fixed;
`;

const Th = styled.th<{ $isSticky?: boolean }>`
  background: ${(props) => props.theme.color.gray[100]};
  padding: ${(props) => props.theme.space[2]};
  text-align: left;
  font-weight: ${(props) => props.theme.fontWeight.bold};
  border-bottom: 2px solid ${(props) => props.theme.color.gray[200]};
  white-space: nowrap;
  font-size: 14px;
  width: 150px;
  position: sticky;
  top: 0;
  z-index: 1;
  ${(props) =>
    props.$isSticky &&
    `
    left: 0;
    z-index: 2;
    `}
`;

const Td = styled.td<{ $isSticky?: boolean }>`
  padding: ${(props) => props.theme.space[2]};
  border-bottom: 1px solid ${(props) => props.theme.color.gray[200]};
  width: 100px;
  font-size: 13px;

  ${(props) =>
    props.$isSticky &&
    `
    position: sticky;
    left: 0;
    background: ${props.theme.color.gray[100]};
    z-index: 1;
    font-weight: ${props.theme.fontWeight.bold};
    `}
`;

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

  const { data: dataUsers } = useQuery({
    queryKey: ["users-stats"],
    queryFn: () => api.usersGetMore({}),
    enabled: api.isLoggedIn(),
  });

  const userKeyMap = useMemo<Record<string, string>>(() => {
    const mapNames: Record<string, string> = {
      [OTHERS_KEY]: OTHERS_KEY,
    };
    for (const user of dataUsers?.data || []) {
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
    <TableContainer $height={height} $width={width}>
      <Table {...getTableProps()} $width={width - TABLE_PADDING}>
        <thead>
          {headerGroups.map((headerGroup) => {
            const { key, ...restHeaderGroupProps } =
              headerGroup.getHeaderGroupProps();
            return (
              <tr key={key} {...restHeaderGroupProps}>
                {headerGroup.headers.map((column, index) => {
                  const { key, ...restHeaderProps } = column.getHeaderProps();
                  return (
                    <Th key={key} {...restHeaderProps} $isSticky={index === 0}>
                      {column.render("Header")}
                    </Th>
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
                    <Td key={key} {...restCellProps} $isSticky={index === 0}>
                      {cell.render("Cell")}
                    </Td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </Table>
    </TableContainer>
  );
};
