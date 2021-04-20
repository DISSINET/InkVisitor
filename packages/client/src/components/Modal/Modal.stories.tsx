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
};

export const DefaultModal = () => {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <Button label="Show Modal!" onClick={() => setShowModal(true)} />
      <Modal onClose={(): void => setShowModal(false)} showModal={showModal}>
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
export const FullWidthModal = () => {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <Button label="Show Modal!" onClick={() => setShowModal(true)} />
      <Modal
        onClose={(): void => setShowModal(false)}
        showModal={showModal}
        fullwidth
      >
        <ModalHeader title={"Modal title"} />
        <ModalContent>
          <p>
            {
              "Sint et occaecat deserunt aliqua incididunt est voluptate ad nulla nostrud officia aute commodo. Sint ipsum ad Lorem labore elit veniam ullamco. Sint sunt sit ut nisi nisi ullamco deserunt ullamco. Eiusmod anim do irure in ea amet aute labore dolore deserunt. Anim minim incididunt eiusmod consequat ad eiusmod. Qui culpa veniam pariatur fugiat reprehenderit sint nostrud eiusmod nisi aliquip ut proident. Nostrud adipisicing sit commodo aute quis. Id laborum consequat non quis voluptate qui veniam. Cupidatat labore reprehenderit sunt do eu excepteur id dolore amet. Ad pariatur fugiat labore aliquip ut enim qui. Lorem consectetur magna nostrud ad nisi irure elit proident enim anim nostrud proident quis do. Fugiat est occaecat sunt ut sint consectetur magna ut labore sit sint officia ea incididunt. Nostrud amet quis fugiat laboris consequat aliquip pariatur. Magna aliquip nulla magna enim. Deserunt quis amet aliqua est Lorem sint commodo commodo aliqua aute qui. Nostrud labore dolore labore pariatur nostrud ea culpa tempor. Incididunt cupidatat amet quis pariatur. Exercitation sint velit aliquip eiusmod mollit exercitation exercitation sunt qui duis labore ipsum do id. Sint et occaecat deserunt aliqua incididunt est voluptate ad nulla nostrud officia aute commodo. Sint ipsum ad Lorem labore elit veniam ullamco. Sint sunt sit ut nisi nisi ullamco deserunt ullamco. Eiusmod anim do irure in ea amet aute labore dolore deserunt. Anim minim incididunt eiusmod consequat ad eiusmod. Qui culpa veniam pariatur fugiat reprehenderit sint nostrud eiusmod nisi aliquip ut proident. Nostrud adipisicing sit commodo aute quis. Id laborum consequat non quis voluptate qui veniam. Cupidatat labore reprehenderit sunt do eu excepteur id dolore amet. Ad pariatur fugiat labore aliquip ut enim qui. Lorem consectetur magna nostrud ad nisi irure elit proident enim anim nostrud proident quis do. Fugiat est occaecat sunt ut sint consectetur magna ut labore sit sint officia ea incididunt. Nostrud amet quis fugiat laboris consequat aliquip pariatur. Magna aliquip nulla magna enim. Deserunt quis amet aliqua est Lorem sint commodo commodo aliqua aute qui. Nostrud labore dolore labore pariatur nostrud ea culpa tempor. Incididunt cupidatat amet quis pariatur. Exercitation sint velit aliquip eiusmod mollit exercitation exercitation sunt qui duis labore ipsum do id."
            }
          </p>
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
