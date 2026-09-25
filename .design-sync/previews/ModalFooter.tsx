import React from "react";
import {
  Button,
  ButtonGroup,
  CancelButton,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "dissinet.ddb.client";

export const Default = () => (
  <Modal showModal width="auto" onClose={() => {}}>
    <ModalHeader title="Delete statement" onClose={() => {}} />
    <ModalContent>
      This statement references "Charles V" and "Council of Trent". Deleting
      it removes those references too.
    </ModalContent>
    <ModalFooter>
      <ButtonGroup>
        <CancelButton onClick={() => {}} />
        <Button label="Delete" color="danger" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);

export const SpaceBetween = () => (
  <Modal showModal width="normal" onClose={() => {}}>
    <ModalHeader title="Territory statements" onClose={() => {}} />
    <ModalContent>
      12 statements are filed under "Council of Trent".
    </ModalContent>
    <ModalFooter spaceBetween>
      <Button label="View history" color="greyer" onClick={() => {}} />
      <ButtonGroup>
        <CancelButton onClick={() => {}} />
        <Button label="Save" color="primary" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);

export const WithNote = () => (
  <Modal showModal width="normal" onClose={() => {}}>
    <ModalHeader title="Apply template" onClose={() => {}} />
    <ModalContent>
      Instantiate the "Council of Trent session" template into this
      territory.
    </ModalContent>
    <ModalFooter note="24 entities will be created">
      <ButtonGroup>
        <CancelButton onClick={() => {}} />
        <Button label="Apply" color="primary" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);
