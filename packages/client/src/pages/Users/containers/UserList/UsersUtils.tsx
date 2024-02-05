import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FaPlus } from "react-icons/fa";

import api from "api";
import { Button, ButtonGroup, Input } from "components";
import { StyledUserEditorForm, StyledUtils } from "./UserListStyles";

interface UsersUtils {}

export const UsersUtils: React.FC<UsersUtils> = React.memo(({}) => {
  // const [newUserName, setNewUserName] = useState<string>("");
  const [newUserEmail, setNewUserEmail] = useState<string>("");
  const [testEmail, setTestEmail] = useState<string>("");

  const queryClient = useQueryClient();

  const createNewUserMutataion = useMutation(
    async () =>
      await api.usersCreate({
        email: newUserEmail,
      }),
    {
      onSuccess(data, variables) {
        toast.success(
          `User created! \n Verification email sent to ${newUserEmail}.`
        );
        setNewUserEmail("");
        queryClient.invalidateQueries(["users"]);
      },
      onError() {
        toast.warning(`problem creating user!`);
      },
    }
  );

  const validNewUserEmail = () => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(newUserEmail).toLowerCase());
  };

  return (
    <StyledUtils>
      <StyledUserEditorForm>
        <Input
          width={200}
          value={newUserEmail}
          placeholder="email"
          changeOnType
          onChangeFn={async (newValue: string) => {
            setNewUserEmail(newValue);
          }}
        />
        <Button
          key="add"
          label="new user"
          tooltipLabel="create user"
          disabled={!validNewUserEmail()}
          icon={<FaPlus />}
          color="primary"
          onClick={() => {
            createNewUserMutataion.mutate();
          }}
        />
      </StyledUserEditorForm>
      <StyledUserEditorForm>
        <ButtonGroup>
          <Input
            width={200}
            value={testEmail}
            placeholder="test email"
            changeOnType
            onChangeFn={async (newValue: string) => {
              setTestEmail(newValue);
            }}
          />
          <Button
            tooltipLabel="Test email will be sent to your email"
            color="primary"
            label="test email"
            onClick={() =>
              api.testEmail(testEmail).then((data) => {
                toast.success(data.data.message);
              })
            }
          />
        </ButtonGroup>
      </StyledUserEditorForm>
    </StyledUtils>
  );
});
