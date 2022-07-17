import React, { useState } from "react";

import {
  Modal,
  ModalCard,
  ModalHeader,
  ModalContent,
  ModalFooter,
  Button,
  ButtonGroup,
} from "components";

export default {
  title: "Modal",
  parameters: {
    info: { inline: true },
  },
  args: {
    width: "normal",
  },
  argTypes: {
    width: {
      options: ["full", "normal", "thin"],
      control: { type: "select" },
    },
  },
};

export const DefaultModal = ({ ...args }) => {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <Button label="Show Modal!" onClick={() => setShowModal(true)} />
      <Modal
        {...args}
        onClose={(): void => setShowModal(false)}
        showModal={showModal}
      >
        <ModalHeader title={"Modal title"} />
        <ModalContent>
          <p>{"Main content of modal.."}</p>
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <Button
              label="Cancel"
              color="danger"
              onClick={(): void => setShowModal(false)}
            />
            <Button
              label="Save"
              onClick={(): void => alert("Something was saved!")}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </>
  );
};
