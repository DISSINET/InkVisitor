import { IResponseUser } from "@shared/types";
import React from "react";
import { Row } from "react-table";
import { StyledTd, StyledTr } from "../UserListStyles";

interface UserListTableRow {
  row: Row<IResponseUser>;
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
      <StyledTr $isOdd={Boolean(index % 2)} $isSelected={isSelected}>
        {row.cells.map((cell) => {
          return (
            <StyledTd {...cell.getCellProps()}>{cell.render("Cell")}</StyledTd>
          );
        })}
      </StyledTr>
    </React.Fragment>
  );
};
