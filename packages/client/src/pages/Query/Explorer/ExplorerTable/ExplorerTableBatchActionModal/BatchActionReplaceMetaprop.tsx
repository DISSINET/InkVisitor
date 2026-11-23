import { MAX_BATCH_REPLACE_METAPROP_ENTITIES } from "@inkvisitor/shared/constants";
import { classesAll } from "@inkvisitor/shared/dictionaries/entity";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import api from "api";
import {
  Button,
  ButtonGroup,
  CancelButton,
  Checkbox,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { classesPropType } from "types";
import {
  BatchReplaceRun,
  batchReplaceToast,
  createBatchReplaceRun,
  metapropReplaceLines,
  rowsLeftSelected,
} from "./batchReplace";
import { BatchReplaceConfirm } from "./BatchReplaceConfirm";
import {
  StyledBatchSection,
  StyledBatchSectionLabel,
  StyledBatchWrapper,
} from "./styles";

interface BatchActionReplaceMetaprop {
  selectedEntityIds: string[];
  onClose: () => void;
  /** closes the modal and refetches; called after every save attempt */
  onApply: () => void;
  onClearSelection: () => void;
  /** replaces the selection with these ids */
  onSelectOnly: (ids: string[]) => void;
}

/** what Apply sent as a dry run; the save sends the same ids and fields */
interface ConfirmedRun {
  run: BatchReplaceRun;
  typeEntityId: string;
  fromValueEntityId: string;
  toValueEntityId: string;
  selectedCount: number;
}

interface Confirmation {
  headline: string;
  notes: string[];
  canConfirm: boolean;
}

/** a Value belongs to one entity: linked from every changed row, a later rename
 * of it would show on all of them, so the server refuses it as the new value */
const newValueClasses = classesAll.filter((c) => c !== EntityEnums.Class.Value);

export const BatchActionReplaceMetaprop: React.FC<BatchActionReplaceMetaprop> = ({
  selectedEntityIds,
  onClose,
  onApply,
  onClearSelection,
  onSelectOnly,
}) => {
  const [typeEntity, setTypeEntity] = useState<IEntity | undefined>();
  // "" is the empty value, undefined is nothing picked
  const [fromValue, setFromValue] = useState<IEntity | "" | undefined>();
  const [toEntity, setToEntity] = useState<IEntity | undefined>();
  const [confirmedRun, setConfirmedRun] = useState<ConfirmedRun | undefined>();
  const [confirmation, setConfirmation] = useState<Confirmation | undefined>();
  const [pending, setPending] = useState(false);

  const call =
    (request: ConfirmedRun, dryRun?: boolean) =>
    async (ids: string[]) =>
      (
        await api.batchEntityReplaceMetaprop({
          entityIds: ids,
          typeEntityId: request.typeEntityId,
          fromValueEntityId: request.fromValueEntityId,
          toValueEntityId: request.toValueEntityId,
          dryRun,
        })
      ).data;

  const handleClose = () => {
    if (!pending) onClose();
  };

  const handleApply = async () => {
    if (!typeEntity || fromValue === undefined || !toEntity) return;
    const request: ConfirmedRun = {
      run: createBatchReplaceRun(selectedEntityIds, MAX_BATCH_REPLACE_METAPROP_ENTITIES),
      typeEntityId: typeEntity.id,
      fromValueEntityId: fromValue === "" ? "" : fromValue.id,
      toValueEntityId: toEntity.id,
      selectedCount: selectedEntityIds.length,
    };
    setPending(true);
    const outcome = await request.run.run(call(request, true));
    setPending(false);
    if (!outcome) return;
    if (outcome.error !== undefined) {
      toast.error("Could not check the selection");
      return;
    }
    setConfirmedRun(request);
    setConfirmation(
      metapropReplaceLines(outcome.total, {
        type: typeEntity.labels[0],
        from: fromValue === "" ? null : fromValue.labels[0],
        to: toEntity.labels[0],
      }),
    );
  };

  const handleConfirm = async () => {
    if (!confirmedRun) return;
    setPending(true);
    const outcome = await confirmedRun.run.run(call(confirmedRun));
    // the run answers null while another run of it is pending, and that run
    // still owns `pending`
    if (!outcome) return;
    setPending(false);
    const message = batchReplaceToast(outcome, confirmedRun.selectedCount);
    if (outcome.error === undefined && outcome.total.skipped === 0 && outcome.total.failed === 0) {
      toast.success(message);
    } else {
      toast.warning(message);
    }
    const leftSelected = rowsLeftSelected(outcome);
    if (leftSelected !== null) {
      if (leftSelected.length === 0) {
        onClearSelection();
      } else {
        onSelectOnly(leftSelected);
      }
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
          title={`Replace metaproperty (${selectedEntityIds.length} entities)`}
          onClose={handleClose}
        />
        <ModalContent column enableScroll>
          <StyledBatchWrapper>
            <StyledBatchSection>
              <StyledBatchSectionLabel>Property type</StyledBatchSectionLabel>
              {typeEntity ? (
                <EntityTag
                  entity={typeEntity}
                  unlinkButton={{ onClick: () => setTypeEntity(undefined) }}
                  fullWidth
                />
              ) : (
                <EntitySuggester
                  onPicked={setTypeEntity}
                  placeholder="select property type"
                  inputWidth="full"
                  categoryTypes={classesPropType}
                  reuseDroppedValue
                  disableCreate
                />
              )}
            </StyledBatchSection>

            <StyledBatchSection>
              <StyledBatchSectionLabel>Current value</StyledBatchSectionLabel>
              {fromValue !== undefined && fromValue !== "" ? (
                <EntityTag
                  entity={fromValue}
                  unlinkButton={{ onClick: () => setFromValue(undefined) }}
                  fullWidth
                />
              ) : (
                <>
                  {fromValue === undefined && (
                    <EntitySuggester
                      onPicked={setFromValue}
                      placeholder="select current value"
                      inputWidth="full"
                      categoryTypes={classesAll}
                      reuseDroppedValue
                      disableCreate
                    />
                  )}
                  <Checkbox
                    value={fromValue === ""}
                    label="(empty)"
                    onChangeFn={(empty) => setFromValue(empty ? "" : undefined)}
                  />
                </>
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
                  placeholder="select new value"
                  inputWidth="full"
                  categoryTypes={newValueClasses}
                  reuseDroppedValue
                  disableTemplatesAccept
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
                pending ||
                !typeEntity ||
                fromValue === undefined ||
                !toEntity ||
                (fromValue !== "" && fromValue.id === toEntity.id)
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
