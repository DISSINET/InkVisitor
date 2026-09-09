import React from "react";
import {
  Button,
  ButtonGroup,
  IcoWarning,
  Input,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalInputForm,
  ModalInputLabel,
  ModalInputWrap,
} from "dissinet.ddb.client";

export const Default = () => (
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

export const WithForm = () => (
  <Modal showModal width="normal" onClose={() => {}}>
    <ModalHeader title="Create entity" onClose={() => {}} />
    <ModalContent column>
      <ModalInputForm>
        <ModalInputLabel>Label</ModalInputLabel>
        <ModalInputWrap>
          <Input value="Council of Trent" onChangeFn={() => {}} width="full" />
        </ModalInputWrap>
        <ModalInputLabel>Detail</ModalInputLabel>
        <ModalInputWrap>
          <Input
            type="textarea"
            value="Ecumenical council held between 1545 and 1563."
            onChangeFn={() => {}}
            width="full"
            rows={3}
          />
        </ModalInputWrap>
      </ModalInputForm>
    </ModalContent>
    <ModalFooter>
      <ButtonGroup>
        <Button label="Cancel" color="greyer" onClick={() => {}} />
        <Button label="Create" color="primary" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);

export const Warning = () => (
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
