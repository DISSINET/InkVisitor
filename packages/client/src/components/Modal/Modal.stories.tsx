import React, { useState } from "react";

import {
  Modal,
  ModalCard,
  ModalHeader,
  ModalContent,
  ModalFooter,
  Button,
} from "components";

export default {
  title: "Modal",
  parameters: {
    info: { inline: true },
  },
};

export const DefaultModal = () => {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <Button label="Show Modal!" onClick={() => setShowModal(true)} />
      <Modal onClose={(): void => setShowModal(false)} showModal={showModal}>
        <ModalCard>
          <ModalHeader
            onClose={(): void => setShowModal(false)}
            title={"Modal title"}
          />
          <ModalContent>
            <p>{"Main content of modal.."}</p>
          </ModalContent>
          <ModalFooter>
            <Button
              label="Cancel"
              color="danger"
              onClick={(): void => setShowModal(false)}
              marginRight
            />
            <Button
              label="Submit"
              onClick={(): void => alert("Modal submitted!")}
            />
          </ModalFooter>
        </ModalCard>
      </Modal>
    </>
  );
};
export const FullWidthModal = () => {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <Button label="Show Modal!" onClick={() => setShowModal(true)} />
      <Modal onClose={(): void => setShowModal(false)} showModal={showModal}>
        <ModalCard fullwidth>
          <ModalHeader
            onClose={(): void => setShowModal(false)}
            title={"Modal title"}
          />
          <ModalContent>
            <p>{"Main content of modal.."}</p>
          </ModalContent>
          <ModalFooter>
            <Button
              label="Cancel"
              color="danger"
              onClick={(): void => setShowModal(false)}
              marginRight
            />
            <Button
              label="Submit"
              onClick={(): void => alert("Modal submitted!")}
            />
          </ModalFooter>
        </ModalCard>
      </Modal>
    </>
  );
};
