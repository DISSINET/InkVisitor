import { IEntity } from "@shared/types";
import {
  Button,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { EntityTag } from "components/advanced";
import React, { useEffect, useState } from "react";
import { TfiLayoutAccordionList } from "react-icons/tfi";

interface SegmentateReferencesModal {
  managedTerritory: IEntity;
  onClose: () => void;
}
export const SegmentateReferencesModal: React.FC<SegmentateReferencesModal> = ({
  managedTerritory,
  onClose,
}) => {
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    setShowModal(true);
  }, []);

  return (
    <Modal showModal={showModal} onClose={onClose}>
      <ModalHeader
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <p style={{ marginRight: "0.5rem" }}>Manage Territory References</p>
            <EntityTag entity={managedTerritory} />
          </div>
        }
      />
      <ModalContent column>
        <div>
          <Button
            label="Apply segmentation"
            icon={<TfiLayoutAccordionList />}
          />
        </div>
      </ModalContent>
      <ModalFooter>
        <Button color="warning" label="Close" onClick={onClose} />
      </ModalFooter>
    </Modal>
  );
};
