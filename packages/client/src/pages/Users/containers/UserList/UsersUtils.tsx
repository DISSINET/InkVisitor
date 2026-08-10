import { IResponseUser } from "@inkvisitor/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { toast } from "react-toastify";

import api from "api";
import {
  Button,
  ButtonGroup,
  CancelButton,
  Input,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalInputForm,
  ModalInputLabel,
  ModalInputWrap,
} from "components";
import { IcoMail, IcoPlusBold } from "Theme/icons";

interface UsersUtils {
  users: IResponseUser[];
}

const isValidEmail = (value: string) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(value).toLowerCase());
};

export const UsersUtils: React.FC<UsersUtils> = React.memo(({ users }) => {
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState<string>("");

  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [testEmail, setTestEmail] = useState<string>("");

  const queryClient = useQueryClient();

  const closeNewUserModal = () => {
    setShowNewUserModal(false);
    setNewUserEmail("");
  };

  const createNewUserMutataion = useMutation({
    mutationFn: async () =>
      await api.usersCreate({
        email: newUserEmail,
      }),
    onSuccess() {
      toast.success(`User created! \n Verification email sent to ${newUserEmail}.`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeNewUserModal();
    },
    onError() {
      toast.warning(`problem creating user!`);
    },
  });

  const handleCreateUser = () => {
    if (!isValidEmail(newUserEmail)) {
      return;
    }
    if (users.some((user) => user.email === newUserEmail)) {
      toast.warning("Email already in use");
      return;
    }
    createNewUserMutataion.mutate();
  };

  const handleSendTestEmail = () => {
    if (!isValidEmail(testEmail)) {
      return;
    }
    api.testEmail(testEmail).then((data) => {
      toast.success(data.data.message);
      setShowTestEmailModal(false);
      setTestEmail("");
    });
  };

  return (
    <>
      <Button
        key="new-user"
        label="new user"
        icon={<IcoPlusBold />}
        color="primary"
        tooltipLabel="create a new user"
        onClick={() => setShowNewUserModal(true)}
      />
      <Button
        key="test-email"
        icon={<IcoMail />}
        color="info"
        tooltipLabel="send a test email to check the mailer"
        onClick={() => setShowTestEmailModal(true)}
      />

      <Modal
        showModal={showNewUserModal}
        onClose={closeNewUserModal}
        onEnterPress={handleCreateUser}
      >
        <ModalHeader title="New user" />
        <ModalContent column>
          <ModalInputForm>
            <ModalInputLabel>{"Email: "}</ModalInputLabel>
            <ModalInputWrap>
              <Input
                value={newUserEmail}
                placeholder="email"
                changeOnType
                autoFocus
                width="full"
                onChangeFn={(newValue: string) => setNewUserEmail(newValue)}
              />
            </ModalInputWrap>
          </ModalInputForm>
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <CancelButton key="cancel" onClick={closeNewUserModal} />
            <Button
              key="submit"
              label="create"
              color="primary"
              disabled={!isValidEmail(newUserEmail) || createNewUserMutataion.isPending}
              tooltipLabel={
                isValidEmail(newUserEmail)
                  ? "create a new user with the given mail"
                  : "please enter a valid mail first"
              }
              onClick={handleCreateUser}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>

      <Modal
        showModal={showTestEmailModal}
        onClose={() => setShowTestEmailModal(false)}
        onEnterPress={handleSendTestEmail}
      >
        <ModalHeader title="Test email" />
        <ModalContent column>
          <ModalInputForm>
            <ModalInputLabel>{"Send to: "}</ModalInputLabel>
            <ModalInputWrap>
              <Input
                value={testEmail}
                placeholder="email"
                changeOnType
                autoFocus
                width="full"
                onChangeFn={(newValue: string) => setTestEmail(newValue)}
              />
            </ModalInputWrap>
          </ModalInputForm>
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <CancelButton key="cancel" onClick={() => setShowTestEmailModal(false)} />
            <Button
              key="submit"
              label="send"
              color="info"
              disabled={!isValidEmail(testEmail)}
              tooltipLabel={
                isValidEmail(testEmail)
                  ? `send a test email to ${testEmail}`
                  : "please enter a valid mail first"
              }
              onClick={handleSendTestEmail}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </>
  );
});
