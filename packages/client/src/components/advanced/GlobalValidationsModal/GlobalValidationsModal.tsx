import {
  entityKeys,
  globalValidationsDict,
  valencyKeys,
  ValidationKey,
} from "@inkvisitor/shared/enums/warning";
import { IEntity, IResponseGeneric } from "@inkvisitor/shared/types";
import { ISetting } from "@inkvisitor/shared/types/settings";
import { EProtocolTieType, ITerritoryValidation } from "@inkvisitor/shared/types/territory";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import {
  Button,
  ButtonGroup,
  Loader,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Submit,
} from "components";
import { ValidationRule } from "components/advanced";
import React, { useEffect, useRef, useState } from "react";
import { PiSealCheckFill } from "react-icons/pi";
import { rootTerritoryId } from "Theme/constants";
import { IcoPlusBold } from "Theme/icons";
import { ButtonSize } from "types";
import { deepCopy } from "utils/utils";
import { GlobalValidationsDetailRow } from "./GlobalValidationsDetailRow";
import {
  StyledBlockSeparator,
  StyledGridForm,
  StyledGridSectionHeading,
  StyledSectionHeader,
  StyledValidationCount,
  StyledValidationList,
} from "./GlobalValidationsModalStyles";
import { GlobalValidationsSettingsRow } from "./GlobalValidationsSettingsRow";

const initialRulesState: Record<ValidationKey, boolean> = Object.keys(globalValidationsDict).reduce(
  (acc, key) => {
    acc[key as ValidationKey] = true;
    return acc;
  },
  {} as Record<ValidationKey, boolean>,
);

const initValidation: ITerritoryValidation = {
  detail: "",
  entityClasses: [],
  entityClassifications: [],
  entityLanguages: [],
  entityStatuses: [],
  entitySOEs: [],
  allowedEntities: [],
  allowedClasses: [],
  propType: [],
  tieType: EProtocolTieType.Property,
};

interface GlobalValidationsModal {
  setShowGlobalValidations: React.Dispatch<React.SetStateAction<boolean>>;
}
export const GlobalValidationsModal: React.FC<GlobalValidationsModal> = ({
  setShowGlobalValidations,
}) => {
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    setShowModal(true);
  }, []);

  const {
    status,
    data: rootTerritory,
    error: entityError,
    isFetching,
  } = useQuery({
    queryKey: ["entity", rootTerritoryId],
    queryFn: async () => {
      const res = await api.detailGet(rootTerritoryId);
      return res.data;
    },
    enabled: api.isLoggedIn(),
  });

  const {
    data: settings,
    error: settingsError,
    isFetching: settingsIsFetching,
  } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await api.settingGroupGet("validations");
      return res.data.data?.settings ?? [];
    },
    enabled: api.isLoggedIn(),
  });

  const validations = rootTerritory?.data.validations || [];

  const queryClient = useQueryClient();

  const modalContentRef = useRef<HTMLDivElement>(null);
  const prevValidationsLengthRef = useRef<number>(0);

  const updateEntityMutation = useMutation({
    mutationFn: async (changes: Partial<IEntity>) => {
      const res = await api.entityUpdate(rootTerritoryId, changes);
      return res.data;
    },

    onSuccess: (data: IResponseGeneric, variables: Partial<IEntity>) => {
      queryClient.invalidateQueries({ queryKey: ["entity"] });

      // Check if a new validation was added and scroll to bottom
      const newValidations = variables.data?.validations;
      if (newValidations && Array.isArray(newValidations)) {
        const currentLength = newValidations.length;
        if (currentLength > prevValidationsLengthRef.current) {
          setTimeout(() => {
            modalContentRef.current?.parentElement?.scrollTo({
              top: modalContentRef.current?.parentElement?.scrollHeight,
              behavior: "smooth",
            });
          }, 100);
        }
        prevValidationsLengthRef.current = currentLength;
      }
    },
  });

  // Initialize the ref with the initial length on first load
  useEffect(() => {
    if (prevValidationsLengthRef.current === 0 && validations) {
      prevValidationsLengthRef.current = validations.length || 0;
    }
  }, [validations]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Omit<ISetting, "public">[]) =>
      await api.settingGroupUpdate("validations", newSettings),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["entity"] });
      queryClient.invalidateQueries({ queryKey: ["statement"] });
      // toast.success("settings updated");
    },
  });

  const [tempIndexToRemove, setTempIndexToRemove] = useState<false | number>(false);

  const initValidationRule = () => {
    if (!rootTerritory) {
      return;
    }

    const currentValidations = rootTerritory.data.validations || [];
    updateEntityMutation.mutate({
      data: {
        validations: [...currentValidations, initValidation],
      },
    });
  };

  const removeValidationRule = (indexToRemove: number) => {
    updateEntityMutation.mutate({
      data: {
        validations: (validations as ITerritoryValidation[])?.filter(
          (_, index) => index !== indexToRemove,
        ),
      },
    });
    setTempIndexToRemove(false);
  };

  const handleUpdateValidation = (key: number, changes: Partial<ITerritoryValidation>) => {
    const validationsCopy = deepCopy(validations as ITerritoryValidation[]);
    const updatedObject: ITerritoryValidation = {
      ...validationsCopy[key],
      ...changes,
    };
    const newValidation = [
      ...validationsCopy.slice(0, key),
      updatedObject,
      ...validationsCopy.slice(key + 1),
    ];
    updateEntityMutation.mutate({
      data: {
        validations: newValidation,
      },
    });
  };

  const settingsKeyVal = (key: ValidationKey) => {
    return settings?.find((setting: ISetting) => setting.id === key)?.value as boolean;
  };

  const toggleRule = (key: ValidationKey) => {
    const oldValue = settingsKeyVal(key);
    updateSettingsMutation.mutate([{ id: key, value: !oldValue }]);
    // setRules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // raw setting value (not cast to boolean) - used for non-boolean settings
  const settingRawVal = (key: ValidationKey) =>
    settings?.find((setting: ISetting) => setting.id === key)?.value;

  const updateRule = (key: ValidationKey, value: unknown) => {
    updateSettingsMutation.mutate([{ id: key, value }]);
  };

  const newValidationButton = (
    <Button
      icon={<IcoPlusBold />}
      label="new validation rule"
      color="primary"
      onClick={initValidationRule}
      size={ButtonSize.Medium}
    />
  );

  return (
    <>
      <Modal showModal={showModal} onClose={() => setShowGlobalValidations(false)} width={650}>
        <ModalHeader
          title="Global validations"
          icon={<PiSealCheckFill size={20} style={{ marginTop: "-2px" }} />}
          boldTitle
          onClose={() => setShowGlobalValidations(false)}
        />
        <ModalContent column enableScroll>
          <div ref={modalContentRef}>
            <StyledGridForm>
              <StyledGridSectionHeading>Valency validations</StyledGridSectionHeading>
              <div />
              {valencyKeys.map((val, key) => (
                <GlobalValidationsSettingsRow
                  key={key}
                  validation={val}
                  active={settingsKeyVal(val)}
                  toggleRule={() => toggleRule(val)}
                />
              ))}

              <StyledGridSectionHeading>Entity validations</StyledGridSectionHeading>
              <div />
              {entityKeys.map((val, key) =>
                val === "validation_DM" ? (
                  <GlobalValidationsDetailRow
                    key={key}
                    value={settingRawVal(val)}
                    update={(value) => updateRule(val, value)}
                  />
                ) : (
                  <GlobalValidationsSettingsRow
                    key={key}
                    validation={val}
                    active={settingsKeyVal(val)}
                    toggleRule={() => toggleRule(val)}
                  />
                ),
              )}

              {/* <StyledGridSectionHeading>
                Territory validations
              </StyledGridSectionHeading>
              <div />
              {territoryKeys.map((val, key) => (
                <GlobalValidationsSettingsRow
                  key={key}
                  validation={val}
                  active={settingsKeyVal(val)}
                  toggleRule={() => toggleRule(val)}
                />
              ))} */}
            </StyledGridForm>

            {rootTerritory && (
              <>
                <StyledSectionHeader>
                  <b>Root T validation</b>
                  <StyledValidationCount>{`${validations?.length} Root T validations`}</StyledValidationCount>
                  <span style={{ display: "flex" }}>{newValidationButton}</span>
                </StyledSectionHeader>
                <StyledValidationList>
                  {(validations as ITerritoryValidation[])?.map((validation, key) => {
                    return (
                      <React.Fragment key={key}>
                        <ValidationRule
                          key={key}
                          validation={validation}
                          entities={rootTerritory.entities}
                          updateValidationRule={(changes: Partial<ITerritoryValidation>) => {
                            handleUpdateValidation(key, changes);
                          }}
                          removeValidationRule={() => {
                            setTempIndexToRemove(key);
                          }}
                          isInsideTemplate={false}
                          userCanEdit
                        />
                        {key !== validations.length - 1 && <StyledBlockSeparator />}
                      </React.Fragment>
                    );
                  })}
                </StyledValidationList>
                <div style={{ marginTop: "2rem" }}>{newValidationButton}</div>
              </>
            )}

            <Loader show={isFetching || updateEntityMutation.isPending} />
          </div>
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <Button color="primary" label="Done" onClick={() => setShowGlobalValidations(false)} />
          </ButtonGroup>
        </ModalFooter>
      </Modal>

      <Submit
        show={tempIndexToRemove !== false}
        title="Remove validation rule"
        text="Do you really want to remove this validation rule?"
        onSubmit={() => {
          tempIndexToRemove !== false && removeValidationRule(tempIndexToRemove);
        }}
        onCancel={() => setTempIndexToRemove(false)}
      />
    </>
  );
};
