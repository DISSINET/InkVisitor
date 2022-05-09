import {
  Button,
  ButtonGroup,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import React from "react";
import { StyledTableWrapper } from "./AboutModalStyles";

interface AboutModal {
  isOpen: boolean;
  onCloseFn: Function;
}

export const AboutModal: React.FC<AboutModal> = ({ isOpen, onCloseFn }) => {
  return (
    <Modal showModal={isOpen} onClose={() => onCloseFn()} width={"full"}>
      <ModalHeader title={"About"} />
      <ModalContent>
        <StyledTableWrapper></StyledTableWrapper>
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button
            key="close"
            label="Close"
            color="primary"
            inverted
            onClick={() => onCloseFn()}
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
