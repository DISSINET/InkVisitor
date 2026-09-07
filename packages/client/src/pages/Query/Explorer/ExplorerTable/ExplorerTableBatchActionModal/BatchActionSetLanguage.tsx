import { EntityEnums } from "@inkvisitor/shared/enums";
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
import {
  BATCH_ATTRIBUTE_ELIGIBILITY_KEY,
  useEntitiesQuery,
  useOrderedLanguageDict,
} from "hooks/react-query";
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

interface BatchActionSetLanguage {
  selectedEntityIds: string[];
  onClose: () => void;
  onApply: () => void;
}

export const BatchActionSetLanguage: React.FC<BatchActionSetLanguage> = ({
  selectedEntityIds,
  onClose,
  onApply,
}) => {
  const orderedLanguageDict = useOrderedLanguageDict();

  const isLargeSelection =
    selectedEntityIds.length >= ATTRIBUTE_PREVIEW_FETCH_MAX;

  const {
    data: fetchedEntities,
    isLoading: isLoadingEntities,
    isError: isEntitiesFetchError,
  } = useEntitiesQuery(BATCH_ATTRIBUTE_ELIGIBILITY_KEY, selectedEntityIds, {
    enabled: !isLargeSelection,
  });

  const [fromValue, setFromValue] = useState<EntityEnums.Language>(
    EntityEnums.Language.Empty
  );
  const [toValue, setToValue] = useState<EntityEnums.Language | undefined>();
  const [overwriteExisting, setOverwriteExisting] = useState(false);

  /** the source value as the API takes it: null for every current value */
  const from = overwriteExisting ? null : fromValue;

  const fromOptions = useMemo(
    () => batchAttributeFromOptions(orderedLanguageDict),
    [orderedLanguageDict]
  );

  const matchCount = useMemo<number | undefined>(() => {
    if (isLargeSelection || !fetchedEntities || toValue === undefined) {
      return undefined;
    }
    return fetchedEntities.filter((entity) =>
      batchAttributeMatches(
        entity.language || EntityEnums.Language.Empty,
        from,
        toValue
      )
    ).length;
  }, [fetchedEntities, isLargeSelection, from, toValue]);

  const batchMutation = useMutation({
    mutationFn: async () => {
      if (toValue === undefined) return;
      return api.batchEntitySetAttribute(selectedEntityIds, {
        attribute: "language",
        from,
        to: toValue,
      });
    },
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Label language set");
      onApply();
    },
    onError: () => {
      toast.error("Failed to set label language");
    },
  });

  const [showConfirm, setShowConfirm] = useState(false);

  const executeApply = () => {
    batchMutation.mutate();
  };

  const handleApply = () => {
    if (toValue === undefined) return;
    if (needsBatchActionConfirm(matchCount ?? selectedEntityIds.length)) {
      setShowConfirm(true);
      return;
    }
    executeApply();
  };

  const message = useMemo<React.ReactNode>(() => {
    if (toValue === undefined) {
      return "Pick the language to set.";
    }
    if (matchCount === undefined) {
      return `Selection too large to preview — only entities matching the "change from" value will change.`;
    }
    return (
      <>
        <b>{matchCount}</b> of {selectedEntityIds.length} selected entities will
        change; the rest stay untouched.
      </>
    );
  }, [toValue, matchCount, selectedEntityIds.length]);

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
          title={`Set Label Language (${selectedEntityIds.length} entities)`}
          onClose={onClose}
        />
        <ModalContent column enableScroll>
          <StyledBatchWrapper>
            {!isLargeSelection && isEntitiesFetchError && (
              <StyledBatchWarningSection>
                <StyledBatchWarningLabel>
                  Could not load entities
                </StyledBatchWarningLabel>
                <StyledBatchBodyText>
                  Failed to load the selected entities, so the number of
                  affected entities cannot be shown. Only matching entities will
                  change.
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

            <StyledBatchSection>
              <StyledBatchSectionLabel>Label language</StyledBatchSectionLabel>
              <StyledBatchAttrRow>
                <StyledBatchField>
                  <StyledBatchFieldLabel>change from</StyledBatchFieldLabel>
                  <Dropdown.Single.Basic
                    width={200}
                    value={fromValue}
                    options={fromOptions}
                    disabled={overwriteExisting}
                    onChange={(value) =>
                      setFromValue(value as EntityEnums.Language)
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
                    value={toValue ?? null}
                    options={orderedLanguageDict}
                    placeholder="select language..."
                    onChange={(value) =>
                      setToValue(value as EntityEnums.Language)
                    }
                  />
                </StyledBatchField>
              </StyledBatchAttrRow>
              <Checkbox
                label="also overwrite existing value"
                value={overwriteExisting}
                onChangeFn={setOverwriteExisting}
                size={13}
              />
            </StyledBatchSection>

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
                toValue === undefined ||
                batchMutation.isPending ||
                !previewReady ||
                matchCount === 0
              }
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
      <BatchActionApplyConfirm
        kind="label language"
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
