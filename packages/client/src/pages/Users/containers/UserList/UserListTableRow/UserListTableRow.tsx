import { IResponseUser } from "@inkvisitor/shared/types";
import React from "react";
import { Row } from "react-table";
import { StyledTd, StyledTr, UserListRowFlash } from "../UserListStyles";
import { UserEnums } from "@inkvisitor/shared/enums";

interface UserListTableRow {
  row: Row<IResponseUser>;
  index: number;
  flash?: UserListRowFlash;
}

export const UserListTableRow: React.FC<UserListTableRow> = ({
  row,
  index,
  flash = false,
}) => {
  return (
    <StyledTr
      {...row.getRowProps()}
      key={index}
      $isOwner={row.original.role === UserEnums.Role.Owner}
      $isAdmin={row.original.role === UserEnums.Role.Admin}
      $isOdd={Boolean(index % 2)}
      $flash={flash}
    >
      {row.cells.map((cell, key) => {
        return (
          <StyledTd {...cell.getCellProps()} key={key}>
            {cell.render("Cell")}
          </StyledTd>
        );
      })}
    </StyledTr>
  );
};
