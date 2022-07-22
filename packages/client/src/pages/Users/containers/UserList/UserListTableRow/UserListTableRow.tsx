import React from "react";
import { Cell } from "react-table";
import { StyledTd, StyledTr } from "../UserListStyles";

interface UserListTableRow {
  row: any;
  index: number;
  isSelected?: boolean;
}

export const UserListTableRow: React.FC<UserListTableRow> = ({
  row,
  index,
  isSelected = false,
}) => {
  return (
    <React.Fragment key={index}>
      <StyledTr isOdd={Boolean(index % 2)} isSelected={isSelected}>
        {row.cells.map((cell: Cell) => {
          return (
            <StyledTd {...cell.getCellProps()}>{cell.render("Cell")}</StyledTd>
          );
        })}
      </StyledTr>
    </React.Fragment>
  );
};
