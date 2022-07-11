import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useQueryClient } from "react-query";
import { FaPlus } from "react-icons/fa";

import api from "api";
import { Button, ButtonGroup, Input } from "components";
import { StyledUserEditorForm, StyledUtils } from "./UserListStyles";

interface UsersUtils {}

export const UsersUtils: React.FC<UsersUtils> = React.memo(({}) => {
  const [newUserName, setNewUserName] = useState<string>("");
  const [newUserEmail, setNewUserEmail] = useState<string>("");
  const [testEmail, setTestEmail] = useState<string>("");

  const queryClient = useQueryClient();

  const createNewUser = async () => {
    const res: any = await api.usersCreate({
      name: newUserName,
      email: newUserEmail,
    });
    if (res?.status === 200) {
      toast.success(`User ${newUserName} created!`);
    } else {
      toast.warning(`problem creating user!`);
    }
    setNewUserName("");
    setNewUserEmail("");
    queryClient.invalidateQueries("users");
  };

  const validNewUserEmail = useMemo(() => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(newUserEmail).toLowerCase());
  }, [newUserEmail]);

  const validNewUserName = useMemo(() => {
    return newUserName.length > 3;
  }, [newUserName]);

  return (
    <StyledUtils>
      <StyledUserEditorForm>
        <Input
          width={200}
          value={newUserName}
          placeholder="username"
          changeOnType
          onChangeFn={async (newValue: string) => {
            setNewUserName(newValue);
          }}
        />
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
          disabled={!(validNewUserEmail && validNewUserName)}
          icon={<FaPlus size={14} />}
          tooltip="create user"
          color="primary"
          label="new user"
          onClick={() => {
            createNewUser();
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
            tooltip="Test email will be sent to your email"
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
