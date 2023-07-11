import { IEntity } from "@shared/types";
import {
  Button,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Table,
} from "components";
import { EntityTag } from "components/advanced";
import React, { useEffect, useMemo, useState } from "react";
import { Column } from "react-table";

interface ManageTerritoryReferencesModal {
  managedTerritory: IEntity;
  onClose: () => void;
}
export const ManageTerritoryReferencesModal: React.FC<
  ManageTerritoryReferencesModal
> = ({ managedTerritory, onClose }) => {
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    setShowModal(true);
  }, []);

  const columns = useMemo<Column<any>[]>(
    () => [
      {
        Header: "Resource",
      },
      {
        Header: "Part",
      },
      {
        Header: "Document",
      },
      {
        Header: "Anchor",
      },
      {
        id: "edit",
      },
    ],
    []
  );

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
        <div style={{ width: "100%" }}>References btn append..</div>
        <Table columns={columns} data={[{}]} disableHeading />
      </ModalContent>
      <ModalFooter>
        <Button color="warning" label="Close" onClick={onClose} />
      </ModalFooter>
    </Modal>
  );
};
