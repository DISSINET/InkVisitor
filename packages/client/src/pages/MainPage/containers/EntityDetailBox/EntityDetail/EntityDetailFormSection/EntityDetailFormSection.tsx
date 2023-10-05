import {
  actantLogicalTypeDict,
  actionPartOfSpeechDict,
  conceptPartOfSpeechDict,
  entitiesDictKeys,
  entityStatusDict,
  languageDict,
} from "@shared/dictionaries";
import { EntityEnums } from "@shared/enums";
import { IResponseDetail, IResponseGeneric } from "@shared/types";
import { UseMutationResult, useQuery } from "@tanstack/react-query";
import { rootTerritoryId } from "Theme/constants";
import api from "api";
import { AxiosResponse } from "axios";
import { Button, Dropdown, Input, MultiInput, TypeBar } from "components";
import { AttributeButtonGroup, EntityTag } from "components/advanced";
import React, { useMemo } from "react";
import { FaRegCopy } from "react-icons/fa";
import { toast } from "react-toastify";
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
  handleAskForTemplateApply: (templateOptionToApply: DropdownItem) => void;
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
  const { status: documentsStatus, data: documents } = useQuery(
    ["documents"],
    async () => {
      const res = await api.documentsGet({});
      return res.data;
    },
    { enabled: actantMode === "resource" && api.isLoggedIn() }
  );

  const noDocumentLinkedItem: DropdownItem = {
    value: "",
    label: "no document linked",
  };
  const documentOptions: DropdownItem[] = useMemo(() => {
    const options = [noDocumentLinkedItem];
    documents?.forEach((doc) => {
      options.push({
        value: doc.id,
        label: doc.title,
      });
    });
    return options;
  }, [documents]);

  const selectedDocumentOption: DropdownItem = useMemo(() => {
    return (
      documentOptions?.find((doc) => doc.value === entity.data.documentId) ??
      noDocumentLinkedItem
    );
  }, [documentOptions, entity.data.documentId]);

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
                    onChange={(selectedOption) => {
                      setSelectedEntityType(
                        selectedOption[0].value as EntityEnums.Class
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
                placeholder="select template.."
                disabled={!userCanEdit || templateOptions.length === 0}
                width="full"
                value={null}
                options={templateOptions}
                onChange={(templateToApply) => {
                  handleAskForTemplateApply(templateToApply[0]);
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
                <StyledTagWrap>
                  <EntityTag
                    entity={entity.entities[entity.usedTemplate]}
                    fullWidth
                  />
                </StyledTagWrap>
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

          {/* statement terriroty */}
          {isStatementWithTerritory(entity) && (
            <StyledDetailContentRow>
              <StyledDetailContentRowLabel>
                Territory
              </StyledDetailContentRowLabel>
              <StyledDetailContentRowValue>
                <EntityTag
                  entity={entity.entities[entity.data.territory.territoryId]}
                />
              </StyledDetailContentRowValue>
            </StyledDetailContentRow>
          )}
          <StyledDetailContentRow>
            <StyledDetailContentRowLabel>Status</StyledDetailContentRowLabel>
            <StyledDetailContentRowValue>
              <AttributeButtonGroup
                disabled={!userCanAdmin}
                options={entityStatusDict.map((entityStatusOption) => {
                  return {
                    longValue: entityStatusOption["label"],
                    shortValue: entityStatusOption["label"],
                    onClick: () => {
                      updateEntityMutation.mutate({
                        status: entityStatusOption["value"],
                      });
                    },
                    selected: entityStatusOption["value"] === entity.status,
                  };
                })}
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
                width="full"
                options={languageDict}
                value={languageDict.find(
                  (i: any) => i.value === entity.language
                )}
                onChange={(selectedOption) => {
                  updateEntityMutation.mutate({
                    language:
                      selectedOption[0].value || EntityEnums.Language.Empty,
                  });
                }}
              />
            </StyledDetailContentRowValue>
          </StyledDetailContentRow>

          {/* part of speech */}

          {entity.class === EntityEnums.Class.Action && (
            <StyledDetailContentRow>
              <StyledDetailContentRowLabel>
                Part of Speech
              </StyledDetailContentRowLabel>
              <StyledDetailContentRowValue>
                <Dropdown
                  disabled={!userCanEdit}
                  width="full"
                  options={actionPartOfSpeechDict}
                  value={actionPartOfSpeechDict.find(
                    (i: any) => i.value === entity.data.pos
                  )}
                  onChange={(selectedOption) => {
                    const oldData = { ...entity.data };
                    updateEntityMutation.mutate({
                      data: {
                        ...oldData,
                        ...{
                          pos: selectedOption[0].value,
                        },
                      },
                    });
                  }}
                />
              </StyledDetailContentRowValue>
            </StyledDetailContentRow>
          )}
          {entity.class === EntityEnums.Class.Concept && (
            <StyledDetailContentRow>
              <StyledDetailContentRowLabel>
                Part of Speech
              </StyledDetailContentRowLabel>
              <StyledDetailContentRowValue>
                <Dropdown
                  disabled={!userCanEdit}
                  width="full"
                  options={conceptPartOfSpeechDict}
                  value={conceptPartOfSpeechDict.find(
                    (i: any) => i.value === entity.data.pos
                  )}
                  onChange={(selectedOption) => {
                    const oldData = { ...entity.data };
                    updateEntityMutation.mutate({
                      data: {
                        ...oldData,
                        ...{
                          pos: selectedOption[0].value,
                        },
                      },
                    });
                  }}
                />
              </StyledDetailContentRowValue>
            </StyledDetailContentRow>
          )}

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

              {/* document id */}
              <StyledDetailContentRow>
                <StyledDetailContentRowLabel>
                  Linked Document
                </StyledDetailContentRowLabel>
                <StyledDetailContentRowValue>
                  <Dropdown
                    disabled={!userCanEdit}
                    value={selectedDocumentOption}
                    width="full"
                    options={documentOptions}
                    onChange={(selectedOption) => {
                      const oldData = { ...entity.data };
                      updateEntityMutation.mutate({
                        data: {
                          ...oldData,
                          ...{
                            documentId: selectedOption[0].value,
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
