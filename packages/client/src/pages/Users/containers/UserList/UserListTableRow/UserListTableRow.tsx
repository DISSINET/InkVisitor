import { IResponseUser } from "@inkvisitor/shared/types";
import React from "react";
import { Row } from "react-table";
import {
  StyledTd,
  StyledTr,
  UserListRoleAccent,
  UserListRowFlash,
} from "../UserListStyles";
import { UserEnums } from "@inkvisitor/shared/enums";

const roleAccent = (role: UserEnums.Role): UserListRoleAccent => {
  if (role === UserEnums.Role.Owner) {
    return "owner";
  }
  if (role === UserEnums.Role.Admin) {
    return "admin";
  }
  return false;
};

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
    <StyledTr {...row.getRowProps()} key={index} $isOdd={Boolean(index % 2)}>
      {row.cells.map((cell, key) => {
        return (
          <StyledTd
            {...cell.getCellProps()}
            key={key}
            $flash={flash}
            $roleAccent={roleAccent(row.original.role)}
            $isInactive={!row.original.active}
          >
            {cell.render("Cell")}
          </StyledTd>
        );
      })}
    </StyledTr>
  );
};
