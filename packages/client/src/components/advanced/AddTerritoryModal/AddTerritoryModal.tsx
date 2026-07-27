import { EntityEnums } from "@inkvisitor/shared/enums";
import {
  Button,
  ButtonGroup,
  CancelButton,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import React, { useEffect, useState } from "react";
import { EntitySuggester } from "..";

interface AddTerritoryModal {
  onClose: () => void;
  onSubmit: (territoryId: string) => void;
}
export const AddTerritoryModal: React.FC<AddTerritoryModal> = ({
  onClose,
  onSubmit,
}) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setShowModal(true);
  }, []);

  return (
    <>
      <Modal showModal={showModal} width="auto" onClose={onClose}>
        <ModalHeader title="Select parent territory" />
        <ModalContent>
          <EntitySuggester
            autoFocus
            disableTemplatesAccept
            filterEditorRights
            inputWidth={96}
            disableCreate
            categoryTypes={[EntityEnums.Class.Territory]}
            onSelected={(newSelectedId: string) => {
              onSubmit(newSelectedId);
            }}
          />
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <CancelButton key="cancel" onClick={onClose} />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </>
  );
};
