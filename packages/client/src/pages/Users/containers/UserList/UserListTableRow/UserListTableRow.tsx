import { IResponseUser } from "@shared/types";
import React from "react";
import { Row } from "react-table";
import { StyledTd, StyledTr } from "../UserListStyles";
import { UserEnums } from "@shared/enums";

interface UserListTableRow {
  row: Row<IResponseUser>;
  index: number;
}

export const UserListTableRow: React.FC<UserListTableRow> = ({
  row,
  index,
}) => {
  return (
    <React.Fragment key={index}>
      <StyledTr
        $isOwner={row.original.role === UserEnums.Role.Owner}
        $isAdmin={row.original.role === UserEnums.Role.Admin}
        $isOdd={Boolean(index % 2)}
      >
        {row.cells.map((cell) => {
          return (
            <StyledTd {...cell.getCellProps()}>{cell.render("Cell")}</StyledTd>
          );
        })}
      </StyledTr>
    </React.Fragment>
  );
};
