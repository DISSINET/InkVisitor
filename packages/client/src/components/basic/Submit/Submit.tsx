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
  entityToSubmit?: IEntity | false;
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
        width="thin"
      >
        <ModalHeader title={title} />
        <ModalContent>
          <div>
            {text}{" "}
            {entityToSubmit && (
              <EntityTag
                entity={entityToSubmit}
                disableDoubleClick
                disableDrag
              />
            )}
          </div>
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
