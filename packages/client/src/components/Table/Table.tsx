import { Button, Loader } from "components";
import React, { ReactNode } from "react";
import { Column, usePagination, useSortBy, useTable } from "react-table";
import {
  StyledPageNumber,
  StyledPagination,
  StyledTable,
  StyledTableHeader,
  StyledTableRecords,
  StyledTd,
  StyledTh,
  StyledTHead,
  StyledTr,
} from "./TableStyles";

interface Table {
  data: any[];
  columns: Column<any>[];
  isLoading?: boolean;
  headerButtons?: ReactNode;
  disablePaging?: boolean;
}

export const Table: React.FC<Table> = ({
  data,
  columns,
  isLoading,
  headerButtons,
  disablePaging,
}) => {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      initialState: {
        pageIndex: 0,
        pageSize: 5,
        hiddenColumns: [],
      },
    },
    useSortBy,
    usePagination
  );

  const getPagination = (position: "top" | "bottom"): ReactNode => (
    <StyledTableHeader position={position}>
      <StyledPagination>
        <Button
          onClick={(): void => gotoPage(0)}
          disabled={!canPreviousPage}
          label={"<<"}
          inverted
          color="success"
        />

        <Button
          onClick={(): void => previousPage()}
          disabled={!canPreviousPage}
          label={"<"}
          inverted
          color="success"
        />

        <StyledPageNumber>
          <strong>
            {pageIndex + 1} / {pageOptions.length}
          </strong>
        </StyledPageNumber>

        <Button
          onClick={(): void => nextPage()}
          disabled={!canNextPage}
          label={">"}
          inverted
          color="success"
        />

        <Button
          onClick={(): void => gotoPage(pageCount - 1)}
          disabled={!canNextPage}
          label={">>"}
          inverted
          color="success"
        />
      </StyledPagination>
      <StyledTableRecords>
        {"records: "}
        <b>{data.length}</b>
      </StyledTableRecords>
    </StyledTableHeader>
  );

  return (
    <>
      {!disablePaging && getPagination("top")}
      <div className="table-container">
        <StyledTable
          {...getTableProps()}
          className="table table-rounded is-striped is-hoverable is-fullwidth"
        >
          <StyledTHead>
            {headerGroups.map((headerGroup, key) => (
              <tr {...headerGroup.getHeaderGroupProps()} key={key}>
                {headerGroup.headers.map((column, key) => (
                  <StyledTh
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    key={key}
                  >
                    {column.render("Header")}
                    {/* Add a sort direction indicator */}
                    <span>
                      {column.isSorted
                        ? column.isSortedDesc
                          ? " ↑"
                          : " ↓"
                        : ""}
                    </span>
                  </StyledTh>
                ))}
              </tr>
            ))}
          </StyledTHead>
          <tbody {...getTableBodyProps()}>
            {page.map((row, key) => {
              prepareRow(row);
              return (
                <StyledTr {...row.getRowProps()} key={key}>
                  {row.cells.map((cell, key) => {
                    return (
                      <StyledTd {...cell.getCellProps()} key={key}>
                        {cell.render("Cell")}
                      </StyledTd>
                    );
                  })}
                </StyledTr>
              );
            })}
          </tbody>
          <tfoot></tfoot>
        </StyledTable>
        {data.length < 1 && !isLoading && "No records found"}
        {/* {"Server error"} */}
        <Loader show={isLoading} />
        {!disablePaging && getPagination("bottom")}
      </div>
    </>
  );
};
