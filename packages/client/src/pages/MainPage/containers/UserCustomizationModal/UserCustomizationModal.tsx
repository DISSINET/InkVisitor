import {
  Button,
  ButtonGroup,
  Input,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalInputForm,
  ModalInputLabel,
  ModalInputWrap,
} from "components";
import React from "react";

interface UserCustomizationModal {
  onClose?: () => void;
}
export const UserCustomizationModal: React.FC<UserCustomizationModal> = ({
  onClose = () => {},
}) => {
  return (
    <div>
      <Modal
        showModal={true}
        width="thin"
        // onEnterPress={handleCreateActant}
        onClose={() => onClose()}
      >
        <ModalHeader title="User customization" />
        <ModalContent>
          <ModalInputForm>
            <ModalInputLabel>{"name"}</ModalInputLabel>
            <ModalInputWrap>
              <Input onChangeFn={(text: string) => console.log(text)} />
            </ModalInputWrap>
            <ModalInputLabel>{"email"}</ModalInputLabel>
            <ModalInputWrap>
              <Input onChangeFn={(text: string) => console.log(text)} />
            </ModalInputWrap>
          </ModalInputForm>
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <Button
              key="cancel"
              label="Cancel"
              color="warning"
              onClick={() => {
                onClose();
              }}
            />
            <Button
              key="submit"
              label="Submit"
              color="primary"
              onClick={() => {
                console.log("submit");
              }}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </div>
  );
};
