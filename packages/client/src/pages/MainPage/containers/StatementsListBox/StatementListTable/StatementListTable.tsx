import React, { useCallback, useEffect, useState } from "react";
import { Column, useTable, useExpanded } from "react-table";
import update from "immutability-helper";
import { StyledTable, StyledTHead, StyledTh } from "./StatementListTableStyles";
import { StatementListRow } from "./StatementListRow";
import { IStatement, IActant } from "@shared/types";

interface StatementListTable {
  data: {}[];
  columns: Column<{}>[];
  handleRowClick?: Function;
}
export const StatementListTable: React.FC<StatementListTable> = ({
  data,
  columns,
  handleRowClick = () => {},
}) => {
  const [records, setRecords] = useState<{}[]>([]);
  useEffect(() => {
    setRecords(data);
  }, [data]);

  const getRowId = useCallback((row) => {
    return row.id;
  }, []);
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
      data: records,
      getRowId,
      initialState: {
        hiddenColumns: ["id"],
      },
    },
    useExpanded
  );

  const moveRow = (dragIndex: number, hoverIndex: number) => {
    const dragRecord = records[dragIndex];
    setRecords(
      update(records, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragRecord],
        ],
      })
    );
  };

  return (
    <StyledTable {...getTableProps()}>
      <StyledTHead>
        {headerGroups.map((headerGroup, key) => (
          <tr {...headerGroup.getHeaderGroupProps()} key={key}>
            {headerGroup.headers.map((column, key) => (
              <StyledTh {...column.getHeaderProps()} key={key}>
                {column.render("Header")}
              </StyledTh>
            ))}
            <th></th>
          </tr>
        ))}
      </StyledTHead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row, i) => {
          prepareRow(row);
          return (
            <StatementListRow
              handleClick={handleRowClick}
              index={i}
              row={row}
              moveRow={moveRow}
              {...row.getRowProps()}
            />
          );
        })}
      </tbody>
    </StyledTable>
  );
};
