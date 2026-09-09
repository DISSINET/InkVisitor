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

export const AutoWidth = () => (
  <Modal showModal width="normal" onClose={() => {}}>
    <ModalHeader title="Filter statements" onClose={() => {}} />
    <ModalContent column>
      <ModalInputForm>
        <ModalInputLabel>Territory</ModalInputLabel>
        <ModalInputWrap>
          <Input value="Council of Trent" onChangeFn={() => {}} width="full" />
        </ModalInputWrap>
      </ModalInputForm>
    </ModalContent>
    <ModalFooter>
      <ButtonGroup>
        <Button label="Cancel" color="greyer" onClick={() => {}} />
        <Button label="Apply" color="primary" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);

export const FixedWidth = () => (
  <Modal showModal width="normal" onClose={() => {}}>
    <ModalHeader title="Set date range" onClose={() => {}} />
    <ModalContent column>
      <ModalInputForm alignLeft>
        <ModalInputLabel>From</ModalInputLabel>
        <ModalInputWrap width={120}>
          <Input value="1545" onChangeFn={() => {}} width="full" />
        </ModalInputWrap>
        <ModalInputLabel>To</ModalInputLabel>
        <ModalInputWrap width={120}>
          <Input value="1563" onChangeFn={() => {}} width="full" />
        </ModalInputWrap>
      </ModalInputForm>
    </ModalContent>
    <ModalFooter>
      <ButtonGroup>
        <Button label="Cancel" color="greyer" onClick={() => {}} />
        <Button label="Apply" color="primary" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);
