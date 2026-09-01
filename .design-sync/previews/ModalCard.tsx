import React from "react";
import {
  Button,
  ButtonGroup,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "dissinet.ddb.client";

// ModalCard is the animated dialog shell Modal renders internally — its own
// props are width/fullHeight/noBorder, so the parts inside stay constant
// while those vary. Modal always mounts one; we cannot import ModalCard
// standalone and set animatedMount by hand meaningfully, so we drive it via
// Modal's matching props (width, fullHeight, noBorder) exactly as the app
// does.

export const NormalWidth = () => (
  <Modal showModal width="normal" onClose={() => {}}>
    <ModalHeader title="Edit statement" onClose={() => {}} />
    <ModalContent>
      Update the wording of this statement before it is attached to the
      territory "Council of Trent".
    </ModalContent>
    <ModalFooter>
      <ButtonGroup>
        <Button label="Cancel" color="greyer" onClick={() => {}} />
        <Button label="Save" color="primary" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);

export const FatWidth = () => (
  <Modal showModal width="fat" onClose={() => {}}>
    <ModalHeader title="Global validations" boldTitle onClose={() => {}} />
    <ModalContent column>
      A wide card gives long validation tables room to breathe without
      wrapping every column onto its own line.
    </ModalContent>
    <ModalFooter>
      <ButtonGroup>
        <Button label="Done" color="primary" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);

export const FullHeightNoBorder = () => (
  <Modal
    showModal
    width="normal"
    fullHeight
    noBorder
    onClose={() => {}}
  >
    <ModalHeader title="Import Charles V correspondence" onClose={() => {}} />
    <ModalContent column enableScroll>
      Dropping the border in favor of a shadow suits a card whose content
      bleeds to the edge, and stretching it to full height keeps a long
      scrollable import log fully in view.
    </ModalContent>
    <ModalFooter>
      <ButtonGroup>
        <Button label="Cancel" color="greyer" onClick={() => {}} />
        <Button label="Import" color="primary" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);

export const Loading = () => (
  <Modal showModal width="normal" isLoading onClose={() => {}}>
    <ModalHeader title="Applying template" onClose={() => {}} />
    <ModalContent>
      Instantiating the "Council of Trent session" template across the
      selected territory.
    </ModalContent>
    <ModalFooter>
      <ButtonGroup>
        <Button label="Cancel" color="greyer" onClick={() => {}} />
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);
