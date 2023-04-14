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
import { StyledNoEntity } from "../PropGroupStyles";
import { partitivityDict, virtualityDict } from "@shared/dictionaries";

interface PropGroupRowValue {
  propValueEntity: IEntity;
  prop: IProp;
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
  setModalOpen,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div>
        {propValueEntity ? (
          <>
            <EntityDropzone
              onSelected={(newSelectedId: string) => {
                updateProp(prop.id, {
                  value: {
                    ...prop.type,
                    entityId: newSelectedId,
                  },
                });
              }}
              categoryTypes={classesPropValue}
              excludedEntities={excludedSuggesterEntities}
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
                    />
                  )
                }
              />
            </EntityDropzone>

            <div style={{ display: "inline-flex", verticalAlign: "middle" }}>
              {prop.value.logic == "2" && (
                <Button
                  key="neg"
                  tooltipLabel="Negative logic"
                  color="danger"
                  inverted
                  noBorder
                  onClick={() => setModalOpen(true)}
                  icon={<AttributeIcon attributeName={"negation"} />}
                />
              )}
            </div>
          </>
        ) : userCanEdit ? (
          <EntitySuggester
            territoryActants={territoryActants}
            onSelected={(newSelectedId: string) => {
              updateProp(prop.id, {
                value: {
                  ...prop.type,
                  entityId: newSelectedId,
                },
              });
            }}
            placeholder="value"
            openDetailOnCreate={openDetailOnCreate}
            categoryTypes={classesPropValue}
            inputWidth={80}
            excludedEntities={excludedSuggesterEntities}
            isInsideTemplate={isInsideTemplate}
            territoryParentId={territoryParentId}
          />
        ) : (
          <StyledNoEntity>-</StyledNoEntity>
        )}
      </div>
      {isExpanded && (
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {!disabledAttributes.value?.includes("logic") && (
            <div>
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
              />
            </div>
          )}
          {!disabledAttributes.value?.includes("virtuality") && (
            <div>
              <Dropdown
                width={90}
                placeholder="virtuality"
                tooltipLabel="virtuality"
                icon={<AttributeIcon attributeName="virtuality" />}
                disabled={!userCanEdit}
                options={virtualityDict}
                value={virtualityDict.find(
                  (i: any) => prop.value.virtuality === i.value
                )}
                onChange={(newValue: any) => {
                  updateProp(prop.id, {
                    value: { ...prop.value, virtuality: newValue.value },
                  });
                }}
              />
            </div>
          )}
          {!disabledAttributes.value?.includes("partitivity") && (
            <div>
              <Dropdown
                width={120}
                placeholder="partitivity"
                tooltipLabel="partitivity"
                icon={<AttributeIcon attributeName="partitivity" />}
                disabled={!userCanEdit}
                options={partitivityDict}
                value={partitivityDict.find(
                  (i: any) => prop.value.partitivity === i.value
                )}
                onChange={(newValue: any) => {
                  updateProp(prop.id, {
                    value: { ...prop.value, partitivity: newValue.value },
                  });
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};