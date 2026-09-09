import React from "react";
import {
  Button,
  ButtonGroup,
  IcoWarning,
  IcoCheck,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "dissinet.ddb.client";

export const Plain = () => (
  <Modal showModal width="auto" onClose={() => {}}>
    <ModalHeader title="Select parent territory" onClose={() => {}} />
    <ModalContent>
      Pick the territory the new one should be filed under.
    </ModalContent>
    <ModalFooter>
      <ButtonGroup>
        <Button label="Cancel" color="greyer" onClick={() => {}} />
        <Button label="Save" color="primary" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);

export const DangerWithIcon = () => (
  <Modal showModal width="auto" onClose={() => {}}>
    <ModalHeader
      title="Delete territory"
      color="danger"
      icon={<IcoWarning />}
      onClose={() => {}}
    />
    <ModalContent>
      This territory holds 24 statements. Deleting it removes them all.
    </ModalContent>
    <ModalFooter>
      <ButtonGroup>
        <Button label="Cancel" color="greyer" onClick={() => {}} />
        <Button label="Delete" color="danger" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);

export const SuccessBoldTitle = () => (
  <Modal showModal width="normal" onClose={() => {}}>
    <ModalHeader
      title="Import complete"
      color="success"
      icon={<IcoCheck />}
      boldTitle
      onClose={() => {}}
    />
    <ModalContent>
      18 statements from the Charles V correspondence archive were imported
      into "Council of Trent".
    </ModalContent>
    <ModalFooter>
      <ButtonGroup>
        <Button label="Close" color="primary" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);

export const WithExtraContent = () => (
  <Modal showModal width="normal" onClose={() => {}}>
    <ModalHeader
      title="Global validations"
      boldTitle
      content={<span>3 warnings</span>}
      onClose={() => {}}
    />
    <ModalContent column>
      Review the valency validations flagged across the territory tree
      before continuing.
    </ModalContent>
    <ModalFooter>
      <ButtonGroup>
        <Button label="Done" color="primary" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);

export const IconColorOverride = () => (
  <Modal showModal width="auto" onClose={() => {}}>
    <ModalHeader
      title="Pending review"
      icon={<IcoWarning />}
      iconColor="warning"
      onClose={() => {}}
    />
    <ModalContent>
      The statement "Trent reconvenes under Pope Julius III" is awaiting
      reviewer approval.
    </ModalContent>
    <ModalFooter>
      <ButtonGroup>
        <Button label="Close" color="greyer" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);
