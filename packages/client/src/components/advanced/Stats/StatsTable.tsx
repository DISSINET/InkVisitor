import { IResponseStats } from "@inkvisitor/shared/types";
import { useUsersSimplifiedQuery } from "hooks/react-query/useUsersSimplifiedQuery";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Column, useTable } from "react-table";
import {
  TOTAL_KEY,
  getDataCategories,
  transformDataForTable,
} from "./statsViz.utils";
import {
  StyledEmptyState,
  StyledTable,
  StyledTableContainer,
  StyledTd,
  StyledTh,
} from "./StatsTableStyles";

interface StatsTableProps {
  data: IResponseStats;
  height: number;
  width: number;
}

interface TableRow {
  timeKey: string;
  [key: string]: string | number;
}

export const StatsTable = ({ data, height, width }: StatsTableProps) => {
  const { values, aggregateBy } = data;

  const { data: dataUsers } = useUsersSimplifiedQuery();

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
      },
      {
        Header: "Total",
        accessor: TOTAL_KEY,
        Cell: ({ value }: { value: number | string }) => value,
        id: TOTAL_KEY,
      },
      ...dataCategories.map((category) => ({
        Header: category,
        accessor: category,
        Cell: ({ value }: { value: number | string }) => value,
        id: category,
      })),
    ],
    [dataCategories]
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({
      columns,
      data: tableData,
    });

  // columns size to their content, so the offset the second pinned column
  // sticks at is whatever width the first column rendered — measured live,
  // since new data re-lays it out
  const firstColRef = useRef<HTMLTableCellElement>(null);
  const [firstColWidth, setFirstColWidth] = useState(0);
  useLayoutEffect(() => {
    const el = firstColRef.current;
    if (!el) {
      return;
    }
    const update = () => setFirstColWidth(el.offsetWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [dataCategories]);

  if (dataCategories.length === 0) {
    return (
      <StyledEmptyState $height={height} $width={width}>
        No data for the selected filters
      </StyledEmptyState>
    );
  }

  return (
    <StyledTableContainer $height={height} $width={width}>
      <StyledTable {...getTableProps()}>
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
                      ref={index === 0 ? firstColRef : undefined}
                      $isSticky={index <= 1}
                      $stickyOffset={index === 0 ? 0 : firstColWidth}
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
            // transformDataForTable puts the totals row first
            const isTotalRow = row.index === 0;
            return (
              <tr key={key} {...restRowProps}>
                {row.cells.map((cell, index) => {
                  const { key, ...restCellProps } = cell.getCellProps();
                  return (
                    <StyledTd
                      key={key}
                      {...restCellProps}
                      $isSticky={index <= 1}
                      $stickyOffset={index === 0 ? 0 : firstColWidth}
                      $isTotalRow={isTotalRow}
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
