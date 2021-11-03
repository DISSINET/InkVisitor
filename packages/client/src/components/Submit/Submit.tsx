import React from "react";

import {
  Button,
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  ModalCard,
  ButtonGroup,
  Loader,
} from "components";

interface Submit {
  title?: string;
  text?: string;
  show: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  loading?: boolean;
}
export const Submit: React.FC<Submit> = ({
  title,
  text,
  show,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  return (
    <>
      <Modal onClose={onCancel} showModal={show} disableBgClick>
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
        <Loader show={loading} />
      </Modal>
    </>
  );
};
