import { EntityEnums } from "@shared/enums";
import {
  Button,
  ButtonGroup,
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
      <Modal showModal={showModal} width="thin" onClose={onClose}>
        <ModalHeader title="Select parent territory" />
        <ModalContent>
          <EntitySuggester
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
            <Button
              key="cancel"
              label="Cancel"
              color="greyer"
              inverted
              onClick={onClose}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </>
  );
};
