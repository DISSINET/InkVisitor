import { Button, Loader } from "components";
import React, { ReactNode } from "react";
import { Column, usePagination, useSortBy, useTable } from "react-table";
import {
  StyledHeading,
  StyledPageNumber,
  StyledPagination,
  StyledTable,
  StyledTableContainer,
  StyledTableHeader,
  StyledTd,
  StyledTh,
  StyledTHead,
  StyledTr,
  StyledUsedInTitle,
} from "./TableStyles";

interface Table {
  data: any[];
  columns: Column<{}>[];
  isLoading?: boolean;
  entityTitle?: { singular: string; plural: string };
  perPage?: number;
  disablePaging?: boolean;
  disableHeading?: boolean;
  disableHeader?: boolean;
  disableBottomPaging?: boolean;
  noBorder?: boolean;
  fullWidthColumn?: number;
  // Don't combine with fullWidthColumn (see CSS)
  firstColumnMinWidth?: boolean;
  lastColumnMinWidth?: boolean;
}

export const Table: React.FC<Table> = ({
  data,
  columns,
  isLoading,
  entityTitle = { singular: "Record", plural: "Records" },
  perPage = 5,
  disablePaging,
  disableHeading = false,
  disableHeader = false,
  disableBottomPaging = false,
  noBorder = false,
  fullWidthColumn = 0,
  firstColumnMinWidth = false,
  lastColumnMinWidth = false,
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
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      initialState: {
        pageIndex: 0,
        pageSize: perPage,
        hiddenColumns: [],
      },
    },
    useSortBy,
    usePagination
  );

  const renderPagination = (position: "top" | "bottom"): ReactNode => (
    <StyledTableHeader
      position={position}
      pagingUseless={pageSize > data.length}
    >
      {!disableHeading && position === "top" && (
        <StyledHeading>
          {
            <StyledUsedInTitle>
              <b>{`${data.length} `}</b>{" "}
              {`${
                data.length === 1 ? entityTitle.singular : entityTitle.plural
              }`}
            </StyledUsedInTitle>
          }
        </StyledHeading>
      )}
      {pageSize < data.length && (
        <StyledPagination>
          <Button
            onClick={(): void => gotoPage(0)}
            disabled={!canPreviousPage}
            label={"<<"}
            inverted
            color="greyer"
          />

          <Button
            onClick={(): void => previousPage()}
            disabled={!canPreviousPage}
            label={"<"}
            inverted
            color="greyer"
          />

          <StyledPageNumber>
            {pageIndex + 1}/{pageOptions.length}
          </StyledPageNumber>

          <Button
            onClick={(): void => nextPage()}
            disabled={!canNextPage}
            label={">"}
            inverted
            color="greyer"
          />

          <Button
            onClick={(): void => gotoPage(pageCount - 1)}
            disabled={!canNextPage}
            label={">>"}
            inverted
            color="greyer"
          />
        </StyledPagination>
      )}
    </StyledTableHeader>
  );

  return (
    <>
      {!disablePaging && renderPagination("top")}
      <StyledTableContainer>
        <StyledTable
          {...getTableProps()}
          noBorder={noBorder}
        >
          {!disableHeader && data.length > 0 && (
            <StyledTHead noBorder={noBorder}>
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
          )}
          <tbody {...getTableBodyProps()}>
            {page.map((row, key) => {
              prepareRow(row);
              return (
                <StyledTr
                  {...row.getRowProps()}
                  key={key}
                  noBorder={noBorder}
                  fullWidthColumn={fullWidthColumn}
                  firstColumnMinWidth={firstColumnMinWidth}
                  lastColumnMinWidth={lastColumnMinWidth}
                >
                  {row.cells.map((cell, key) => {
                    return (
                      <StyledTd
                        {...cell.getCellProps()}
                        key={key}
                        noBorder={noBorder}
                      >
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
        {/* {"Server error"} */}
        <Loader show={isLoading} />
        {(!disablePaging || !disableBottomPaging) && renderPagination("bottom")}
      </StyledTableContainer>
    </>
  );
};
