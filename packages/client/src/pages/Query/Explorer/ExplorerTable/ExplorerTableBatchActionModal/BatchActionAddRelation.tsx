import { RelationEnums } from "@shared/enums";
import { IEntity, Relation } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import theme from "Theme/theme";
import api from "api";
import {
  Button,
  ButtonGroup,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import Dropdown, { EntitySuggester, EntityTag } from "components/advanced";
import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  StyledBatchMessage,
  StyledBatchSection,
  StyledBatchSectionLabel,
  StyledBatchWarningLabel,
  StyledBatchWarningSection,
  StyledBatchWrapper,
} from "./styles";
import { getRelationLabel, isRelationTypeEligible } from "./utils";

interface BatchActionAddRelationProps {
  selectedEntities: IEntity[];
  onClose: () => void;
  onApply: () => void;
}

export const BatchActionAddRelation: React.FC<BatchActionAddRelationProps> = ({
  selectedEntities,
  onClose,
  onApply,
}) => {
  const entityClasses = useMemo(
    () => new Set(selectedEntities.map((e) => e.class)),
    [selectedEntities]
  );

  const firstValidType = useMemo(
    () =>
      RelationEnums.BatchTypes.find((t) =>
        isRelationTypeEligible(t, entityClasses)
      ),
    [entityClasses]
  );

  const [relationType, setRelationType] = useState<
    RelationEnums.Type | undefined
  >(undefined);

  const activeType = relationType ?? firstValidType;

  const [targetEntity, setTargetEntity] = useState<IEntity | undefined>();

  const rule = useMemo(
    () => (activeType ? Relation.RelationRules[activeType] : undefined),
    [activeType]
  );

  const { validEntities, invalidEntities } = useMemo(() => {
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
          isValid = rule.allowedEntitiesPattern.some(
            (pattern) => pattern[0] === entity.class
          );
        }

        if (isValid) {
          acc.validEntities.push(entity);
        } else {
          acc.invalidEntities.push(entity);
        }
        return acc;
      },
      { validEntities: [], invalidEntities: [] }
    );
  }, [selectedEntities, rule]);

  const invalidClassCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    invalidEntities.forEach((e) => {
      counts[e.class] = (counts[e.class] || 0) + 1;
    });
    return counts;
  }, [invalidEntities]);

  const queryClient = useQueryClient();

  const batchMutation = useMutation({
    mutationFn: async () => {
      if (!activeType || !targetEntity) return;
      const entityIds = validEntities.map((e) => e.id);
      return api.batchEntityAddRelation(entityIds, activeType, targetEntity.id);
    },
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Relations added");
      queryClient.invalidateQueries({ queryKey: ["query"] });
      onApply();
    },
    onError: () => {
      toast.error("Failed to add relations");
    },
  });

  const handleApply = () => {
    if (!activeType || !targetEntity || validEntities.length === 0) return;
    batchMutation.mutate();
  };

  const relationOptions = useMemo(() => {
    return RelationEnums.BatchTypes.map((type) => ({
      value: type,
      label: getRelationLabel(type),
      isDisabled: !isRelationTypeEligible(type, entityClasses),
    }));
  }, [entityClasses]);

  const message = useMemo(() => {
    if (!activeType || !targetEntity) return "";
    const relationLabel = getRelationLabel(activeType);
    const targetLabel = targetEntity.labels[0];

    if (invalidEntities.length === 0) {
      return `Add "${relationLabel}" relation to "${targetLabel}" for all ${validEntities.length} selected entities.`;
    }
    return `Add "${relationLabel}" relation to "${targetLabel}" for ${validEntities.length} of ${selectedEntities.length} selected entities.`;
  }, [
    activeType,
    targetEntity,
    validEntities,
    invalidEntities,
    selectedEntities,
  ]);

  return (
    <Modal showModal onClose={onClose} width="fat">
      <ModalHeader
        title={`Add Relation (${selectedEntities.length} entities)`}
        onClose={onClose}
      />
      <ModalContent column enableScroll>
        <StyledBatchWrapper>
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
            />
          </StyledBatchSection>

          {/* APPLICABILITY WARNING */}
          {activeType && invalidEntities.length > 0 && (
            <StyledBatchWarningSection>
              <StyledBatchWarningLabel>
                Partial applicability
              </StyledBatchWarningLabel>
              <span style={{ fontSize: theme.fontSize.sm }}>
                <b>{getRelationLabel(activeType!)}</b> cannot be applied to{" "}
                <b>{invalidEntities.length}</b> of {selectedEntities.length}{" "}
                selected entities
                {" — "}
                {Object.entries(invalidClassCounts)
                  .map(([cls, count]) => `${count}× ${cls}`)
                  .join(", ")}
                . These will be skipped.
              </span>
              {validEntities.length > 0 && (
                <span
                  style={{
                    fontSize: theme.fontSize.sm,
                    color: theme.color.success,
                  }}
                >
                  <b>{validEntities.length}</b> entities are eligible.
                </span>
              )}
              {validEntities.length === 0 && (
                <span
                  style={{
                    fontSize: theme.fontSize.sm,
                    color: theme.color.danger,
                    fontWeight: theme.fontWeight.bold,
                  }}
                >
                  No entities in the selection are eligible for this relation
                  type.
                </span>
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
              />
            ) : (
              <EntitySuggester
                onPicked={(entity) => setTargetEntity(entity)}
                placeholder="select target entity..."
                inputWidth="full"
                disabled={!activeType || validEntities.length === 0}
              />
            )}
          </StyledBatchSection>

          {/* SUMMARY */}
          {message && <StyledBatchMessage>{message}</StyledBatchMessage>}
        </StyledBatchWrapper>
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button label="Cancel" color="greyer" inverted onClick={onClose} />
          <Button
            label="Apply"
            color="primary"
            onClick={handleApply}
            disabled={
              !activeType ||
              !targetEntity ||
              validEntities.length === 0 ||
              batchMutation.isPending
            }
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
