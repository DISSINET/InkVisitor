import { IEntity, IResponseDetail, IResponseGeneric } from "@shared/types";
import {
  EProtocolTieType,
  ITerritory,
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
  StyledDetailSectionHeading,
  StyledValidationList,
} from "../EntityDetailStyles";
import { EntityDetailValidationRule } from "./EntityDetailValidationRule/EntityDetailValidationRule";
import { EntityDetailSectionButtons } from "../EntityDetailSectionButtons/EntityDetailSectionButtons";
import { toast } from "react-toastify";
import { DProps } from "constructors";
import { EntityEnums } from "@shared/enums";
import api from "api";

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
  entity: IResponseDetail;
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
  entity,
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

  const [showBatchRemoveSubmit, setShowBatchRemoveSubmit] = useState(false);

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
        {userCanEdit && (
          <EntityDetailSectionButtons
            entityId={entity.id}
            suggesterCategoryTypes={[EntityEnums.Class.Territory]}
            setShowSubmit={setShowBatchRemoveSubmit}
            removeBtnTooltip="remove all validations from entity"
            removeBtnDisabled={!entity.data.validations.length}
            handleCopyFromEntity={(pickedEntity, replace) => {
              api.detailGet(pickedEntity.id).then((data) => {
                const otherValidations = (data.data as ITerritory).data
                  .validations;
                if (otherValidations && otherValidations.length > 0) {
                  if (replace) {
                    updateEntityMutation.mutate({
                      data: {
                        validations: otherValidations,
                      },
                    });
                  } else {
                    if (validations) {
                      updateEntityMutation.mutate({
                        data: {
                          validations: [...validations, ...otherValidations],
                        },
                      });
                    } else {
                      updateEntityMutation.mutate({
                        data: {
                          validations: otherValidations,
                        },
                      });
                    }
                  }
                } else {
                  toast.info("no validations");
                }
              });
            }}
          />
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
      <Submit
        show={showBatchRemoveSubmit}
        title="Remove validation rules"
        text="Do you really want to remove all validation rules?"
        onSubmit={() => {
          updateEntityMutation.mutate({
            data: {
              validations: [],
            },
          });
          setShowBatchRemoveSubmit(false);
        }}
        onCancel={() => setShowBatchRemoveSubmit(false)}
      />
    </>
  );
};
