import { IEntity, IResponseGeneric } from "@shared/types";
import { ITerritoryValidation } from "@shared/types/territory";
import { UseMutationResult } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { Submit } from "components";
import React, { useState } from "react";
import { deepCopy } from "utils/utils";
import {
  StyledBlockSeparator,
  StyledValidationList,
} from "../EntityDetailStyles";
import { EntityDetailValidationRule } from "./EntityDetailValidationRule/EntityDetailValidationRule";

interface EntityDetailValidationSection {
  validations?: ITerritoryValidation[];
  entities: Record<string, IEntity>;
  updateEntityMutation?: UseMutationResult<
    AxiosResponse<IResponseGeneric<any>, any>,
    Error,
    Partial<IEntity>,
    unknown
  >;
  userCanEdit: boolean;
  isInsideTemplate?: boolean;
  territoryParentId?: string | undefined;
  showValidationsBatchRemoveSubmit?: boolean;
  setShowValidationsBatchRemoveSubmit?: React.Dispatch<
    React.SetStateAction<boolean>
  >;
}
export const EntityDetailValidationSection: React.FC<
  EntityDetailValidationSection
> = ({
  validations,
  entities,
  updateEntityMutation,
  userCanEdit,
  isInsideTemplate = false,
  territoryParentId,
  showValidationsBatchRemoveSubmit,
  setShowValidationsBatchRemoveSubmit,
}) => {
  const [tempIndexToRemove, setTempIndexToRemove] = useState<false | number>(
    false
  );

  const removeValidationRule = (indexToRemove: number) => {
    updateEntityMutation?.mutate({
      data: {
        validations: validations?.filter((_, index) => index !== indexToRemove),
      },
    });
    setTempIndexToRemove(false);
  };

  const handleUpdateValidation = (
    key: number,
    changes: Partial<ITerritoryValidation>
  ) => {
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
    updateEntityMutation?.mutate({
      data: {
        validations: newValidation,
      },
    });
  };

  return (
    <>
      {validations && (
        <StyledValidationList>
          {(validations as ITerritoryValidation[]).map((validation, key) => {
            return (
              <React.Fragment key={key}>
                <EntityDetailValidationRule
                  key={key}
                  validation={validation}
                  entities={entities}
                  updateValidationRule={(
                    changes: Partial<ITerritoryValidation>
                  ) => {
                    handleUpdateValidation(key, changes);
                  }}
                  removeValidationRule={() => setTempIndexToRemove(key)}
                  isInsideTemplate={isInsideTemplate}
                  territoryParentId={territoryParentId}
                  userCanEdit={userCanEdit}
                />
                {key !== validations.length - 1 && <StyledBlockSeparator />}
              </React.Fragment>
            );
          })}
        </StyledValidationList>
      )}

      <Submit
        show={tempIndexToRemove !== false}
        title="Remove validation rule"
        text="Do you really want to remove this validation rule?"
        onSubmit={() => {
          tempIndexToRemove !== false &&
            removeValidationRule(tempIndexToRemove);
        }}
        onCancel={() => setTempIndexToRemove(false)}
      />
      {showValidationsBatchRemoveSubmit !== undefined &&
        setShowValidationsBatchRemoveSubmit !== undefined && (
          <Submit
            show={showValidationsBatchRemoveSubmit}
            title="Remove validation rules"
            text="Do you really want to remove all validation rules?"
            onSubmit={() => {
              updateEntityMutation?.mutate({
                data: {
                  validations: [],
                },
              });
              setShowValidationsBatchRemoveSubmit(false);
            }}
            onCancel={() => setShowValidationsBatchRemoveSubmit(false)}
          />
        )}
    </>
  );
};
