import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { useMutation } from "@tanstack/react-query";
import api from "api";
import {
  Button,
  ButtonGroup,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
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
  const [valueEntity, setValueEntity] = useState<IEntity | undefined>();

  const batchMutation = useMutation({
    mutationFn: async () => {
      if (!resourceEntity) return;
      return api.batchEntityAddReference(
        selectedEntityIds,
        resourceEntity.id,
        valueEntity?.id
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
    const valLabel = valueEntity?.labels[0];

    if (!resLabel) {
      return `Add a new reference to ${count} selected entities.`;
    }
    if (valLabel) {
      return `Add reference "${resLabel}" with value "${valLabel}" to ${count} selected entities.`;
    }
    return `Add reference "${resLabel}" to ${count} selected entities.`;
  }, [resourceEntity, valueEntity, selectedEntityIds.length]);

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
            {valueEntity ? (
              <EntityTag
                entity={valueEntity}
                unlinkButton={{ onClick: () => setValueEntity(undefined) }}
              />
            ) : (
              <EntitySuggester
                categoryTypes={[EntityEnums.Class.Value]}
                onPicked={(entity) => setValueEntity(entity)}
                placeholder="select value..."
                inputWidth="full"
              />
            )}
          </StyledBatchSection>

          <StyledBatchMessage>{message}</StyledBatchMessage>
        </StyledBatchWrapper>
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button
            label="Cancel"
            color="greyer"
            inverted
            noBackground
            noBorder
            onClick={onClose}
          />
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
