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

export const BATCH_ACTION_CONFIRM_THRESHOLD = 10;

export type BatchApplyKind = "metaproperty" | "reference" | "relation";

export const needsBatchActionConfirm = (entityCount: number): boolean =>
  entityCount > BATCH_ACTION_CONFIRM_THRESHOLD;

interface BatchActionApplyConfirmProps {
  kind: BatchApplyKind;
  entityCount: number;
  show: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const BatchActionApplyConfirm: React.FC<BatchActionApplyConfirmProps> = ({
  kind,
  entityCount,
  show,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      showModal={show}
      onClose={onCancel}
      onEnterPress={onConfirm}
      disableBgClick
      isLoading={loading}
      width="auto"
    >
      <ModalHeader title="Confirm" />
      <ModalContent>
        {`You are about to add a new ${kind} to ${entityCount} entities. Are you sure?`}
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <CancelButton onClick={onCancel} />
          <Button
            label="Add"
            color="primary"
            onClick={onConfirm}
            disabled={loading}
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
