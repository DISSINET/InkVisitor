import { IResponseDocument, IResponseTerritory } from "@shared/types";
import {
  Button,
  Dropdown,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { EntityTag } from "components/advanced";
import React, { useEffect, useState } from "react";
import { TfiLayoutAccordionList } from "react-icons/tfi";
import { DropdownItem, ResourceWithDocument } from "types";

interface SegmentateReferencesModal {
  managedTerritory: IResponseTerritory;
  resourcesWithDocuments: ResourceWithDocument[];
  onClose: () => void;
}
export const SegmentateReferencesModal: React.FC<SegmentateReferencesModal> = ({
  managedTerritory,
  resourcesWithDocuments,
  onClose,
}) => {
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    setShowModal(true);
  }, []);

  const [selectedOption, setSelectedOption] = useState<
    DropdownItem | undefined
  >();

  const [currentDocument, setCurrentDocument] = useState<
    IResponseDocument | false
  >(false);

  const [segmentedStatements, setSegmentedStatements] = useState<string[]>();

  useEffect(() => {
    if (selectedOption) {
      const document = resourcesWithDocuments.find(
        (r) => r.reference.id === selectedOption.value
      )?.document;

      if (document) {
        setCurrentDocument(document);
        const sentences = document.content.split(".");
        const sentencesWithDot = sentences.map(
          (sentence) => sentence.trim() + "."
        );

        setSegmentedStatements(sentencesWithDot);
        console.log(sentencesWithDot);
      }
    }
  }, [selectedOption]);

  const { entities } = managedTerritory;

  const arrayOfDocReference = resourcesWithDocuments
    .filter((obj) => obj.document !== false)
    .map((obj) => {
      return {
        id: obj.reference.id,
        document: obj.document,
        entity: entities[obj.reference.resource],
      };
    });

  return (
    <Modal showModal={showModal} onClose={onClose}>
      <ModalHeader
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <p style={{ marginRight: "0.5rem" }}>Manage Territory References</p>
            <EntityTag entity={managedTerritory} disableDrag />
          </div>
        }
      />
      <ModalContent column>
        <div>
          Resource
          <Dropdown
            width={200}
            onChange={(selectedOption) => setSelectedOption(selectedOption[0])}
            value={selectedOption}
            options={arrayOfDocReference.map((obj) => {
              return { value: obj.id, label: obj.entity.label };
            })}
          />
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
