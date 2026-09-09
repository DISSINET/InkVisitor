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

export const Default = () => (
  <Modal showModal width="auto" onClose={() => {}}>
    <ModalHeader title="Remove territory" onClose={() => {}} />
    <ModalContent>
      This will unassign "Council of Trent" from its parent territory. The
      territory itself is kept.
    </ModalContent>
    <ModalFooter>
      <ButtonGroup>
        <Button label="Cancel" color="greyer" onClick={() => {}} />
        <Button label="Remove" color="danger" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);

export const Column = () => (
  <Modal showModal width="normal" onClose={() => {}}>
    <ModalHeader title="Create entity" onClose={() => {}} />
    <ModalContent column>
      <ModalInputForm>
        <ModalInputLabel>Label</ModalInputLabel>
        <ModalInputWrap>
          <Input value="Charles V" onChangeFn={() => {}} width="full" />
        </ModalInputWrap>
        <ModalInputLabel>Detail</ModalInputLabel>
        <ModalInputWrap>
          <Input
            type="textarea"
            value="Holy Roman Emperor, 1519-1556."
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

export const Centered = () => (
  <Modal showModal width="normal" fullHeight onClose={() => {}}>
    <ModalHeader title="No results" onClose={() => {}} />
    <ModalContent centered>
      No statements matched "Trent 1560" in this territory.
    </ModalContent>
    <ModalFooter>
      <ButtonGroup>
        <Button label="Close" color="greyer" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);

export const EnableScroll = () => (
  <Modal showModal width="normal" fullHeight onClose={() => {}}>
    <ModalHeader title="Session participants" onClose={() => {}} />
    <ModalContent column enableScroll>
      {[
        "Pope Paul III",
        "Charles V, Holy Roman Emperor",
        "Cardinal Reginald Pole",
        "Cardinal Giovanni Morone",
        "Diego Laínez",
        "Melchior Cano",
        "Girolamo Seripando",
        "Bishop of Trent, Cristoforo Madruzzo",
        "Papal legate Marcello Cervini",
        "Jesuit theologian Alfonso Salmerón",
      ].map((name) => (
        <div key={name} style={{ padding: "0.4rem 0" }}>
          {name}
        </div>
      ))}
    </ModalContent>
    <ModalFooter>
      <ButtonGroup>
        <Button label="Close" color="greyer" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);

export const Loading = () => (
  <Modal showModal width="normal" onClose={() => {}}>
    <ModalHeader title="Fetching territory tree" onClose={() => {}} />
    <ModalContent isLoading>
      Loading the territory hierarchy beneath "Council of Trent"...
    </ModalContent>
    <ModalFooter>
      <ButtonGroup>
        <Button label="Cancel" color="greyer" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);
