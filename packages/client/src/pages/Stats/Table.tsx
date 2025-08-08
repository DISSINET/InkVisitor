import { IRequestStats, IResponseStats } from "@shared/types";
import { Aggregation, EventType } from "@shared/types/stats";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { useMemo } from "react";
import { Column, useTable } from "react-table";
import styled from "styled-components";
import { getNonEmptyUsers } from "./utils";

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
    queryKey: ["users"],
    queryFn: () => api.usersGetMore({}),
  });

  const userKeyMap = useMemo<Record<string, string>>(() => {
    const mapNames: Record<string, string> = {};
    for (const user of dataUsers?.data || []) {
      mapNames[user.id] = user.name.replace(".", "_");
    }
    return mapNames;
  }, [dataUsers]);

  console.log(userKeyMap, values);

  const dataCategories = useMemo<string[]>(() => {
    const categoriesOut = [];

    if (aggregateBy === Aggregation.ACTIVITY_TYPE) {
      categoriesOut.push(EventType.EDIT);
      categoriesOut.push(EventType.DELETE);
      categoriesOut.push(EventType.CREATE);
    }

    if (aggregateBy === Aggregation.USER) {
      categoriesOut.push(...getNonEmptyUsers(userKeyMap, values));
    }
    return categoriesOut;
  }, [aggregateBy, userKeyMap]);

  const tableData = useMemo<TableRow[]>(() => {
    // Calculate sums for the first row
    const sums: Record<string, number> = {};
    dataCategories.forEach((category) => {
      sums[category] = 0;
    });

    // Transform data for table rows
    const rows: TableRow[] = Object.keys(values).map((timeKey) => {
      const row: TableRow = { timeKey };
      const valObject = values[timeKey];

      if (aggregateBy === Aggregation.USER) {
        for (const user of dataUsers?.data || []) {
          const value = valObject[user.id] || 0;
          const userName = userKeyMap[user.id];
          row[userName] = value;
          sums[userName] = (sums[userName] || 0) + value;
        }
      } else {
        dataCategories.forEach((category) => {
          const value = valObject[category] || 0;
          row[category] = value;
          sums[category] = (sums[category] || 0) + value;
        });
      }

      return row;
    });

    console.log("rows", rows);

    // Calculate grand total for percentages
    const grandTotal = Object.values(sums).reduce((acc, val) => acc + val, 0);

    // Add sums row with percentages at the beginning
    rows.unshift({
      timeKey: "Total",
      ...Object.fromEntries(
        Object.entries(sums).map(([key, value]) => [
          key,
          `${value} [${Math.round((value / grandTotal) * 100)}%]`,
        ])
      ),
    });

    return rows;
  }, [values, dataCategories, dataUsers, userKeyMap, aggregateBy]);

  const columns = useMemo<Column<TableRow>[]>(() => {
    const timeColumnWidth = 200;
    const remainingWidth = width - timeColumnWidth;

    return [
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
      })),
    ];
  }, [dataCategories]);

  console.log(columns, tableData);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({
      columns,
      data: tableData,
    });

  return (
    <TableContainer $height={height} $width={width}>
      <Table {...getTableProps()} $width={width}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column, index) => (
                <Th {...column.getHeaderProps()} $isSticky={index === 0}>
                  {column.render("Header")}
                </Th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell, index) => (
                  <Td {...cell.getCellProps()} $isSticky={index === 0}>
                    {cell.render("Cell")}
                  </Td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </Table>
    </TableContainer>
  );
};
