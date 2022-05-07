import { Loader } from "components";
import React, { ReactNode } from "react";
import { Column, usePagination, useSortBy, useTable } from "react-table";
import {
  StyledTable,
  StyledTableHeader,
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
        pageSize: 20,
        hiddenColumns: [],
      },
    },
    useSortBy,
    usePagination
  );

  const getTableHeader = (): ReactNode => (
    <StyledTableHeader className="table-header level">
      <div className="level-left">{headerButtons}</div>
      <div className="level-right">
        <div className="pagination" style={{ marginBottom: 0 }}>
          <input
            className="page-input"
            type="number"
            min="1"
            max={pageOptions.length}
            defaultValue={pageIndex + 1}
            onChange={(e): void => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              gotoPage(page);
            }}
          />
          <button
            className="page-button"
            type="button"
            onClick={(): void => gotoPage(0)}
            disabled={!canPreviousPage}
          >
            {"<<"}
          </button>
          <button
            className="page-button"
            type="button"
            onClick={(): void => previousPage()}
            disabled={!canPreviousPage}
          >
            {"<"}
          </button>

          <div className="page-number">
            <strong>
              {pageIndex + 1} / {pageOptions.length}
            </strong>
          </div>

          <button
            className="page-button"
            type="button"
            onClick={(): void => nextPage()}
            disabled={!canNextPage}
          >
            {">"}
          </button>
          <button
            className="page-button"
            type="button"
            onClick={(): void => gotoPage(pageCount - 1)}
            disabled={!canNextPage}
          >
            {">>"}
          </button>
          <select
            className="page-select"
            value={pageSize}
            onChange={(e): void => {
              setPageSize(Number(e.target.value));
            }}
          >
            {[5, 10, 20, 50, 100].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
        <div className="table-records">
          {"records found: "}
          <b>{data.length}</b>
        </div>
      </div>
    </StyledTableHeader>
  );

  return (
    <>
      {!disablePaging && getTableHeader()}
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
        {!disablePaging && getTableHeader()}
      </div>
    </>
  );
};
