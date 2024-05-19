import { IResponseGeneric, IResponseUser } from "@shared/types";
import { UseMutationResult } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { Input } from "components";
import React, { useState } from "react";
import { Row } from "react-table";
import { toast } from "react-toastify";

interface UserListUsernameInput {
  user: IResponseUser;
  usernameList?: string[];
  userMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric<any>, any>,
    Error,
    any,
    unknown
  >;
}
export const UserListUsernameInput: React.FC<UserListUsernameInput> = ({
  user,
  usernameList,
  userMutation,
}) => {
  const { id, name } = user;
  const [localUsername, setLocalUsername] = useState(name);

  return (
    <Input
      value={localUsername}
      changeOnType
      onBlur={async () => {
        if (localUsername !== name) {
          if (localUsername.length < 4) {
            toast.warning("Minimum length of username is 4 characters");
            setLocalUsername(name);
          } else if (
            usernameList?.filter((u) => u !== name).includes(localUsername)
          ) {
            toast.warning("Username already in use");
            setLocalUsername(name);
          } else {
            userMutation.mutate({
              id: id,
              name: localUsername,
            });
          }
        }
      }}
      onChangeFn={(value) => {
        setLocalUsername(value);
      }}
    />
  );
};
