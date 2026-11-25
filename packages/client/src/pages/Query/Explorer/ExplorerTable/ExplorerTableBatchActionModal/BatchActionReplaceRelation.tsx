import { RelationEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import api from "api";
import {
  Button,
  ButtonGroup,
  CancelButton,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import Dropdown, { EntitySuggester, EntityTag } from "components/advanced";
import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  BatchReplaceRun,
  batchReplaceToast,
  createBatchReplaceRun,
  relationReplaceLines,
} from "./batchReplace";
import { BatchReplaceConfirm } from "./BatchReplaceConfirm";
import {
  StyledBatchSection,
  StyledBatchSectionLabel,
  StyledBatchWrapper,
} from "./styles";
import { getRelationLabel, relationTargetClasses } from "./utils";

interface BatchActionReplaceRelation {
  selectedEntityIds: string[];
  onClose: () => void;
  /** closes the modal and refetches; called after every save attempt */
  onApply: () => void;
  onClearSelection: () => void;
}

/** what Apply sent as a dry run; the save sends the same ids and fields */
interface ConfirmedRun {
  run: BatchReplaceRun;
  relationType: RelationEnums.Type;
  fromEntityId: string;
  toEntityId: string;
  selectedCount: number;
}

interface Confirmation {
  headline: string;
  notes: string[];
  canConfirm: boolean;
}

const relationOptions = RelationEnums.BatchTypes.map((type) => ({
  value: type,
  label: getRelationLabel(type),
}));

export const BatchActionReplaceRelation: React.FC<BatchActionReplaceRelation> = ({
  selectedEntityIds,
  onClose,
  onApply,
  onClearSelection,
}) => {
  const [relationType, setRelationType] = useState<RelationEnums.Type | undefined>();
  const [fromEntity, setFromEntity] = useState<IEntity | undefined>();
  const [toEntity, setToEntity] = useState<IEntity | undefined>();
  const [confirmedRun, setConfirmedRun] = useState<ConfirmedRun | undefined>();
  const [confirmation, setConfirmation] = useState<Confirmation | undefined>();
  const [pending, setPending] = useState(false);

  const targetClasses = useMemo(() => relationTargetClasses(relationType), [relationType]);

  const call =
    (request: ConfirmedRun, dryRun?: boolean) =>
    async (ids: string[]) =>
      (
        await api.batchEntityReplaceRelation({
          entityIds: ids,
          relationType: request.relationType,
          fromEntityId: request.fromEntityId,
          toEntityId: request.toEntityId,
          dryRun,
        })
      ).data;

  const handleClose = () => {
    if (!pending) onClose();
  };

  const handleApply = async () => {
    if (!relationType || !fromEntity || !toEntity) return;
    const request: ConfirmedRun = {
      run: createBatchReplaceRun(selectedEntityIds),
      relationType,
      fromEntityId: fromEntity.id,
      toEntityId: toEntity.id,
      selectedCount: selectedEntityIds.length,
    };
    setConfirmedRun(request);
    setPending(true);
    const outcome = await request.run.run(call(request, true));
    setPending(false);
    if (!outcome) return;
    if (outcome.error !== undefined) {
      toast.error("Could not check the selection");
      return;
    }
    setConfirmation(
      relationReplaceLines(outcome.total, {
        type: getRelationLabel(relationType),
        from: fromEntity.labels[0],
        to: toEntity.labels[0],
      }),
    );
  };

  const handleConfirm = async () => {
    if (!confirmedRun) return;
    setPending(true);
    const outcome = await confirmedRun.run.run(call(confirmedRun));
    setPending(false);
    if (!outcome) return;
    const message = batchReplaceToast(outcome, confirmedRun.selectedCount);
    if (outcome.error === undefined && outcome.total.failed === 0) {
      toast.success(message);
      onClearSelection();
    } else {
      toast.warning(message);
    }
    onApply();
  };

  return (
    <>
      <Modal
        showModal
        onClose={handleClose}
        width="fat"
        isLoading={pending}
        disableEscapeClose={pending}
      >
        <ModalHeader
          title={`Replace relation (${selectedEntityIds.length} entities)`}
          onClose={handleClose}
        />
        <ModalContent column enableScroll>
          <StyledBatchWrapper>
            <StyledBatchSection>
              <StyledBatchSectionLabel>Relation type</StyledBatchSectionLabel>
              <Dropdown.Single.Basic
                value={relationType || null}
                options={relationOptions}
                onChange={(value) => {
                  setRelationType(value as RelationEnums.Type);
                  setFromEntity(undefined);
                  setToEntity(undefined);
                }}
                placeholder="select relation type"
                width="full"
              />
            </StyledBatchSection>

            <StyledBatchSection>
              <StyledBatchSectionLabel>Current target</StyledBatchSectionLabel>
              {fromEntity ? (
                <EntityTag
                  entity={fromEntity}
                  unlinkButton={{ onClick: () => setFromEntity(undefined) }}
                  fullWidth
                />
              ) : (
                <EntitySuggester
                  onPicked={setFromEntity}
                  placeholder="select current target"
                  inputWidth="full"
                  categoryTypes={targetClasses}
                  reuseDroppedValue
                  disableCreate
                  disableTemplateInstantiation
                  disabled={!relationType}
                />
              )}
            </StyledBatchSection>

            <StyledBatchSection>
              <StyledBatchSectionLabel>Replace with</StyledBatchSectionLabel>
              {toEntity ? (
                <EntityTag
                  entity={toEntity}
                  unlinkButton={{ onClick: () => setToEntity(undefined) }}
                  fullWidth
                />
              ) : (
                <EntitySuggester
                  onPicked={setToEntity}
                  placeholder="select new target"
                  inputWidth="full"
                  categoryTypes={targetClasses}
                  reuseDroppedValue
                  disableTemplatesAccept
                  disabled={!relationType}
                />
              )}
            </StyledBatchSection>
          </StyledBatchWrapper>
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <CancelButton onClick={handleClose} />
            <Button
              label="Apply"
              color="primary"
              onClick={handleApply}
              disabled={
                !relationType || !fromEntity || !toEntity || fromEntity.id === toEntity.id || pending
              }
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
      <BatchReplaceConfirm
        show={!!confirmation}
        headline={confirmation?.headline ?? ""}
        notes={confirmation?.notes ?? []}
        canConfirm={confirmation?.canConfirm ?? false}
        loading={pending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmation(undefined)}
      />
    </>
  );
};
