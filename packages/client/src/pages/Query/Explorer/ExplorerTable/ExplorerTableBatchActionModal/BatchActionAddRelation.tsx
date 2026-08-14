import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { IEntity, Relation } from "@inkvisitor/shared/types";
import { useMutation } from "@tanstack/react-query";
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
import { BATCH_RELATION_ELIGIBILITY_KEY, useEntitiesQuery } from "hooks/react-query";
import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { BatchActionApplyConfirm, needsBatchActionConfirm } from "./BatchActionApplyConfirm";
import {
  StyledBatchBodyText,
  StyledBatchDangerText,
  StyledBatchMessage,
  StyledBatchSection,
  StyledBatchSectionLabel,
  StyledBatchSuccessText,
  StyledBatchWarningLabel,
  StyledBatchWarningSection,
  StyledBatchWrapper,
} from "./styles";
import { getRelationLabel, isRelationTypeEligible } from "./utils";

/** Above this count we skip fetching entities for relation-type eligibility UI. */
const RELATION_ELIGIBILITY_FETCH_MAX = 1000;

interface BatchActionAddRelationProps {
  selectedEntityIds: string[];
  onClose: () => void;
  onApply: () => void;
}

export const BatchActionAddRelation: React.FC<BatchActionAddRelationProps> = ({
  selectedEntityIds,
  onClose,
  onApply,
}) => {
  const isLargeSelection = selectedEntityIds.length >= RELATION_ELIGIBILITY_FETCH_MAX;

  const {
    data: fetchedEntities,
    isLoading: isLoadingEntities,
    isError: isEntitiesFetchError,
  } = useEntitiesQuery(BATCH_RELATION_ELIGIBILITY_KEY, selectedEntityIds, {
    enabled: !isLargeSelection,
  });

  const selectedEntities = useMemo<IEntity[]>(() => {
    if (isLargeSelection || !fetchedEntities) return [];
    return fetchedEntities;
  }, [fetchedEntities, isLargeSelection]);

  const entityClasses = useMemo<Set<EntityEnums.Class>>(
    () => new Set(selectedEntities.map((e) => e.class)),
    [selectedEntities],
  );

  const firstValidType = useMemo(() => {
    if (isLargeSelection) {
      return RelationEnums.BatchTypes[0];
    }
    return RelationEnums.BatchTypes.find((t) => isRelationTypeEligible(t, entityClasses));
  }, [entityClasses, isLargeSelection]);

  const [relationType, setRelationType] = useState<RelationEnums.Type | undefined>(undefined);

  const activeType = relationType ?? firstValidType;

  const [targetEntity, setTargetEntity] = useState<IEntity | undefined>();

  const rule = useMemo(
    () => (activeType ? Relation.RelationRules[activeType] : undefined),
    [activeType],
  );

  const { validEntities, invalidEntities } = useMemo(() => {
    if (isLargeSelection) {
      return {
        validEntities: [] as IEntity[],
        invalidEntities: [] as IEntity[],
      };
    }
    if (!rule) {
      return { validEntities: selectedEntities, invalidEntities: [] };
    }

    const anyPatternAllowed = rule.allowedEntitiesPattern.length === 0;

    return selectedEntities.reduce<{
      validEntities: IEntity[];
      invalidEntities: IEntity[];
    }>(
      (acc, entity) => {
        let isValid: boolean;

        if (anyPatternAllowed) {
          isValid = !rule.disabledEntities?.includes(entity.class);
        } else {
          isValid = rule.allowedEntitiesPattern.some((pattern) => pattern[0] === entity.class);
        }

        if (isValid) {
          acc.validEntities.push(entity);
        } else {
          acc.invalidEntities.push(entity);
        }
        return acc;
      },
      { validEntities: [], invalidEntities: [] },
    );
  }, [selectedEntities, rule, isLargeSelection]);

  const invalidClassCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    invalidEntities.forEach((e) => {
      counts[e.class] = (counts[e.class] || 0) + 1;
    });
    return counts;
  }, [invalidEntities]);

  const validEntityIds = useMemo(() => {
    if (isLargeSelection) return selectedEntityIds;
    return validEntities.map((e) => e.id);
  }, [isLargeSelection, selectedEntityIds, validEntities]);

  const batchMutation = useMutation({
    mutationFn: async () => {
      if (!activeType || !targetEntity) return;
      return api.batchEntityAddRelation(validEntityIds, activeType, targetEntity.id);
    },
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Relations added");
      onApply();
    },
    onError: () => {
      toast.error("Failed to add relations");
    },
  });

  const [showConfirm, setShowConfirm] = useState(false);

  const executeApply = () => {
    batchMutation.mutate();
  };

  const handleApply = () => {
    if (!activeType || !targetEntity || validEntityIds.length === 0) return;
    if (needsBatchActionConfirm(validEntityIds.length)) {
      setShowConfirm(true);
      return;
    }
    executeApply();
  };

  const relationOptions = useMemo(() => {
    return RelationEnums.BatchTypes.map((type) => ({
      value: type,
      label: getRelationLabel(type),
      isDisabled: isLargeSelection ? false : !isRelationTypeEligible(type, entityClasses),
    }));
  }, [entityClasses, isLargeSelection]);

  const message = useMemo(() => {
    if (!activeType || !targetEntity) return "";
    const relationLabel = getRelationLabel(activeType);
    const targetLabel = targetEntity.labels[0];

    if (isLargeSelection) {
      return `Add "${relationLabel}" relation to "${targetLabel}" for ${selectedEntityIds.length} selected entities.`;
    }
    if (invalidEntities.length === 0) {
      return `Add "${relationLabel}" relation to "${targetLabel}" for all ${validEntities.length} selected entities.`;
    }
    return `Add "${relationLabel}" relation to "${targetLabel}" for ${validEntities.length} of ${selectedEntities.length} selected entities.`;
  }, [
    activeType,
    targetEntity,
    validEntities,
    invalidEntities,
    selectedEntities.length,
    isLargeSelection,
    selectedEntityIds.length,
  ]);

  const allowedTargetEntityClasses = useMemo<EntityEnums.Class[]>(() => {
    // if allowedEntitiesPattern is empty, return all entity classes
    if (
      activeType ? Relation.RelationRules[activeType]?.allowedEntitiesPattern.length === 0 : true
    ) {
      return EntityEnums.PLOGESTRBV;
    }
    const targetEntityClasses = new Set<EntityEnums.Class>();
    activeType
      ? Relation.RelationRules[activeType]?.allowedEntitiesPattern
          .map((p) => p[1])
          .filter((c) => c !== undefined)
          .filter((c) => targetEntityClasses.add(c))
      : ([] as EntityEnums.Class[]);
    return [...targetEntityClasses];
  }, [activeType, rule]);

  const selectionCount = selectedEntityIds.length;
  const eligibilityReady =
    isLargeSelection || (!isLoadingEntities && !isEntitiesFetchError && fetchedEntities);

  return (
    <>
      <Modal showModal onClose={onClose} width="fat" isLoading={batchMutation.isPending}>
        <ModalHeader title={`Add Relation (${selectionCount} entities)`} onClose={onClose} />
        <ModalContent column enableScroll>
          <StyledBatchWrapper>
            {isLargeSelection && (
              <StyledBatchWarningSection>
                <StyledBatchWarningLabel>Large selection</StyledBatchWarningLabel>
                <StyledBatchBodyText>
                  Relation-type eligibility (by entity class) is not evaluated for{" "}
                  {RELATION_ELIGIBILITY_FETCH_MAX} or more selected entities. The chosen relation
                  will be applied to all selected entities.
                </StyledBatchBodyText>
              </StyledBatchWarningSection>
            )}

            {!isLargeSelection && isEntitiesFetchError && (
              <StyledBatchWarningSection>
                <StyledBatchWarningLabel>Could not load entities</StyledBatchWarningLabel>
                <StyledBatchBodyText>
                  Failed to load selected entities for eligibility checks. Try again or reduce the
                  selection.
                </StyledBatchBodyText>
              </StyledBatchWarningSection>
            )}

            {!isLargeSelection && isLoadingEntities && (
              <StyledBatchSection>
                <StyledBatchBodyText>Loading selected entities…</StyledBatchBodyText>
              </StyledBatchSection>
            )}

            {/* RELATION TYPE */}
            <StyledBatchSection>
              <StyledBatchSectionLabel>Relation type</StyledBatchSectionLabel>
              <Dropdown.Single.Basic
                value={activeType || null}
                options={relationOptions}
                onChange={(value) => {
                  setRelationType(value as RelationEnums.Type);
                  setTargetEntity(undefined);
                }}
                placeholder="select relation type..."
                width="full"
                disabled={!eligibilityReady}
              />
            </StyledBatchSection>

            {/* APPLICABILITY WARNING */}
            {!isLargeSelection && activeType && invalidEntities.length > 0 && eligibilityReady && (
              <StyledBatchWarningSection>
                <StyledBatchWarningLabel>Partial applicability</StyledBatchWarningLabel>
                <StyledBatchBodyText>
                  <b>{getRelationLabel(activeType!)}</b> cannot be applied to{" "}
                  <b>{invalidEntities.length}</b> of {selectedEntities.length} selected entities
                  {" — "}
                  {Object.entries(invalidClassCounts)
                    .map(([cls, count]) => `${count}× ${cls}`)
                    .join(", ")}
                  . These will be skipped.
                </StyledBatchBodyText>
                {validEntities.length > 0 && (
                  <StyledBatchSuccessText>
                    <b>{validEntities.length}</b> entities are eligible.
                  </StyledBatchSuccessText>
                )}
                {validEntities.length === 0 && (
                  <StyledBatchDangerText>
                    No entities in the selection are eligible for this relation type.
                  </StyledBatchDangerText>
                )}
              </StyledBatchWarningSection>
            )}

            {/* TARGET ENTITY */}
            <StyledBatchSection>
              <StyledBatchSectionLabel>Target entity</StyledBatchSectionLabel>
              {targetEntity ? (
                <EntityTag
                  entity={targetEntity}
                  unlinkButton={{ onClick: () => setTargetEntity(undefined) }}
                  fullWidth
                />
              ) : (
                <EntitySuggester
                  onPicked={(entity) => setTargetEntity(entity)}
                  placeholder="select target entity..."
                  inputWidth="full"
                  categoryTypes={allowedTargetEntityClasses}
                  reuseDroppedValue
                  disabled={!activeType || validEntityIds.length === 0 || !eligibilityReady}
                />
              )}
            </StyledBatchSection>

            {/* SUMMARY */}
            {message && <StyledBatchMessage>{message}</StyledBatchMessage>}
          </StyledBatchWrapper>
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <CancelButton onClick={onClose} />
            <Button
              label="Apply"
              color="primary"
              onClick={handleApply}
              disabled={
                !activeType ||
                !targetEntity ||
                validEntityIds.length === 0 ||
                batchMutation.isPending ||
                !eligibilityReady ||
                (!isLargeSelection && isEntitiesFetchError)
              }
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
      <BatchActionApplyConfirm
        kind="relation"
        entityCount={validEntityIds.length}
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
