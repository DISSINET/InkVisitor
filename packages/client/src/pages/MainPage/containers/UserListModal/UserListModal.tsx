import React from "react";
import { Button, Modal, 
  ModalHeader,
  ModalContent,
  ModalFooter, Button, ButtonGroup } from "components";


export const UserListModal: React.FC = (props) => {

    return (
    <Modal showModal={props.showModal} onClose={() => props.handler()} >
     <ModalHeader title={"Manage Users"} />
      <ModalContent>
      </ModalContent>
      <ModalFooter>
      <ButtonGroup>
        <Button
          key="close"
          label="Close"
          color="primary"
          inverted
          onClick={() => props.handler()}
        />
      </ButtonGroup>
      </ModalFooter>
    </Modal>
    );
};
