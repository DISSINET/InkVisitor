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
  onSubmit: Function;
  onCancel: Function;
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
      <Modal onClose={(): void => onCancel()} showModal={show} disableBgClick>
        <ModalCard>
          <ModalHeader onClose={(): void => onCancel()} title={title} />
          <ModalContent>
            <p>{text}</p>
          </ModalContent>
          <ModalFooter>
            <ButtonGroup>
              <Button
                label="Submit"
                color="danger"
                onClick={(): void => onSubmit()}
              />
              <Button
                label="Cancel"
                color="info"
                onClick={(): void => onCancel()}
              />
            </ButtonGroup>
          </ModalFooter>
        </ModalCard>
      </Modal>
    </>
  );
};
