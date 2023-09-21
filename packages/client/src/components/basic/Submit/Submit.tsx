import { IEntity } from "@shared/types";
import {
  Button,
  ButtonGroup,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { EntityTag } from "components/advanced";
import React from "react";

interface Submit {
  title?: string;
  text?: string;
  entityToSubmit?: IEntity;
  show: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
}
export const Submit: React.FC<Submit> = ({
  title,
  text,
  entityToSubmit,
  show,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = "Submit",
}) => {
  return (
    <>
      <Modal
        onEnterPress={onSubmit}
        onClose={onCancel}
        showModal={show}
        disableBgClick
        isLoading={loading}
      >
        <ModalHeader title={title} />
        <ModalContent>
          <p>
            {text} {entityToSubmit && <EntityTag entity={entityToSubmit} />}
          </p>
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <Button label="Cancel" color="info" onClick={onCancel} />
            <Button label={submitLabel} color="danger" onClick={onSubmit} />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </>
  );
};
