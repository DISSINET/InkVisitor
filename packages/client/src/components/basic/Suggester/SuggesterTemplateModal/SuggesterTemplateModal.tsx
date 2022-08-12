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
  onDuplicate: () => void;
}
export const SuggesterTemplateModal: React.FC<SuggesterTemplateModal> = ({
  onClose,
  onUse,
  onDuplicate,
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
          <Button label="Duplicate to entity" onClick={onDuplicate} />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
