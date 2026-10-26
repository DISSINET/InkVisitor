import { IResponseGeneric, IResponseUser, IUser } from "@inkvisitor/shared/types";
import { UseMutationResult } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { Input } from "components";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface UserListUsernameInput {
  user: IResponseUser;
  /** every user, not only the visible rows: the name must be unique across all of them */
  allUsers: IResponseUser[];
  userMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric<any>, any>,
    Error,
    Partial<Omit<IUser, "id">> & { id: IUser["id"] },
    unknown
  >;
  autoFocus?: boolean;
  /** the input has finished editing and the parent may return to its read-only view */
  onDone?: () => void;
}
export const UserListUsernameInput: React.FC<UserListUsernameInput> = ({
  user,
  allUsers,
  userMutation,
  autoFocus = false,
  onDone,
}) => {
  const { id, name } = user;

  const [localUsername, setLocalUsername] = useState(name);
  useEffect(() => {
    setLocalUsername(name);
  }, [name]);

  return (
    <Input
      value={localUsername}
      changeOnType
      autoFocus={autoFocus}
      onEscapePressFn={() => {
        setLocalUsername(name);
        onDone?.();
      }}
      onBlur={async () => {
        const usernameList = allUsers.map((otherUser) => otherUser.name);

        if (localUsername !== name) {
          if (localUsername.length < 4) {
            toast.warning("Minimum length of username is 4 characters");
            setLocalUsername(name);
          } else if (localUsername.length > 20) {
            toast.warning("Maximum length of username is 20 characters");
            setLocalUsername(name);
          } else if (usernameList?.filter((u) => u !== name).includes(localUsername)) {
            toast.warning("Username already in use");
            setLocalUsername(name);
          } else {
            userMutation.mutate({
              id: id,
              name: localUsername,
            });
          }
        }
        onDone?.();
      }}
      onChangeFn={(value) => {
        setLocalUsername(value);
      }}
      roundCorners
    />
  );
};
