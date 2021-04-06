import React from "react";

import {
  Button,
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  ModalCard,
  ButtonGroup,
} from "components";

interface Submit {
  title?: string;
  text?: string;
  show: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}
export const Submit: React.FC<Submit> = ({
  title,
  text,
  show,
  onSubmit,
  onCancel,
}) => {
  return (
    <>
      <Modal onClose={onCancel} showModal={show} disableBgClick>
        <ModalCard>
          <ModalHeader title={title} />
          <ModalContent>
            <p>{text}</p>
          </ModalContent>
          <ModalFooter>
            <ButtonGroup>
              <Button label="Cancel" color="info" onClick={onCancel} />
              <Button label="Submit" color="danger" onClick={onSubmit} />
            </ButtonGroup>
          </ModalFooter>
        </ModalCard>
      </Modal>
    </>
  );
};
