import { IResponseGeneric, IResponseUser, IUser } from "@shared/types";
import { UseMutationResult } from "@tanstack/react-query";
import api from "api";
import { AxiosResponse } from "axios";
import {
  Button,
  ButtonGroup,
  Input,
  Modal,
  ModalContent,
  ModalFooter,
} from "components";
import React, { useEffect, useState } from "react";
import { TiWarning } from "react-icons/ti";
import { toast } from "react-toastify";

interface UserListEmailInput {
  user: IResponseUser;
  userMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric<any>, any>,
    unknown,
    Partial<Omit<IUser, "id">> & { id: IUser["id"] },
    unknown
  >;
}
export const UserListEmailInput: React.FC<UserListEmailInput> = ({
  user,
  userMutation,
}) => {
  const [showReactivationModal, setShowReactivationModal] = useState(false);

  const [localEmail, setLocalEmail] = useState("");

  useEffect(() => {
    if (user) {
      setLocalEmail(user.email);
    }
  }, [user]);

  const updateEmail = async (email: string) => {
    try {
      const res = await api.usersUpdate(user.id, { email });
      if (res.status === 200) {
        toast.success(`Activation link was sent to email [${localEmail}]`);
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <Input
        changeOnType
        value={localEmail}
        onChangeFn={(newValue: string) => {
          setLocalEmail(newValue);
        }}
        onBlur={() => {
          if (user.verified) {
            userMutation.mutate({
              id: user.id,
              email: localEmail,
            });
          } else if (!user.verified && user.email !== localEmail) {
            setShowReactivationModal(true);
          }
        }}
      />

      {/* Reactivation */}
      <Modal
        showModal={showReactivationModal}
        onClose={() => setShowReactivationModal(false)}
      >
        <ModalContent>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ width: "14rem" }}>
              <TiWarning size={40} />
            </span>
            <p>
              After changing the email address, a new activation email will be
              sent. The old activation mail will not be valid anymore. Do you
              want to proceed and change the email for this user?
            </p>
          </div>
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <Button
              label="cancel"
              color="success"
              onClick={() => {
                setLocalEmail(user.email);
                setShowReactivationModal(false);
              }}
            />
            <Button
              label="submit"
              color="danger"
              onClick={() => {
                updateEmail(localEmail);
                setShowReactivationModal(false);
              }}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </>
  );
};
