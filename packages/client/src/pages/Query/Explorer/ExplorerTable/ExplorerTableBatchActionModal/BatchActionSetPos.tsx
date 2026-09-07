import {
  actionPartOfSpeechDict,
  conceptPartOfSpeechDict,
} from "@inkvisitor/shared/dictionaries";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IBatchSetAttributeChanges, IEntity } from "@inkvisitor/shared/types";
import { useMutation } from "@tanstack/react-query";
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
import Dropdown from "components/advanced";
import { BATCH_ATTRIBUTE_ELIGIBILITY_KEY, useEntitiesQuery } from "hooks/react-query";
import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  BatchActionApplyConfirm,
  needsBatchActionConfirm,
} from "./BatchActionApplyConfirm";
import {
  StyledBatchArrow,
  StyledBatchAttrRow,
  StyledBatchBodyText,
  StyledBatchDangerText,
  StyledBatchField,
  StyledBatchFieldLabel,
  StyledBatchMessage,
  StyledBatchSection,
  StyledBatchSectionLabel,
  StyledBatchWarningLabel,
  StyledBatchWarningSection,
  StyledBatchWrapper,
} from "./styles";
import {
  ATTRIBUTE_PREVIEW_FETCH_MAX,
  batchAttributeFromOptions,
  batchAttributeMatches,
} from "./utils";

/** A carries a single pos value and no empty one of its own, so the missing
 * value only ever appears on the "change from" side */
const actionFromDict: { value: EntityEnums.ActionPartOfSpeech | ""; label: string }[] = [
  { value: "", label: "" },
  ...actionPartOfSpeechDict,
];

const posOf = (entity: IEntity): string =>
  (entity.data as { pos?: string })?.pos || "";

interface BatchActionSetPos {
  selectedEntityIds: string[];
  onClose: () => void;
  onApply: () => void;
}

export const BatchActionSetPos: React.FC<BatchActionSetPos> = ({
  selectedEntityIds,
  onClose,
  onApply,
}) => {
  const isLargeSelection = selectedEntityIds.length >= ATTRIBUTE_PREVIEW_FETCH_MAX;

  const {
    data: fetchedEntities,
    isLoading: isLoadingEntities,
    isError: isEntitiesFetchError,
  } = useEntitiesQuery(BATCH_ATTRIBUTE_ELIGIBILITY_KEY, selectedEntityIds, {
    enabled: !isLargeSelection,
  });

  const [conceptFrom, setConceptFrom] = useState<EntityEnums.ConceptPartOfSpeech>(
    EntityEnums.ConceptPartOfSpeech.Empty
  );
  const [conceptTo, setConceptTo] = useState<
    EntityEnums.ConceptPartOfSpeech | undefined
  >();
  const [conceptOverwrite, setConceptOverwrite] = useState(false);

  const [actionFrom, setActionFrom] = useState<
    EntityEnums.ActionPartOfSpeech | ""
  >("");
  const [actionTo, setActionTo] = useState<
    EntityEnums.ActionPartOfSpeech | undefined
  >();
  const [actionOverwrite, setActionOverwrite] = useState(false);

  const { conceptEntities, actionEntities } = useMemo(() => {
    const entities = isLargeSelection ? [] : fetchedEntities ?? [];
    return {
      conceptEntities: entities.filter(
        (entity) => entity.class === EntityEnums.Class.Concept
      ),
      actionEntities: entities.filter(
        (entity) => entity.class === EntityEnums.Class.Action
      ),
    };
  }, [fetchedEntities, isLargeSelection]);

  // with the selection unfetched neither class can be ruled out, so both
  // sections stay open
  const showConcept = isLargeSelection || conceptEntities.length > 0;
  const showAction = isLargeSelection || actionEntities.length > 0;

  const changes = useMemo<IBatchSetAttributeChanges | undefined>(() => {
    if (conceptTo === undefined && actionTo === undefined) return undefined;
    return {
      attribute: "pos",
      ...(conceptTo !== undefined && showConcept
        ? {
            concept: {
              from: conceptOverwrite ? null : conceptFrom,
              to: conceptTo,
            },
          }
        : {}),
      ...(actionTo !== undefined && showAction
        ? {
            action: { from: actionOverwrite ? null : actionFrom, to: actionTo },
          }
        : {}),
    };
  }, [
    conceptFrom,
    conceptTo,
    conceptOverwrite,
    actionFrom,
    actionTo,
    actionOverwrite,
    showConcept,
    showAction,
  ]);

  const matchCount = useMemo<number | undefined>(() => {
    if (isLargeSelection || !fetchedEntities || !changes) return undefined;

    let count = 0;
    if (changes.attribute === "pos") {
      if (changes.concept) {
        const { from, to } = changes.concept;
        count += conceptEntities.filter((entity) =>
          batchAttributeMatches(posOf(entity), from, to)
        ).length;
      }
      if (changes.action) {
        const { from, to } = changes.action;
        count += actionEntities.filter((entity) =>
          batchAttributeMatches(posOf(entity), from, to)
        ).length;
      }
    }
    return count;
  }, [
    changes,
    conceptEntities,
    actionEntities,
    fetchedEntities,
    isLargeSelection,
  ]);

  const batchMutation = useMutation({
    mutationFn: async () => {
      if (!changes) return;
      return api.batchEntitySetAttribute(selectedEntityIds, changes);
    },
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Part of speech set");
      onApply();
    },
    onError: () => {
      toast.error("Failed to set part of speech");
    },
  });

  const [showConfirm, setShowConfirm] = useState(false);

  const executeApply = () => {
    batchMutation.mutate();
  };

  const handleApply = () => {
    if (!changes) return;
    if (needsBatchActionConfirm(matchCount ?? selectedEntityIds.length)) {
      setShowConfirm(true);
      return;
    }
    executeApply();
  };

  const hasRelevantEntities = showConcept || showAction;

  // with a single class in play its count is the selection size the title
  // already carries; across two classes the split is what the title cannot say
  const showSectionCounts = !isLargeSelection && showConcept && showAction;

  const message = useMemo<React.ReactNode>(() => {
    if (!hasRelevantEntities) {
      return "Part of speech is only carried by Concept and Action entities, and the selection holds none.";
    }
    if (!changes) {
      return "Pick the part of speech to set.";
    }
    if (matchCount === undefined) {
      return `Selection too large to preview — only Concept and Action entities matching the "change from" value will change.`;
    }
    return (
      <>
        <b>{matchCount}</b> of {selectedEntityIds.length} selected entities will
        change; the rest stay untouched.
      </>
    );
  }, [hasRelevantEntities, changes, matchCount, selectedEntityIds.length]);

  const previewReady =
    isLargeSelection || (!isLoadingEntities && !isEntitiesFetchError);

  return (
    <>
      <Modal
        showModal
        onClose={onClose}
        width="normal"
        isLoading={batchMutation.isPending}
      >
        <ModalHeader
          title={`Set Part of Speech (${selectedEntityIds.length} entities)`}
          onClose={onClose}
        />
        <ModalContent column enableScroll>
          <StyledBatchWrapper>
            {isLargeSelection && (
              <StyledBatchWarningSection>
                <StyledBatchWarningLabel>Large selection</StyledBatchWarningLabel>
                <StyledBatchBodyText>
                  Entity classes are not evaluated for{" "}
                  {ATTRIBUTE_PREVIEW_FETCH_MAX} or more selected entities. Only
                  Concept and Action entities matching the chosen source value
                  will change.
                </StyledBatchBodyText>
              </StyledBatchWarningSection>
            )}

            {!isLargeSelection && isEntitiesFetchError && (
              <StyledBatchWarningSection>
                <StyledBatchWarningLabel>
                  Could not load entities
                </StyledBatchWarningLabel>
                <StyledBatchBodyText>
                  Failed to load the selected entities, so the affected classes
                  and counts cannot be shown.
                </StyledBatchBodyText>
              </StyledBatchWarningSection>
            )}

            {!isLargeSelection && isLoadingEntities && (
              <StyledBatchSection>
                <StyledBatchBodyText>
                  Loading selected entities…
                </StyledBatchBodyText>
              </StyledBatchSection>
            )}

            {showConcept && (
              <StyledBatchSection>
                <StyledBatchSectionLabel>
                  {`Concept entities${
                    showSectionCounts ? ` (${conceptEntities.length})` : ""
                  }`}
                </StyledBatchSectionLabel>
                <StyledBatchAttrRow>
                  <StyledBatchField>
                    <StyledBatchFieldLabel>change from</StyledBatchFieldLabel>
                    <Dropdown.Single.Basic
                      width={200}
                      value={conceptFrom}
                      options={batchAttributeFromOptions(
                        conceptPartOfSpeechDict
                      )}
                      disabled={conceptOverwrite}
                      onChange={(value) =>
                        setConceptFrom(value as EntityEnums.ConceptPartOfSpeech)
                      }
                    />
                  </StyledBatchField>
                  <StyledBatchField>
                    <StyledBatchFieldLabel>&nbsp;</StyledBatchFieldLabel>
                    <StyledBatchArrow>→</StyledBatchArrow>
                  </StyledBatchField>
                  <StyledBatchField>
                    <StyledBatchFieldLabel>change to</StyledBatchFieldLabel>
                    <Dropdown.Single.Basic
                      width={200}
                      value={conceptTo ?? null}
                      options={conceptPartOfSpeechDict}
                      placeholder="select part of speech..."
                      onChange={(value) =>
                        setConceptTo(value as EntityEnums.ConceptPartOfSpeech)
                      }
                    />
                  </StyledBatchField>
                </StyledBatchAttrRow>
                <Checkbox
                  label="also overwrite existing value"
                  value={conceptOverwrite}
                  onChangeFn={setConceptOverwrite}
                  size={13}
                />
              </StyledBatchSection>
            )}

            {showAction && (
              <StyledBatchSection>
                <StyledBatchSectionLabel>
                  {`Action entities${
                    showSectionCounts ? ` (${actionEntities.length})` : ""
                  }`}
                </StyledBatchSectionLabel>
                <StyledBatchAttrRow>
                  <StyledBatchField>
                    <StyledBatchFieldLabel>change from</StyledBatchFieldLabel>
                    <Dropdown.Single.Basic
                      width={200}
                      value={actionFrom}
                      options={batchAttributeFromOptions(actionFromDict)}
                      disabled={actionOverwrite}
                      onChange={(value) =>
                        setActionFrom(
                          value as EntityEnums.ActionPartOfSpeech | ""
                        )
                      }
                    />
                  </StyledBatchField>
                  <StyledBatchField>
                    <StyledBatchFieldLabel>&nbsp;</StyledBatchFieldLabel>
                    <StyledBatchArrow>→</StyledBatchArrow>
                  </StyledBatchField>
                  <StyledBatchField>
                    <StyledBatchFieldLabel>change to</StyledBatchFieldLabel>
                    <Dropdown.Single.Basic
                      width={200}
                      value={actionTo ?? null}
                      options={actionPartOfSpeechDict}
                      placeholder="select part of speech..."
                      onChange={(value) =>
                        setActionTo(value as EntityEnums.ActionPartOfSpeech)
                      }
                    />
                  </StyledBatchField>
                </StyledBatchAttrRow>
                <Checkbox
                  label="also overwrite existing value"
                  value={actionOverwrite}
                  onChangeFn={setActionOverwrite}
                  size={13}
                />
              </StyledBatchSection>
            )}

            {matchCount === 0 ? (
              <StyledBatchDangerText>
                No selected entity would change.
              </StyledBatchDangerText>
            ) : (
              <StyledBatchMessage>{message}</StyledBatchMessage>
            )}
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
                !changes ||
                batchMutation.isPending ||
                !previewReady ||
                matchCount === 0
              }
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
      <BatchActionApplyConfirm
        kind="part of speech"
        entityCount={matchCount ?? selectedEntityIds.length}
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
