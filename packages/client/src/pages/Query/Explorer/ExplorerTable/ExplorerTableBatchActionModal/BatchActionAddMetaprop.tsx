import {
  certaintyDict,
  moodDict,
  partitivityDict,
  virtualityDict,
} from "@inkvisitor/shared/dictionaries";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IPropSpec } from "@inkvisitor/shared/types";
import { useMutation } from "@tanstack/react-query";
import api from "api";
import {
  AttributeIcon,
  Button,
  ButtonGroup,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import Dropdown, {
  ElvlButtonGroup,
  EntitySuggester,
  EntityTag,
  LogicButtonGroup,
  MoodVariantButtonGroup,
} from "components/advanced";
import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  StyledBatchAttrRow,
  StyledBatchMessage,
  StyledBatchSection,
  StyledBatchSectionLabel,
  StyledBatchWrapper,
} from "./styles";

interface BatchActionAddMetapropProps {
  selectedEntityIds: string[];
  onClose: () => void;
  onApply: () => void;
}

const defaultPropSpec = (entityId = ""): IPropSpec => ({
  entityId,
  elvl: EntityEnums.Elvl.Inferential,
  logic: EntityEnums.Logic.Positive,
  virtuality: EntityEnums.Virtuality.Reality,
  partitivity: EntityEnums.Partitivity.Unison,
});

export const BatchActionAddMetaprop: React.FC<BatchActionAddMetapropProps> = ({
  selectedEntityIds,
  onClose,
  onApply,
}) => {
  const [typeEntity, setTypeEntity] = useState<IEntity | undefined>();
  const [valueEntity, setValueEntity] = useState<IEntity | undefined>();

  const [logic, setLogic] = useState<EntityEnums.Logic>(
    EntityEnums.Logic.Positive
  );
  const [certainty, setCertainty] = useState<EntityEnums.Certainty>(
    EntityEnums.Certainty.Empty
  );
  const [mood, setMood] = useState<EntityEnums.Mood[]>([
    EntityEnums.Mood.Indication,
  ]);
  const [moodvariant, setMoodvariant] = useState<EntityEnums.MoodVariant>(
    EntityEnums.MoodVariant.Realis
  );

  const [typeSpec, setTypeSpec] = useState<Omit<IPropSpec, "entityId">>({
    elvl: EntityEnums.Elvl.Inferential,
    logic: EntityEnums.Logic.Positive,
    virtuality: EntityEnums.Virtuality.Reality,
    partitivity: EntityEnums.Partitivity.Unison,
  });

  const [valueSpec, setValueSpec] = useState<Omit<IPropSpec, "entityId">>({
    elvl: EntityEnums.Elvl.Inferential,
    logic: EntityEnums.Logic.Positive,
    virtuality: EntityEnums.Virtuality.Reality,
    partitivity: EntityEnums.Partitivity.Unison,
  });

  const batchMutation = useMutation({
    mutationFn: async () => {
      if (!typeEntity) return;
      return api.batchEntityAddMetaprop(selectedEntityIds, {
        logic,
        certainty,
        mood,
        moodvariant,
        type: { ...typeSpec, entityId: typeEntity.id },
        value: {
          ...(valueEntity ? valueSpec : defaultPropSpec()),
          entityId: valueEntity?.id || "",
        },
      });
    },
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Metaprop added");
      onApply();
    },
    onError: () => {
      toast.error("Failed to add metaprop");
    },
  });

  const handleApply = () => {
    if (!typeEntity) return;
    batchMutation.mutate();
  };

  const message = useMemo<string>(() => {
    const entityCount = selectedEntityIds.length;
    const typeLabel = typeEntity?.labels[0];
    const valueLabel = valueEntity?.labels[0];

    if (!typeLabel) {
      return `Add a new metaproperty to ${entityCount} selected entities.`;
    }
    if (valueLabel) {
      return `Add metaproperty "${typeLabel}" with value "${valueLabel}" to ${entityCount} selected entities.`;
    }
    return `Add metaproperty "${typeLabel}" to ${entityCount} selected entities.`;
  }, [typeEntity, valueEntity, selectedEntityIds.length]);

  return (
    <Modal
      showModal
      onClose={onClose}
      width="fat"
      isLoading={batchMutation.isPending}
    >
      <ModalHeader
        title={`Add Metaproperty (${selectedEntityIds.length} entities)`}
        onClose={onClose}
      />
      <ModalContent column enableScroll>
        <StyledBatchWrapper>
          {/* TYPE */}
          <StyledBatchSection>
            <StyledBatchSectionLabel>Type (required)</StyledBatchSectionLabel>
            {typeEntity ? (
              <EntityTag
                entity={typeEntity}
                unlinkButton={{ onClick: () => setTypeEntity(undefined) }}
              />
            ) : (
              <EntitySuggester
                categoryTypes={[EntityEnums.Class.Concept]}
                onPicked={(entity) => setTypeEntity(entity)}
                placeholder="select metaprop type..."
                inputWidth="full"
              />
            )}
            {typeEntity && (
              <StyledBatchAttrRow>
                <ElvlButtonGroup
                  border
                  value={typeSpec.elvl}
                  onChange={(elvl) => setTypeSpec((s) => ({ ...s, elvl }))}
                />
                <LogicButtonGroup
                  border
                  value={typeSpec.logic}
                  onChange={(logic) => setTypeSpec((s) => ({ ...s, logic }))}
                />
                <Dropdown.Single.Basic
                  width={100}
                  placeholder="virtuality"
                  tooltipLabel="virtuality"
                  icon={<AttributeIcon attributeName="virtuality" />}
                  options={virtualityDict}
                  value={typeSpec.virtuality}
                  onChange={(v) =>
                    setTypeSpec((s) => ({ ...s, virtuality: v }))
                  }
                />
                <Dropdown.Single.Basic
                  width={150}
                  placeholder="partitivity"
                  tooltipLabel="partitivity"
                  icon={<AttributeIcon attributeName="partitivity" />}
                  options={partitivityDict}
                  value={typeSpec.partitivity}
                  onChange={(v) =>
                    setTypeSpec((s) => ({ ...s, partitivity: v }))
                  }
                />
              </StyledBatchAttrRow>
            )}
          </StyledBatchSection>

          {/* VALUE */}
          <StyledBatchSection>
            <StyledBatchSectionLabel>Value (optional)</StyledBatchSectionLabel>
            {valueEntity ? (
              <EntityTag
                entity={valueEntity}
                unlinkButton={{ onClick: () => setValueEntity(undefined) }}
              />
            ) : (
              <EntitySuggester
                onPicked={(entity) => setValueEntity(entity)}
                placeholder="select value..."
                inputWidth="full"
              />
            )}
            {valueEntity && (
              <StyledBatchAttrRow>
                <ElvlButtonGroup
                  border
                  value={valueSpec.elvl}
                  onChange={(elvl) => setValueSpec((s) => ({ ...s, elvl }))}
                />
                <LogicButtonGroup
                  border
                  value={valueSpec.logic}
                  onChange={(logic) => setValueSpec((s) => ({ ...s, logic }))}
                />
                <Dropdown.Single.Basic
                  width={100}
                  placeholder="virtuality"
                  tooltipLabel="virtuality"
                  icon={<AttributeIcon attributeName="virtuality" />}
                  options={virtualityDict}
                  value={valueSpec.virtuality}
                  onChange={(v) =>
                    setValueSpec((s) => ({ ...s, virtuality: v }))
                  }
                />
                <Dropdown.Single.Basic
                  width={150}
                  placeholder="partitivity"
                  tooltipLabel="partitivity"
                  icon={<AttributeIcon attributeName="partitivity" />}
                  options={partitivityDict}
                  value={valueSpec.partitivity}
                  onChange={(v) =>
                    setValueSpec((s) => ({ ...s, partitivity: v }))
                  }
                />
              </StyledBatchAttrRow>
            )}
          </StyledBatchSection>

          {/* STATEMENT-LEVEL ATTRIBUTES */}
          <StyledBatchSection>
            <StyledBatchSectionLabel>
              Statement attributes
            </StyledBatchSectionLabel>
            <StyledBatchAttrRow>
              <LogicButtonGroup border value={logic} onChange={setLogic} />
              <Dropdown.Single.Basic
                width={122}
                placeholder="certainty"
                tooltipLabel="certainty"
                icon={<AttributeIcon attributeName="certainty" />}
                options={certaintyDict}
                value={certainty}
                onChange={(v) => setCertainty(v)}
              />
              <Dropdown.Multi.Attribute
                width={131}
                placeholder="mood"
                tooltipLabel="mood"
                icon={<AttributeIcon attributeName="mood" />}
                options={moodDict}
                value={mood}
                onChange={(newValues) => setMood(newValues)}
              />
              <MoodVariantButtonGroup
                border
                value={moodvariant}
                onChange={setMoodvariant}
              />
            </StyledBatchAttrRow>
          </StyledBatchSection>

          {/* MESSAGE + ACTIONS */}
          <StyledBatchMessage>{message}</StyledBatchMessage>
        </StyledBatchWrapper>
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button label="Cancel" color="greyer" inverted onClick={onClose} />
          <Button
            label="Apply"
            color="primary"
            onClick={handleApply}
            disabled={!typeEntity || batchMutation.isPending}
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
