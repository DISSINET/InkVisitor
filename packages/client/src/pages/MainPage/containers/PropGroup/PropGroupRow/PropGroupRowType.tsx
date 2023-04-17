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
import { PropAttributeFilter, classesPropType } from "types";
import {
  StyledAttributesFlexColumn,
  StyledAttributesFlexRow,
  StyledNoEntity,
} from "./PropGroupRowStyles";
import { partitivityDict, virtualityDict } from "@shared/dictionaries";

interface PropGroupRowType {
  prop: IProp;
  propTypeEntity?: IEntity;
  updateProp: (propId: string, changes: any) => void;
  userCanEdit: boolean;
  isInsideTemplate: boolean;
  territoryParentId?: string;
  territoryActants: string[];
  isExpanded: boolean;
  disabledAttributes: PropAttributeFilter;
  openDetailOnCreate: boolean;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
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
  setModalOpen,
}) => {
  return (
    <StyledAttributesFlexColumn>
      <StyledAttributesFlexRow noGap>
        {propTypeEntity ? (
          <>
            <EntityDropzone
              onSelected={(newSelectedId: string) => {
                updateProp(prop.id, {
                  type: {
                    ...prop.type,
                    entityId: newSelectedId,
                  },
                });
              }}
              categoryTypes={classesPropType}
              excludedEntities={excludedSuggesterEntities}
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
                    />
                  )
                }
              />
            </EntityDropzone>
            <div>
              {prop.type.logic == "2" && (
                <Button
                  key="neg"
                  tooltipLabel="Negative logic"
                  color="danger"
                  inverted
                  noBorder
                  onClick={() => setModalOpen(true)}
                  icon={<AttributeIcon attributeName="negation" />}
                />
              )}
            </div>
          </>
        ) : userCanEdit ? (
          <EntitySuggester
            territoryActants={territoryActants}
            onSelected={(newSelectedId: string) => {
              updateProp(prop.id, {
                type: {
                  ...prop.type,
                  entityId: newSelectedId,
                },
              });
            }}
            placeholder="type"
            openDetailOnCreate={openDetailOnCreate}
            categoryTypes={classesPropType}
            inputWidth={80}
            excludedEntities={excludedSuggesterEntities}
            isInsideTemplate={isInsideTemplate}
            territoryParentId={territoryParentId}
          />
        ) : (
          <StyledNoEntity>-</StyledNoEntity>
        )}
      </StyledAttributesFlexRow>
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
              />
            )}
            {!disabledAttributes.type?.includes("virtuality") && (
              <Dropdown
                width={90}
                placeholder="virtuality"
                tooltipLabel="virtuality"
                icon={<AttributeIcon attributeName="virtuality" />}
                disabled={!userCanEdit}
                options={virtualityDict}
                value={virtualityDict.find(
                  (i: any) => prop.type.virtuality === i.value
                )}
                onChange={(newValue: any) => {
                  updateProp(prop.id, {
                    type: { ...prop.type, virtuality: newValue.value },
                  });
                }}
              />
            )}
          </StyledAttributesFlexRow>
          {!disabledAttributes.type?.includes("partitivity") && (
            <Dropdown
              width={120}
              placeholder="partitivity"
              tooltipLabel="partitivity"
              icon={<AttributeIcon attributeName="partitivity" />}
              disabled={!userCanEdit}
              options={partitivityDict}
              value={partitivityDict.find(
                (i: any) => prop.type.partitivity === i.value
              )}
              onChange={(newValue: any) => {
                updateProp(prop.id, {
                  type: { ...prop.type, partitivity: newValue.value },
                });
              }}
            />
          )}
        </>
      )}
    </StyledAttributesFlexColumn>
  );
};
