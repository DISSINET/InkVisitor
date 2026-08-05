import { UserEnums } from "@inkvisitor/shared/enums";
import { IResponseGeneric, IResponseUser, IUser } from "@inkvisitor/shared/types";
import { UseMutationResult } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { UserTagSize } from "components/advanced/UserTag/utils";
import React, { useState } from "react";
import { FaEnvelopeOpenText } from "react-icons/fa";
import { getUserIcon } from "utils/iconUtils";
import { getStoredUserId } from "utils/userStorage";
import { UserListEmailInput } from "../UserListEmailInput/UserListEmailInput";
import { UserListIcon } from "../UserListIcon/UserListIcon";
import {
  StyledEditableName,
  StyledEditableText,
  StyledNotActiveText,
  StyledUserNameColumn,
  StyledUserNameColumnIcon,
  StyledUserNameColumnText,
} from "../UserListStyles";
import { UserListUsernameInput } from "../UserListUsernameInput/UserListUsernameInput";

interface UserListIdentityCell {
  user: IResponseUser;
  allUsers: IResponseUser[];
  userMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric<any>, any>,
    Error,
    Partial<Omit<IUser, "id">> & { id: IUser["id"] },
    unknown
  >;
}

export const UserListIdentityCell: React.FC<UserListIdentityCell> = ({
  user,
  allUsers,
  userMutation,
}) => {
  const [editing, setEditing] = useState<"name" | "email" | null>(null);
  const { name, email, role, active, verified } = user;

  // the owner's name and email are theirs alone to change; an admin manages
  // everything else about the account
  const canEdit = role !== UserEnums.Role.Owner || getStoredUserId() === user.id;

  /** Props that turn a text line into a click-to-edit target, empty when read-only */
  const editProps = (target: "name" | "email") =>
    canEdit
      ? {
          title: "click to edit",
          role: "button",
          tabIndex: 0,
          onClick: () => setEditing(target),
          onKeyDown: (event: React.KeyboardEvent) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setEditing(target);
            }
          },
        }
      : { $readOnly: true };

  const emailInput = (
    <UserListEmailInput
      user={user}
      userMutation={userMutation}
      autoFocus
      onDone={() => setEditing(null)}
    />
  );

  return (
    <StyledUserNameColumn $active={active} $verified={verified}>
      <StyledUserNameColumnIcon>
        <UserListIcon
          icon={
            !verified ? (
              <FaEnvelopeOpenText size={16} />
            ) : (
              getUserIcon(role, UserTagSize.ExtraLarge)
            )
          }
          tooltipLabel={role}
        />
      </StyledUserNameColumnIcon>

      {!verified ? (
        // an unverified user has no name yet, only the address the invite went to
        <StyledNotActiveText>
          <span>Verification email has been sent to</span>
          {editing === "email" ? (
            emailInput
          ) : (
            <StyledEditableName {...editProps("email")}>{email}</StyledEditableName>
          )}
        </StyledNotActiveText>
      ) : (
        <StyledUserNameColumnText>
          {editing === "name" ? (
            <UserListUsernameInput
              user={user}
              allUsers={allUsers}
              userMutation={userMutation}
              autoFocus
              onDone={() => setEditing(null)}
            />
          ) : (
            <StyledEditableName {...editProps("name")}>{name}</StyledEditableName>
          )}

          {editing === "email" ? (
            emailInput
          ) : (
            <StyledEditableText {...editProps("email")}>{email}</StyledEditableText>
          )}
        </StyledUserNameColumnText>
      )}
    </StyledUserNameColumn>
  );
};
