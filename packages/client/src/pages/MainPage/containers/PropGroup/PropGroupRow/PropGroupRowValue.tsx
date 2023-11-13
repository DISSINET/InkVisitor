import { IEntity, IProp } from "@shared/types";
import { excludedSuggesterEntities } from "Theme/constants";
import { AttributeIcon, Button, Dropdown } from "components";
import {
  ElvlButtonGroup,
  EntityDropzone,
  EntitySuggester,
  EntityTag,
  LogicButtonGroup,
} from "components/advanced";
import React from "react";
import { PropAttributeFilter, classesPropValue } from "types";
import {
  StyledAttributesFlexColumn,
  StyledAttributesFlexRow,
  StyledNoEntity,
  StyledTagGrid,
} from "./PropGroupRowStyles";
import { partitivityDict, virtualityDict } from "@shared/dictionaries";

interface PropGroupRowValue {
  propValueEntity: IEntity;
  prop: IProp;
  updateProp: (propId: string, changes: any, instantUpdate?: true) => void;
  userCanEdit: boolean;
  isInsideTemplate: boolean;
  territoryParentId?: string;
  territoryActants: string[];
  isExpanded: boolean;
  disabledAttributes: PropAttributeFilter;
  openDetailOnCreate: boolean;
}
export const PropGroupRowValue: React.FC<PropGroupRowValue> = ({
  propValueEntity,
  prop,
  updateProp,
  userCanEdit,
  isInsideTemplate,
  territoryParentId,
  territoryActants,
  isExpanded,
  disabledAttributes,
  openDetailOnCreate,
}) => {
  return (
    <StyledAttributesFlexColumn>
      <StyledTagGrid>
        {propValueEntity ? (
          <>
            <EntityDropzone
              onSelected={(newSelectedId: string) => {
                updateProp(
                  prop.id,
                  {
                    value: {
                      ...prop.value,
                      entityId: newSelectedId,
                    },
                  },
                  true
                );
              }}
              categoryTypes={classesPropValue}
              excludedEntityClasses={excludedSuggesterEntities}
              isInsideTemplate={isInsideTemplate}
              territoryParentId={territoryParentId}
              excludedActantIds={[propValueEntity.id]}
            >
              <EntityTag
                entity={propValueEntity}
                fullWidth
                tooltipPosition="right"
                unlinkButton={
                  userCanEdit && {
                    onClick: () => {
                      updateProp(prop.id, {
                        value: {
                          ...prop.value,
                          entityId: "",
                        },
                      });
                    },
                  }
                }
                elvlButtonGroup={
                  !disabledAttributes.value?.includes("elvl") && (
                    <ElvlButtonGroup
                      value={prop.value.elvl}
                      onChange={(elvl) =>
                        updateProp(prop.id, {
                          value: {
                            ...prop.value,
                            elvl: elvl,
                          },
                        })
                      }
                      disabled={!userCanEdit}
                    />
                  )
                }
              />
            </EntityDropzone>

            {prop.value.logic == "2" && (
              <Button
                key="neg"
                tooltipLabel="Negative logic"
                color="danger"
                inverted
                noBorder
                icon={<AttributeIcon attributeName={"negation"} />}
              />
            )}
          </>
        ) : userCanEdit ? (
          <EntitySuggester
            territoryActants={territoryActants}
            onSelected={(newSelectedId: string) => {
              updateProp(
                prop.id,
                {
                  value: {
                    ...prop.value,
                    entityId: newSelectedId,
                  },
                },
                true
              );
            }}
            placeholder="value"
            openDetailOnCreate={openDetailOnCreate}
            categoryTypes={classesPropValue}
            inputWidth={80}
            excludedEntityClasses={excludedSuggesterEntities}
            isInsideTemplate={isInsideTemplate}
            territoryParentId={territoryParentId}
          />
        ) : (
          <StyledNoEntity>-</StyledNoEntity>
        )}
      </StyledTagGrid>
      {isExpanded && (
        <>
          <StyledAttributesFlexRow>
            {!disabledAttributes.value?.includes("logic") && (
              <LogicButtonGroup
                border
                value={prop.value.logic}
                onChange={(logic) =>
                  updateProp(prop.id, {
                    value: {
                      ...prop.value,
                      logic: logic,
                    },
                  })
                }
                disabled={!userCanEdit}
              />
            )}
            {!disabledAttributes.value?.includes("virtuality") && (
              <Dropdown
                width={100}
                placeholder="virtuality"
                tooltipLabel="virtuality"
                icon={<AttributeIcon attributeName="virtuality" />}
                disabled={!userCanEdit}
                options={virtualityDict}
                value={virtualityDict.find(
                  (i: any) => prop.value.virtuality === i.value
                )}
                onChange={(selectedOption) => {
                  updateProp(prop.id, {
                    value: {
                      ...prop.value,
                      virtuality: selectedOption[0].value,
                    },
                  });
                }}
              />
            )}
          </StyledAttributesFlexRow>
          <StyledAttributesFlexRow>
            {!disabledAttributes.value?.includes("partitivity") && (
              <Dropdown
                width={150}
                placeholder="partitivity"
                tooltipLabel="partitivity"
                icon={<AttributeIcon attributeName="partitivity" />}
                disabled={!userCanEdit}
                options={partitivityDict}
                value={partitivityDict.find(
                  (i: any) => prop.value.partitivity === i.value
                )}
                onChange={(selectedOption) => {
                  updateProp(prop.id, {
                    value: {
                      ...prop.value,
                      partitivity: selectedOption[0].value,
                    },
                  });
                }}
              />
            )}
          </StyledAttributesFlexRow>
        </>
      )}
    </StyledAttributesFlexColumn>
  );
};
