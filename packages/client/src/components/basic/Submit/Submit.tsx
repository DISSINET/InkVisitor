import { IEntity } from "@inkvisitor/shared/types";
import { Button, ButtonGroup, Modal, ModalContent, ModalFooter, ModalHeader } from "components";
import { EntityTag } from "components/advanced";
import React from "react";
import { StyledSubmitContent, StyledSubmitText } from "./SubmitStyles";

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
  submitLabel = "Confirm",
}) => {
  return (
    <>
      <Modal
        onEnterPress={onSubmit}
        onClose={onCancel}
        showModal={show}
        disableBgClick
        isLoading={loading}
        width="auto"
        maxWidth={600}
      >
        <ModalHeader title={title} />
        <ModalContent>
          <StyledSubmitContent>
            <StyledSubmitText>{text}</StyledSubmitText>
            {entityToSubmit && (
              <EntityTag entity={entityToSubmit} disableDoubleClick disableDrag fullWidth />
            )}
          </StyledSubmitContent>
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <Button
              label="Cancel"
              color="greyer"
              inverted
              noBackground
              noBorder
              onClick={onCancel}
            />
            <Button
              label={submitLabel}
              color="danger"
              onClick={onSubmit}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </>
  );
};
