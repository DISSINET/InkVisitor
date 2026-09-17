import { IResponseGeneric, IResponseUser, IUser } from "@inkvisitor/shared/types";
import { UseMutationResult } from "@tanstack/react-query";
import api from "api";
import { AxiosResponse } from "axios";
import {
  Button,
  ButtonGroup,
  CancelButton,
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
  autoFocus?: boolean;
  /** the input has finished editing and the parent may return to its read-only view */
  onDone?: () => void;
}
export const UserListEmailInput: React.FC<UserListEmailInput> = ({
  user,
  userMutation,
  autoFocus = false,
  onDone,
}) => {
  const [showReactivationModal, setShowReactivationModal] = useState(false);

  const [localEmail, setLocalEmail] = useState(user.email);

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
        autoFocus={autoFocus}
        onChangeFn={(newValue: string) => {
          setLocalEmail(newValue);
        }}
        onEscapePressFn={() => {
          setLocalEmail(user.email);
          onDone?.();
        }}
        onBlur={() => {
          if (localEmail === user.email) {
            onDone?.();
            return;
          }
          if (user.verified) {
            userMutation.mutate({
              id: user.id,
              email: localEmail,
            });
            onDone?.();
          } else {
            // the reactivation modal lives in this component, so editing stays
            // open until the modal is answered
            setShowReactivationModal(true);
          }
        }}
        roundCorners
      />

      {/* Reactivation */}
      <Modal
        showModal={showReactivationModal}
        onClose={() => {
          setLocalEmail(user.email);
          setShowReactivationModal(false);
          onDone?.();
        }}
      >
        <ModalContent>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ width: "14rem" }}>
              <TiWarning size={40} />
            </span>
            <p>
              After changing the email address, a new activation email will be sent. The old
              activation mail will not be valid anymore. Do you want to proceed and change the email
              for this user?
            </p>
          </div>
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <CancelButton
              onClick={() => {
                setLocalEmail(user.email);
                setShowReactivationModal(false);
                onDone?.();
              }}
            />
            <Button
              label="Submit"
              color="danger"
              onClick={() => {
                updateEmail(localEmail);
                setShowReactivationModal(false);
                onDone?.();
              }}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </>
  );
};
