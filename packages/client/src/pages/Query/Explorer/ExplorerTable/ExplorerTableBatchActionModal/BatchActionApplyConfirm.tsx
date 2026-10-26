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

export type BatchApplyKind =
  | "metaproperty"
  | "reference"
  | "relation"
  | "label language"
  | "part of speech";

/** first half of "You are about to ... N entities" */
const confirmPhrase: Record<BatchApplyKind, string> = {
  metaproperty: "add a new metaproperty to",
  reference: "add a new reference to",
  relation: "add a new relation to",
  "label language": "set the label language of",
  "part of speech": "set the part of speech of",
};

/** label of the confirming button */
const confirmLabel: Record<BatchApplyKind, string> = {
  metaproperty: "Add",
  reference: "Add",
  relation: "Add",
  "label language": "Set",
  "part of speech": "Set",
};

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
        {`You are about to ${confirmPhrase[kind]} ${entityCount} entities. Are you sure?`}
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <CancelButton onClick={onCancel} />
          <Button
            label={confirmLabel[kind]}
            color="primary"
            onClick={onConfirm}
            disabled={loading}
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
