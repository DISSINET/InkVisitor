import { IEntity, IProp } from "@shared/types";
import { excludedSuggesterEntities } from "Theme/constants";
import { AttributeIcon, Button, Dropdown } from "components";
import {
  BasicDropdown,
  ElvlButtonGroup,
  EntityDropzone,
  EntitySuggester,
  EntityTag,
  LogicButtonGroup,
} from "components/advanced";
import React from "react";
import { PropAttributeFilter, classesPropType } from "types";
import {
  StyledAttributesFlexColumn,
  StyledAttributesFlexRow,
  StyledNoEntity,
  StyledTagGrid,
} from "./PropGroupRowStyles";
import { partitivityDict, virtualityDict } from "@shared/dictionaries";

interface PropGroupRowType {
  prop: IProp;
  propTypeEntity?: IEntity;
  updateProp: (propId: string, changes: any, instantUpdate?: boolean) => void;
  userCanEdit: boolean;
  isInsideTemplate: boolean;
  territoryParentId?: string;
  territoryActants: string[];
  isExpanded: boolean;
  disabledAttributes: PropAttributeFilter;
  openDetailOnCreate: boolean;
}
export const PropGroupRowType: React.FC<PropGroupRowType> = ({
  propTypeEntity,
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
        {propTypeEntity ? (
          <>
            <EntityDropzone
              onSelected={(newSelectedId: string) => {
                updateProp(
                  prop.id,
                  {
                    type: {
                      ...prop.type,
                      entityId: newSelectedId,
                    },
                  },
                  true
                );
              }}
              categoryTypes={classesPropType}
              excludedEntityClasses={excludedSuggesterEntities}
              isInsideTemplate={isInsideTemplate}
              territoryParentId={territoryParentId}
              excludedActantIds={[propTypeEntity.id]}
            >
              <EntityTag
                entity={propTypeEntity}
                fullWidth
                tooltipPosition="right"
                unlinkButton={
                  userCanEdit && {
                    onClick: () => {
                      updateProp(prop.id, {
                        type: {
                          ...prop.type,
                          entityId: "",
                        },
                      });
                    },
                  }
                }
                elvlButtonGroup={
                  !disabledAttributes.type?.includes("elvl") && (
                    <ElvlButtonGroup
                      value={prop.type.elvl}
                      onChange={(elvl) =>
                        updateProp(prop.id, {
                          type: {
                            ...prop.type,
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

            {prop.type.logic == "2" && (
              <Button
                key="neg"
                tooltipLabel="Negative logic"
                color="danger"
                inverted
                noBorder
                icon={<AttributeIcon attributeName="negation" />}
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
                  type: {
                    ...prop.type,
                    entityId: newSelectedId,
                  },
                },
                true
              );
            }}
            placeholder="type"
            openDetailOnCreate={openDetailOnCreate}
            categoryTypes={classesPropType}
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
            {!disabledAttributes.type?.includes("logic") && (
              <LogicButtonGroup
                border
                value={prop.type.logic}
                onChange={(logic) =>
                  updateProp(prop.id, {
                    type: { ...prop.type, logic: logic },
                  })
                }
                disabled={!userCanEdit}
              />
            )}
            {!disabledAttributes.type?.includes("virtuality") && (
              <BasicDropdown
                width={100}
                placeholder="virtuality"
                tooltipLabel="virtuality"
                icon={<AttributeIcon attributeName="virtuality" />}
                disabled={!userCanEdit}
                options={virtualityDict}
                value={prop.type.virtuality}
                onChange={(newValue) => {
                  updateProp(prop.id, {
                    type: { ...prop.type, virtuality: newValue },
                  });
                }}
              />
              // <Dropdown
              //   width={100}
              //   placeholder="virtuality"
              //   tooltipLabel="virtuality"
              //   icon={<AttributeIcon attributeName="virtuality" />}
              //   disabled={!userCanEdit}
              //   options={virtualityDict}
              //   value={virtualityDict.find(
              //     (i: any) => prop.type.virtuality === i.value
              //   )}
              //   onChange={(selectedOption) => {
              //     updateProp(prop.id, {
              //       type: { ...prop.type, virtuality: selectedOption[0].value },
              //     });
              //   }}
              // />
            )}
          </StyledAttributesFlexRow>
          <StyledAttributesFlexRow>
            {!disabledAttributes.type?.includes("partitivity") && (
              <BasicDropdown
                width={150}
                placeholder="partitivity"
                tooltipLabel="partitivity"
                icon={<AttributeIcon attributeName="partitivity" />}
                disabled={!userCanEdit}
                options={partitivityDict}
                value={prop.type.partitivity}
                onChange={(newValue) => {
                  updateProp(prop.id, {
                    type: {
                      ...prop.type,
                      partitivity: newValue,
                    },
                  });
                }}
              />
              // <Dropdown
              //   width={150}
              //   placeholder="partitivity"
              //   tooltipLabel="partitivity"
              //   icon={<AttributeIcon attributeName="partitivity" />}
              //   disabled={!userCanEdit}
              //   options={partitivityDict}
              //   value={partitivityDict.find(
              //     (i) => prop.type.partitivity === i.value
              //   )}
              //   onChange={(selectedOption) => {
              //     updateProp(prop.id, {
              //       type: {
              //         ...prop.type,
              //         partitivity: selectedOption[0].value,
              //       },
              //     });
              //   }}
              // />
            )}
          </StyledAttributesFlexRow>
        </>
      )}
    </StyledAttributesFlexColumn>
  );
};
