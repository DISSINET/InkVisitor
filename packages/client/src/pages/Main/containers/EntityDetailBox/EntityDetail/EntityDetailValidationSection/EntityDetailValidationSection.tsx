import { IEntity, IResponseGeneric } from "@shared/types";
import {
  EProtocolTieType,
  ITerritoryValidation,
} from "@shared/types/territory";
import { UseMutationResult } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { Button, Submit } from "components";
import React, { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { deepCopy } from "utils/utils";
import {
  StyledBlockSeparator,
  StyledDetailSectionHeader,
  StyledValidationList,
} from "../EntityDetailStyles";
import { EntityDetailValidationRule } from "./EntityDetailValidationRule/EntityDetailValidationRule";

const initValidation: ITerritoryValidation = {
  detail: "",
  entityClasses: [],
  classifications: [],
  allowedEntities: [],
  allowedClasses: [],
  propType: [],
  tieType: EProtocolTieType.Property,
};

interface EntityDetailValidationSection {
  validations?: ITerritoryValidation[];
  entities: Record<string, IEntity>;
  updateEntityMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric<any>, any>,
    Error,
    Partial<IEntity>,
    unknown
  >;
  userCanEdit: boolean;
  isInsideTemplate: boolean;
  territoryParentId: string | undefined;
}
export const EntityDetailValidationSection: React.FC<
  EntityDetailValidationSection
> = ({
  validations,
  entities,
  updateEntityMutation,
  userCanEdit,
  isInsideTemplate,
  territoryParentId,
}) => {
  const [tempIndexToRemove, setTempIndexToRemove] = useState<false | number>(
    false
  );

  const initValidationRule = () => {
    updateEntityMutation.mutate({
      data: {
        validations: validations
          ? [...validations, initValidation]
          : [initValidation],
      },
    });
  };

  const removeValidationRule = (indexToRemove: number) => {
    console.log(indexToRemove);
    updateEntityMutation.mutate({
      data: {
        validations: validations?.filter((_, index) => index !== indexToRemove),
      },
    });
    setTempIndexToRemove(false);
  };

  return (
    <>
      <StyledDetailSectionHeader>
        Validation rules
        {userCanEdit && (
          <span style={{ marginLeft: "1rem" }}>
            <Button
              color="primary"
              label="new validation rule"
              icon={<FaPlus />}
              onClick={initValidationRule}
            />
          </span>
        )}
      </StyledDetailSectionHeader>

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
                    const validationsCopy = deepCopy(
                      validations as ITerritoryValidation[]
                    );
                    if (validationsCopy[key]) {
                      const updatedObject: ITerritoryValidation = {
                        ...validationsCopy[key],
                        ...changes,
                      };
                      const newArray = [
                        ...validationsCopy.slice(0, key),
                        updatedObject,
                        ...validationsCopy.slice(key + 1),
                      ];
                      updateEntityMutation.mutate({
                        data: {
                          validations: newArray,
                        },
                      });
                    }
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
    </>
  );
};
