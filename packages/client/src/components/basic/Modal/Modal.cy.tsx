import React from "react";
import { Modal, ModalContent, ModalFooter, ModalHeader } from "./Modal";

describe("<Modal />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(
      <Modal showModal width="thin">
        <ModalHeader title={"Modal title"} />
        <ModalContent>Lorem ipsum dolor sit amet.</ModalContent>
        <ModalFooter>buttons</ModalFooter>
      </Modal>
    );
  });
});
