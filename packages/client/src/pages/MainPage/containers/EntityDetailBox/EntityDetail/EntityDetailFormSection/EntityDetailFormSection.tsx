import {
  actantLogicalTypeDict,
  entitiesDict,
  entitiesDictKeys,
  entityStatusDict,
  languageDict,
} from "@shared/dictionaries";
import { allEntities } from "@shared/dictionaries/entity";
import { EntityEnums } from "@shared/enums";
import {
  IAction,
  IOption,
  IResponseDetail,
  IResponseGeneric,
} from "@shared/types";
import { AxiosResponse } from "axios";
import { Button, Dropdown, Input, MultiInput, TypeBar } from "components";
import { AttributeButtonGroup, EntityTag } from "components/advanced";
import React from "react";
import { FaRegCopy } from "react-icons/fa";
import { UseMutationResult } from "react-query";
import { OptionTypeBase, ValueType } from "react-select";
import { toast } from "react-toastify";
import { rootTerritoryId } from "Theme/constants";
import { DropdownItem } from "types";
import {
  StyledDetailContentRow,
  StyledDetailContentRowLabel,
  StyledDetailContentRowValue,
  StyledDetailContentRowValueID,
  StyledDetailForm,
  StyledFormWrapper,
  StyledRelativePosition,
  StyledTagWrap,
} from "../EntityDetailStyles";

interface EntityDetailFormSection {
  entity: IResponseDetail;
  userCanEdit: boolean;
  updateEntityMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    any,
    unknown
  >;
  actantMode: string;
  userCanAdmin: boolean;
  isClassChangeable: boolean;
  allowedEntityChangeClasses: EntityEnums.Class[];
  templateOptions: DropdownItem[];
  setSelectedEntityType: (
    value: React.SetStateAction<EntityEnums.Class | undefined>
  ) => void;
  setShowTypeSubmit: (value: React.SetStateAction<boolean>) => void;
  handleAskForTemplateApply: (templateOptionToApply: IOption) => void;
  isTerritoryWithParent: (entity: IResponseDetail) => boolean;
  isStatementWithTerritory: (entity: IResponseDetail) => boolean;
}
export const EntityDetailFormSection: React.FC<EntityDetailFormSection> = ({
  entity,
  userCanEdit,
  updateEntityMutation,
  actantMode,
  userCanAdmin,
  isClassChangeable,
  allowedEntityChangeClasses,
  templateOptions,
  setSelectedEntityType,
  setShowTypeSubmit,
  handleAskForTemplateApply,
  isTerritoryWithParent,
  isStatementWithTerritory,
}) => {
  return (
    <>
      <StyledFormWrapper>
        <StyledDetailForm>
          <StyledDetailContentRow>
            <StyledDetailContentRowLabel>ID</StyledDetailContentRowLabel>
            <StyledDetailContentRowValue>
              <StyledDetailContentRowValueID>
                {entity.id}
                <Button
                  inverted
                  tooltipLabel="copy ID"
                  color="primary"
                  label=""
                  icon={<FaRegCopy />}
                  onClick={async () => {
                    await navigator.clipboard.writeText(entity.id);
                    toast.info("ID copied to clipboard");
                  }}
                />
              </StyledDetailContentRowValueID>
            </StyledDetailContentRowValue>
          </StyledDetailContentRow>

          {/* Entity type */}
          {isClassChangeable && (
            <StyledDetailContentRow>
              <StyledDetailContentRowLabel>
                Entity Type
              </StyledDetailContentRowLabel>
              <StyledDetailContentRowValue>
                <StyledRelativePosition>
                  <Dropdown
                    value={{
                      label: entitiesDictKeys[entity.class].label,
                      value: entitiesDictKeys[entity.class].value,
                    }}
                    options={allowedEntityChangeClasses.map(
                      (c) => entitiesDictKeys[c]
                    )}
                    onChange={(option: ValueType<OptionTypeBase, any>) => {
                      setSelectedEntityType(
                        (option as IOption).value as EntityEnums.Class
                      );
                      setShowTypeSubmit(true);
                    }}
                    width={200}
                    entityDropdown
                    disableTyping
                  />
                  <TypeBar entityLetter={entity.class} />
                </StyledRelativePosition>
              </StyledDetailContentRowValue>
            </StyledDetailContentRow>
          )}

          {/* templates */}
          <StyledDetailContentRow>
            <StyledDetailContentRowLabel>
              Apply Template
            </StyledDetailContentRowLabel>
            <StyledDetailContentRowValue>
              <Dropdown
                disabled={!userCanEdit}
                isMulti={false}
                width="full"
                options={templateOptions}
                value={templateOptions[0]}
                onChange={(templateToApply: any) => {
                  handleAskForTemplateApply(templateToApply);
                }}
              />
            </StyledDetailContentRowValue>
          </StyledDetailContentRow>

          {entity.usedTemplate && entity.usedTemplate in entity.entities && (
            <StyledDetailContentRow>
              <StyledDetailContentRowLabel>
                Applied Template
              </StyledDetailContentRowLabel>
              <StyledDetailContentRowValue>
                <EntityTag entity={entity.entities[entity.usedTemplate]} />
              </StyledDetailContentRowValue>
            </StyledDetailContentRow>
          )}

          {entity.legacyId && (
            <StyledDetailContentRow>
              <StyledDetailContentRowLabel>
                Legacy ID
              </StyledDetailContentRowLabel>
              <StyledDetailContentRowValue>
                <StyledDetailContentRowValueID>
                  {entity.legacyId}
                </StyledDetailContentRowValueID>
              </StyledDetailContentRowValue>
            </StyledDetailContentRow>
          )}

          <StyledDetailContentRow>
            <StyledDetailContentRowLabel>Label</StyledDetailContentRowLabel>
            <StyledDetailContentRowValue>
              <Input
                disabled={!userCanEdit}
                width="full"
                value={entity.label}
                onChangeFn={async (newLabel: string) => {
                  if (newLabel !== entity.label) {
                    updateEntityMutation.mutate({
                      label: newLabel,
                    });
                  }
                }}
              />
            </StyledDetailContentRowValue>
          </StyledDetailContentRow>
          <StyledDetailContentRow>
            <StyledDetailContentRowLabel>Detail</StyledDetailContentRowLabel>
            <StyledDetailContentRowValue>
              <Input
                disabled={!userCanEdit}
                width="full"
                type="textarea"
                rows={2}
                value={entity.detail}
                onChangeFn={async (newValue: string) => {
                  if (newValue !== entity.detail)
                    updateEntityMutation.mutate({ detail: newValue });
                }}
              />
            </StyledDetailContentRowValue>
          </StyledDetailContentRow>

          {/* territory parent */}
          {isTerritoryWithParent(entity) && (
            <StyledDetailContentRow>
              <StyledDetailContentRowLabel>
                Parent Territory
              </StyledDetailContentRowLabel>
              <StyledDetailContentRowValue>
                <StyledTagWrap>
                  <EntityTag
                    fullWidth
                    entity={entity.entities[entity.data.parent.territoryId]}
                    disableDoubleClick={
                      entity.data.parent.territoryId === rootTerritoryId
                    }
                    disableDrag={
                      entity.data.parent.territoryId === rootTerritoryId
                    }
                    disableTooltip={
                      entity.data.parent.territoryId === rootTerritoryId
                    }
                  />
                </StyledTagWrap>
              </StyledDetailContentRowValue>
            </StyledDetailContentRow>
          )}

          {/* statement  terriroty */}
          {isStatementWithTerritory(entity) && (
            <StyledDetailContentRow>
              <StyledDetailContentRowLabel>
                Territory
              </StyledDetailContentRowLabel>
              <StyledDetailContentRowValue>
                <EntityTag entity={entity.entities[entity.data.territory.id]} />
              </StyledDetailContentRowValue>
            </StyledDetailContentRow>
          )}
          <StyledDetailContentRow>
            <StyledDetailContentRowLabel>Status</StyledDetailContentRowLabel>
            <StyledDetailContentRowValue>
              <AttributeButtonGroup
                disabled={!userCanAdmin}
                options={[
                  {
                    longValue: entityStatusDict[0]["label"],
                    shortValue: entityStatusDict[0]["label"],
                    onClick: () => {
                      updateEntityMutation.mutate({
                        status: entityStatusDict[0]["value"],
                      });
                    },
                    selected: entityStatusDict[0]["value"] === entity.status,
                  },
                  {
                    longValue: entityStatusDict[1]["label"],
                    shortValue: entityStatusDict[1]["label"],
                    onClick: () => {
                      updateEntityMutation.mutate({
                        status: entityStatusDict[1]["value"],
                      });
                    },
                    selected: entityStatusDict[1]["value"] === entity.status,
                  },
                  {
                    longValue: entityStatusDict[2]["label"],
                    shortValue: entityStatusDict[2]["label"],
                    onClick: () => {
                      updateEntityMutation.mutate({
                        status: entityStatusDict[2]["value"],
                      });
                    },
                    selected: entityStatusDict[2]["value"] === entity.status,
                  },
                  {
                    longValue: entityStatusDict[3]["label"],
                    shortValue: entityStatusDict[3]["label"],
                    onClick: () => {
                      updateEntityMutation.mutate({
                        status: entityStatusDict[3]["value"],
                      });
                    },
                    selected: entityStatusDict[3]["value"] === entity.status,
                  },
                ]}
              />
            </StyledDetailContentRowValue>
          </StyledDetailContentRow>
          <StyledDetailContentRow>
            <StyledDetailContentRowLabel>
              Label language
            </StyledDetailContentRowLabel>
            <StyledDetailContentRowValue>
              <Dropdown
                disabled={!userCanEdit}
                isMulti={false}
                width="full"
                options={languageDict}
                value={languageDict.find(
                  (i: any) => i.value === entity.language
                )}
                onChange={(newValue: any) => {
                  updateEntityMutation.mutate({
                    language: newValue.value || EntityEnums.Language.Empty,
                  });
                }}
              />
            </StyledDetailContentRowValue>
          </StyledDetailContentRow>
          {actantMode === "entity" && entity.data?.logicalType && (
            <StyledDetailContentRow>
              <StyledDetailContentRowLabel>
                Logical Type
              </StyledDetailContentRowLabel>
              <StyledDetailContentRowValue>
                <AttributeButtonGroup
                  disabled={!userCanEdit}
                  options={[
                    {
                      longValue: actantLogicalTypeDict[0]["label"],
                      shortValue: actantLogicalTypeDict[0]["label"],
                      onClick: () => {
                        updateEntityMutation.mutate({
                          data: {
                            logicalType: actantLogicalTypeDict[0]["value"],
                          },
                        });
                      },
                      selected:
                        actantLogicalTypeDict[0]["value"] ===
                        entity.data.logicalType,
                    },
                    {
                      longValue: actantLogicalTypeDict[1]["label"],
                      shortValue: actantLogicalTypeDict[1]["label"],
                      onClick: () => {
                        updateEntityMutation.mutate({
                          data: {
                            logicalType: actantLogicalTypeDict[1]["value"],
                          },
                        });
                      },
                      selected:
                        actantLogicalTypeDict[1]["value"] ===
                        entity.data.logicalType,
                    },
                    {
                      longValue: actantLogicalTypeDict[2]["label"],
                      shortValue: actantLogicalTypeDict[2]["label"],
                      onClick: () => {
                        updateEntityMutation.mutate({
                          data: {
                            logicalType: actantLogicalTypeDict[2]["value"],
                          },
                        });
                      },
                      selected:
                        actantLogicalTypeDict[2]["value"] ===
                        entity.data.logicalType,
                    },
                    {
                      longValue: actantLogicalTypeDict[3]["label"],
                      shortValue: actantLogicalTypeDict[3]["label"],
                      onClick: () => {
                        updateEntityMutation.mutate({
                          data: {
                            logicalType: actantLogicalTypeDict[3]["value"],
                          },
                        });
                      },
                      selected:
                        actantLogicalTypeDict[3]["value"] ===
                        entity.data.logicalType,
                    },
                  ]}
                />
              </StyledDetailContentRowValue>
            </StyledDetailContentRow>
          )}

          {actantMode === "resource" && (
            <React.Fragment>
              <StyledDetailContentRow>
                <StyledDetailContentRowLabel>URL</StyledDetailContentRowLabel>
                <StyledDetailContentRowValue>
                  <Input
                    disabled={!userCanEdit}
                    value={entity.data.url}
                    width="full"
                    onChangeFn={async (newValue: string) => {
                      const oldData = { ...entity.data };
                      updateEntityMutation.mutate({
                        data: {
                          ...oldData,
                          ...{
                            url: newValue,
                          },
                        },
                      });
                    }}
                  />
                </StyledDetailContentRowValue>
              </StyledDetailContentRow>

              <StyledDetailContentRow>
                <StyledDetailContentRowLabel>
                  Base URL
                </StyledDetailContentRowLabel>
                <StyledDetailContentRowValue>
                  <Input
                    disabled={!userCanEdit}
                    value={entity.data.partValueBaseURL}
                    width="full"
                    onChangeFn={async (newValue: string) => {
                      const oldData = { ...entity.data };
                      updateEntityMutation.mutate({
                        data: {
                          ...oldData,
                          ...{
                            partValueBaseURL: newValue,
                          },
                        },
                      });
                    }}
                  />
                </StyledDetailContentRowValue>
              </StyledDetailContentRow>

              <StyledDetailContentRow>
                <StyledDetailContentRowLabel>
                  Part Label
                </StyledDetailContentRowLabel>
                <StyledDetailContentRowValue>
                  <Input
                    disabled={!userCanEdit}
                    value={entity.data.partValueLabel}
                    width="full"
                    onChangeFn={async (newValue: string) => {
                      const oldData = { ...entity.data };
                      updateEntityMutation.mutate({
                        data: {
                          ...oldData,
                          ...{
                            partValueLabel: newValue,
                          },
                        },
                      });
                    }}
                  />
                </StyledDetailContentRowValue>
              </StyledDetailContentRow>
            </React.Fragment>
          )}

          <StyledDetailContentRow>
            <br />
          </StyledDetailContentRow>
          <StyledDetailContentRow>
            <StyledDetailContentRowLabel>Notes</StyledDetailContentRowLabel>
            <StyledDetailContentRowValue>
              <MultiInput
                disabled={!userCanEdit}
                values={entity.notes}
                width="full"
                onChange={(newValues: string[]) => {
                  updateEntityMutation.mutate({ notes: newValues });
                }}
              />
            </StyledDetailContentRowValue>
          </StyledDetailContentRow>
        </StyledDetailForm>
      </StyledFormWrapper>
    </>
  );
};
