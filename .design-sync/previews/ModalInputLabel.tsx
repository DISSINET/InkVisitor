import React from "react";
import {
  Button,
  ButtonGroup,
  Input,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalInputForm,
  ModalInputLabel,
  ModalInputWrap,
} from "dissinet.ddb.client";

export const ShortLabel = () => (
  <Modal showModal width="normal" onClose={() => {}}>
    <ModalHeader title="Rename territory" onClose={() => {}} />
    <ModalContent column>
      <ModalInputForm>
        <ModalInputLabel>Label</ModalInputLabel>
        <ModalInputWrap>
          <Input value="Council of Trent" onChangeFn={() => {}} width="full" />
        </ModalInputWrap>
      </ModalInputForm>
    </ModalContent>
    <ModalFooter>
      <ButtonGroup>
        <Button label="Cancel" color="greyer" onClick={() => {}} />
        <Button label="Save" color="primary" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);

export const LongLabel = () => (
  <Modal showModal width="normal" onClose={() => {}}>
    <ModalHeader title="Edit statement" onClose={() => {}} />
    <ModalContent column>
      <ModalInputForm>
        <ModalInputLabel>
          Certainty of attribution
        </ModalInputLabel>
        <ModalInputWrap>
          <Input value="Probable" onChangeFn={() => {}} width="full" />
        </ModalInputWrap>
        <ModalInputLabel>Territory</ModalInputLabel>
        <ModalInputWrap>
          <Input value="Council of Trent" onChangeFn={() => {}} width="full" />
        </ModalInputWrap>
      </ModalInputForm>
    </ModalContent>
    <ModalFooter>
      <ButtonGroup>
        <Button label="Cancel" color="greyer" onClick={() => {}} />
        <Button label="Save" color="primary" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);
