import {
  Button,
  ButtonGroup,
  CancelButton,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import React from "react";
import { StyledBatchNotes } from "./styles";

interface BatchReplaceConfirm {
  show: boolean;
  headline: string;
  notes: string[];
  canConfirm: boolean;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const BatchReplaceConfirm: React.FC<BatchReplaceConfirm> = ({
  show,
  headline,
  notes,
  canConfirm,
  loading,
  onConfirm,
  onCancel,
}) => {
  const handleCancel = () => {
    if (!loading) onCancel();
  };

  return (
    <Modal
      showModal={show}
      onClose={handleCancel}
      disableEscapeClose={loading}
      onEnterPress={canConfirm ? onConfirm : undefined}
      disableBgClick
      isLoading={loading}
      width="auto"
    >
      <ModalHeader title="Confirm" />
      <ModalContent column>
        {headline}
        {notes.length > 0 && (
          <StyledBatchNotes>
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </StyledBatchNotes>
        )}
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <CancelButton onClick={handleCancel} />
          {canConfirm && (
            <Button label="Replace" color="primary" onClick={onConfirm} disabled={loading} />
          )}
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
