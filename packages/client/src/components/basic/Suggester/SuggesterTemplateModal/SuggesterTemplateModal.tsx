import {
  Button,
  ButtonGroup,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import React, { useEffect, useState } from "react";

interface SuggesterTemplateModal {
  onClose: () => void;
  onUse: () => void;
  onInstantiate: () => void;
}
export const SuggesterTemplateModal: React.FC<SuggesterTemplateModal> = ({
  onClose,
  onUse,
  onInstantiate,
}) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setShowModal(true);
  }, []);

  return (
    <Modal showModal={showModal}>
      <ModalHeader title="Template actions" />
      <ModalContent>Select template action..</ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button label="Cancel" color="warning" onClick={onClose} />
          <Button label="Use template" color="success" onClick={onUse} />
          <Button label="Instantiate template" onClick={onInstantiate} />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
