import {
  Button,
  ButtonGroup,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import React, { useEffect, useState } from "react";
import { FaToggleOff, FaToggleOn } from "react-icons/fa";

interface GlobalValidationsModal {
  setShowGlobalValidations: React.Dispatch<React.SetStateAction<boolean>>;
}
export const GlobalValidationsModal: React.FC<GlobalValidationsModal> = ({
  setShowGlobalValidations,
}) => {
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    setShowModal(true);
  }, []);

  const [superclassMissing, setSuperclassMissing] = useState(true);
  const [missinActionEventEquivalent, setMissinActionEventEquivalent] =
    useState(true);

  return (
    <Modal
      showModal={showModal}
      onClose={() => setShowGlobalValidations(false)}
    >
      <ModalHeader title="Global validations" />
      <ModalContent>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto auto",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "grid",
              justifyContent: "end",
            }}
          >
            Superclass missing
          </div>
          <div
            style={{ cursor: "pointer" }}
            onClick={() => setSuperclassMissing(!superclassMissing)}
          >
            {superclassMissing ? (
              <FaToggleOn size={22} />
            ) : (
              <FaToggleOff size={22} />
            )}
          </div>
          <div
            style={{
              display: "grid",
              justifyContent: "end",
              alignItems: "center",
            }}
          >
            Missing Action/event equivalent
          </div>
          <div
            style={{ cursor: "pointer" }}
            onClick={() =>
              setMissinActionEventEquivalent(!missinActionEventEquivalent)
            }
          >
            {missinActionEventEquivalent ? (
              <FaToggleOn size={22} />
            ) : (
              <FaToggleOff size={22} />
            )}
          </div>
        </div>
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button
            color="warning"
            label="cancel"
            onClick={() => setShowGlobalValidations(false)}
          />
          <Button color="primary" label="submit" />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
