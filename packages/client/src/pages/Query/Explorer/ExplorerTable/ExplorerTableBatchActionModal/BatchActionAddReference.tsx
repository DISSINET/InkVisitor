import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { useMutation } from "@tanstack/react-query";
import api from "api";
import {
  Button,
  ButtonGroup,
  CancelButton,
  Input,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { EntityDropzone, EntitySuggester, EntityTag } from "components/advanced";
import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  BatchActionApplyConfirm,
  needsBatchActionConfirm,
} from "./BatchActionApplyConfirm";
import {
  StyledBatchMessage,
  StyledBatchSection,
  StyledBatchSectionLabel,
  StyledBatchWrapper,
} from "./styles";

interface BatchActionAddReferenceProps {
  selectedEntityIds: string[];
  onClose: () => void;
  onApply: () => void;
}

export const BatchActionAddReference: React.FC<
  BatchActionAddReferenceProps
> = ({ selectedEntityIds, onClose, onApply }) => {
  const [resourceEntity, setResourceEntity] = useState<IEntity | undefined>();
  const [valueLabel, setValueLabel] = useState<string>("");

  const batchMutation = useMutation({
    mutationFn: async () => {
      if (!resourceEntity) return;
      return api.batchEntityAddReference(
        selectedEntityIds,
        resourceEntity.id,
        valueLabel.trim() || undefined
      );
    },
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Reference added");
      onApply();
    },
    onError: () => {
      toast.error("Failed to add reference");
    },
  });

  const [showConfirm, setShowConfirm] = useState(false);

  const executeApply = () => {
    batchMutation.mutate();
  };

  const handleApply = () => {
    if (!resourceEntity) return;
    if (needsBatchActionConfirm(selectedEntityIds.length)) {
      setShowConfirm(true);
      return;
    }
    executeApply();
  };

  const message = useMemo<string>(() => {
    const count = selectedEntityIds.length;
    const resLabel = resourceEntity?.labels[0];
    const valLabel = valueLabel.trim();

    if (!resLabel) {
      return `Add a new reference to ${count} selected entities.`;
    }
    if (valLabel) {
      return `Add reference "${resLabel}" to ${count} selected entities, each with a new value "${valLabel}".`;
    }
    return `Add reference "${resLabel}" to ${count} selected entities.`;
  }, [resourceEntity, valueLabel, selectedEntityIds.length]);

  return (
    <>
    <Modal
      showModal
      onClose={onClose}
      width="fat"
      isLoading={batchMutation.isPending}
    >
      <ModalHeader
        title={`Add Reference (${selectedEntityIds.length} entities)`}
        onClose={onClose}
      />
      <ModalContent column enableScroll>
        <StyledBatchWrapper>
          <StyledBatchSection>
            <StyledBatchSectionLabel>
              Resource (required)
            </StyledBatchSectionLabel>
            {resourceEntity ? (
              <EntityTag
                entity={resourceEntity}
                unlinkButton={{ onClick: () => setResourceEntity(undefined) }}
              />
            ) : (
              <EntitySuggester
                categoryTypes={[EntityEnums.Class.Resource]}
                onPicked={(entity) => setResourceEntity(entity)}
                placeholder="select resource..."
                inputWidth="full"
              />
            )}
          </StyledBatchSection>

          <StyledBatchSection>
            <StyledBatchSectionLabel>Value (optional)</StyledBatchSectionLabel>
            {/* the label alone travels to the server, which gives every entity
                in the batch a V of its own; dropping a V tag here fills the
                field from its label and links nothing */}
            <EntityDropzone
              categoryTypes={[EntityEnums.Class.Value]}
              reuseDroppedValue
              onSelected={() => {}}
              onPicked={(entity) => setValueLabel(entity.labels[0] ?? "")}
            >
              <Input
                width="full"
                value={valueLabel}
                changeOnType
                onChangeFn={(value) => setValueLabel(value)}
                placeholder="new value for each entity..."
              />
            </EntityDropzone>
          </StyledBatchSection>

          <StyledBatchMessage>{message}</StyledBatchMessage>
        </StyledBatchWrapper>
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <CancelButton onClick={onClose} />
          <Button
            label="Apply"
            color="primary"
            onClick={handleApply}
            disabled={!resourceEntity || batchMutation.isPending}
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
    <BatchActionApplyConfirm
      kind="reference"
      entityCount={selectedEntityIds.length}
      show={showConfirm}
      loading={batchMutation.isPending}
      onConfirm={() => {
        setShowConfirm(false);
        executeApply();
      }}
      onCancel={() => setShowConfirm(false)}
    />
    </>
  );
};
