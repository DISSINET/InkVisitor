import React from "react";
import {
  Button,
  ButtonGroup,
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
        <Button label="Cancel" color="greyer" onClick={() => {}} />
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
        <Button label="Cancel" color="greyer" onClick={() => {}} />
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
        <Button label="Cancel" color="greyer" onClick={() => {}} />
        <Button label="Apply" color="primary" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);

export const Column = () => (
  <Modal showModal width="auto" onClose={() => {}}>
    <ModalHeader title="Export options" onClose={() => {}} />
    <ModalContent>
      Choose how to export the statements under "Council of Trent".
    </ModalContent>
    <ModalFooter column>
      <Button label="Export as CSV" color="primary" onClick={() => {}} />
      <Button label="Export as JSON" color="greyer" onClick={() => {}} />
    </ModalFooter>
  </Modal>
);
