import React, { useCallback, useEffect, useRef, useState } from "react";
import api from "api";
import {
  Button,
  ButtonGroup,
  Input,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { StyledAdministrationModalWrapper } from "./UserAdministrationModalStyles";

export const UserAdministrationModal: React.FC = () => {
  return (
    <Modal showModal disableBgClick inverted width="thin">
      <ModalHeader title={"User Log In"} />
      <ModalContent>
        <StyledAdministrationModalWrapper></StyledAdministrationModalWrapper>
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button label="Log In" color="danger" onClick={() => {}} />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
