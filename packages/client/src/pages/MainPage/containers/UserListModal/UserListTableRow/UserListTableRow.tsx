import { IResponseStatement } from "@shared/types";
import React, { useRef } from "react";
import { Cell, ColumnInstance } from "react-table";
const queryString = require("query-string");

import { StyledTr, StyledTd } from "./UserListTableRowStyles";

interface UserListTableRow {
  row: any;
  index: number;
}

export const UserListTableRow: React.FC<UserListTableRow> =
  ({
    row,
    index,
  }) => {

    return (
      <React.Fragment key={index}>
        <StyledTr
          isOdd={Boolean(index % 2)}
        >
          {row.cells.map((cell: Cell) => {
            return (
              <StyledTd {...cell.getCellProps()}>
                {cell.render("Cell")}
              </StyledTd>
            );
          })}
        </StyledTr>
      </React.Fragment>
    );
  };
