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

export const Centered = () => (
  <Modal showModal width="normal" onClose={() => {}}>
    <ModalHeader title="Create territory" onClose={() => {}} />
    <ModalContent column>
      <ModalInputForm>
        <ModalInputLabel>Label</ModalInputLabel>
        <ModalInputWrap>
          <Input value="Council of Trent" onChangeFn={() => {}} width="full" />
        </ModalInputWrap>
        <ModalInputLabel>Parent</ModalInputLabel>
        <ModalInputWrap>
          <Input value="Papal territories" onChangeFn={() => {}} width="full" />
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

export const AlignLeft = () => (
  <Modal showModal width="normal" onClose={() => {}}>
    <ModalHeader title="Edit entity" onClose={() => {}} />
    <ModalContent column>
      <ModalInputForm alignLeft>
        <ModalInputLabel>Label</ModalInputLabel>
        <ModalInputWrap>
          <Input value="Charles V" onChangeFn={() => {}} width="full" />
        </ModalInputWrap>
        <ModalInputLabel>Detail</ModalInputLabel>
        <ModalInputWrap>
          <Input
            type="textarea"
            value="Holy Roman Emperor, ruled 1519-1556, presided over the political backdrop of the Council of Trent."
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
        <Button label="Save" color="primary" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);
