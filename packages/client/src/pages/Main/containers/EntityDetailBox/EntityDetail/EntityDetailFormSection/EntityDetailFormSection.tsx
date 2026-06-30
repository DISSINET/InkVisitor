import {
  actantLogicalTypeDict,
  actionPartOfSpeechDict,
  conceptPartOfSpeechDict,
  entitiesDictKeys,
  entityStatusDict,
  languageDict,
} from "@inkvisitor/shared/dictionaries";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import {
  IActionData,
  IDocument,
  IEntity,
  IResponseDetail,
  IResponseGeneric,
  ITerritory,
} from "@inkvisitor/shared/types";
import { IConceptData } from "@inkvisitor/shared/types/concept";
import { useMutation, UseMutationResult, useQueryClient } from "@tanstack/react-query";
import { useDocumentsQuery } from "hooks/react-query";
import { MIN_LABEL_LENGTH_MESSAGE, rootTerritoryId } from "Theme/constants";
import api from "api";
import { AxiosResponse } from "axios";
import { Button, Input, MultiInput } from "components";
import Dropdown, {
  AttributeButtonGroup,
  EntitySuggester,
  EntityTag,
  TerritoryActionModal,
} from "components/advanced";
import React, { useEffect, useMemo, useState } from "react";
import { FaExternalLinkAlt, FaRegCopy } from "react-icons/fa";
import { TbHomeMove } from "react-icons/tb";
import { toast } from "react-toastify";
import { DropdownItem } from "@inkvisitor/shared/types";
import { getEntityStatusIcon } from "utils/iconUtils";
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
import { EntityDetailFormSectionAlternativeLabels } from "./EntityDetailFormSectionAlternativeLabels/EntityDetailFormSectionAlternativeLabels";

interface EntityDetailFormSection {
  entity: IResponseDetail;
  userCanEdit: boolean;
  updateEntityMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    Partial<IEntity>,
    unknown
  >;
  actantMode: string;
  userCanAdmin: boolean;
  isClassChangeable: boolean;
  allowedEntityChangeClasses: EntityEnums.Class[];
  templateOptions: DropdownItem[];
  setSelectedEntityType: (value: React.SetStateAction<EntityEnums.Class | undefined>) => void;
  setShowTypeSubmit: (value: React.SetStateAction<boolean>) => void;
  handleAskForTemplateApply: (templateIdToApply: string) => void;
  onTemplateDropdownFocus?: () => void;
  isTerritoryWithParent: (entity: IResponseDetail) => boolean;
  isStatementWithTerritory: (entity: IResponseDetail) => boolean;
  widthTooNarrow: boolean;
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
  onTemplateDropdownFocus,
  isTerritoryWithParent,
  isStatementWithTerritory,
  widthTooNarrow,
}) => {
  const { data: documents, refetch: refetchDocuments } = useDocumentsQuery(
    actantMode === "resource",
  );

  const noDocumentLinkedItem: DropdownItem = {
    value: "",
    label: "no document linked",
  };
  const documentOptions: DropdownItem[] = useMemo(() => {
    const options = [noDocumentLinkedItem];
    documents?.forEach((doc: IDocument) => {
      options.push({
        value: doc.id,
        label: doc.title,
      });
    });
    return options;
  }, [documents]);

  const selectedDocumentOption: string = useMemo(() => {
    return entity.data.documentId ?? noDocumentLinkedItem.value;
  }, [documentOptions, entity.data.documentId]);

  // make the selected label the first one so it will be displayed as the main one
  const handlePromoteLabel = (label: string) => {
    updateEntityMutation.mutate({
      labels: [label, ...entity.labels.filter((l) => l !== label)],
    });
  };

  const [newLabel, setNewLabel] = useState<string>(entity.labels[0]);

  useEffect(() => {
    setNewLabel(entity.labels[0]);
  }, [entity.labels[0]]);

  const isOwner = (localStorage.getItem("userrole") as UserEnums.Role) === UserEnums.Role.Owner;

  const [showTActionModal, setShowTActionModal] = useState(false);
  const [moveToParentEntity, setMoveToParentEntity] = useState<IEntity | false>(false);
  const excludedMoveTerritories = useMemo(
    () =>
      entity.class === EntityEnums.Class.Territory
        ? entity.data.parent?.territoryId
          ? [rootTerritoryId, entity.data.parent.territoryId]
          : [rootTerritoryId]
        : [],
    [entity.class, entity.data.parent?.territoryId],
  );

  const queryClient = useQueryClient();

  const updateTerritoryMutation = useMutation({
    mutationFn: async (tObject: { territoryId: string; changes: Partial<ITerritory> }) =>
      await api.entityUpdate(tObject?.territoryId, tObject?.changes),
    onSuccess: () =>
      // data: IResponseGeneric,
      // variables: { territoryId: string; changes: Partial<ITerritory> }
      {
        queryClient.invalidateQueries({ queryKey: ["tree"] });
        queryClient.invalidateQueries({ queryKey: ["territory"] });
        queryClient.invalidateQueries({ queryKey: ["entity"] });
      },
  });

  const isTemplateDisabled = useMemo<boolean>(() => {
    return !userCanEdit || templateOptions.length === 0;
  }, [userCanEdit, templateOptions]);

  const templateApplied = useMemo<IEntity | undefined>(() => {
    return entity.usedTemplate && entity.usedTemplate in entity.entities
      ? entity.entities[entity.usedTemplate]
      : undefined;
  }, [entity.usedTemplate, entity.entities]);

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
              <StyledDetailContentRowLabel>Entity Type</StyledDetailContentRowLabel>
              <StyledDetailContentRowValue>
                <StyledRelativePosition>
                  <Dropdown.Single.Entity
                    value={entity.class}
                    options={allowedEntityChangeClasses.map((c) => entitiesDictKeys[c])}
                    onChange={(selectedOption) => {
                      setSelectedEntityType(selectedOption);
                      setShowTypeSubmit(true);
                    }}
                    width="full"
                    disableTyping
                  />
                </StyledRelativePosition>
              </StyledDetailContentRowValue>
            </StyledDetailContentRow>
          )}

          {/* templates */}
          <StyledDetailContentRow>
            <StyledDetailContentRowLabel>Apply Template</StyledDetailContentRowLabel>
            <StyledDetailContentRowValue>
              <Dropdown.Single.Basic
                key={"template-dropdown-" + entity.id}
                placeholder="select template.."
                disabled={isTemplateDisabled}
                width="full"
                value={null}
                options={templateOptions}
                onFocus={onTemplateDropdownFocus}
                onChange={handleAskForTemplateApply}
              />
            </StyledDetailContentRowValue>
          </StyledDetailContentRow>

          {templateApplied && (
            <StyledDetailContentRow>
              <StyledDetailContentRowLabel>Applied Template</StyledDetailContentRowLabel>
              <StyledDetailContentRowValue>
                <StyledTagWrap>
                  <EntityTag entity={templateApplied} fullWidth />
                </StyledTagWrap>
              </StyledDetailContentRowValue>
            </StyledDetailContentRow>
          )}

          {/* #2589 */}
          {entity.legacyId && process.env.SHOW_LEGACY_ID === "true" && (
            <StyledDetailContentRow>
              <StyledDetailContentRowLabel>Legacy ID</StyledDetailContentRowLabel>
              <StyledDetailContentRowValue>
                <StyledDetailContentRowValueID>
                  {entity.legacyId}
                  <Button
                    inverted
                    tooltipLabel="copy ID"
                    color="primary"
                    label=""
                    icon={<FaRegCopy />}
                    onClick={async () => {
                      if (entity.legacyId) {
                        await navigator.clipboard.writeText(entity.legacyId);
                        toast.info("ID copied to clipboard");
                      }
                    }}
                  />
                </StyledDetailContentRowValueID>
              </StyledDetailContentRowValue>
            </StyledDetailContentRow>
          )}

          {/* Label */}
          <StyledDetailContentRow>
            <StyledDetailContentRowLabel>Label</StyledDetailContentRowLabel>
            <StyledDetailContentRowValue>
              <Input
                disabled={!userCanEdit}
                changeOnType
                width="full"
                value={newLabel}
                onChangeFn={(newLabel: string) => setNewLabel(newLabel)}
                onBlur={() => {
                  if (entity.class !== EntityEnums.Class.Statement && newLabel.length < 1) {
                    toast.info(MIN_LABEL_LENGTH_MESSAGE);
                    setNewLabel(entity.labels[0]);
                  } else {
                    if (newLabel !== entity.labels[0]) {
                      updateEntityMutation.mutate({
                        labels: [newLabel, ...entity.labels.slice(1)],
                      });
                    }
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
                  if (newValue !== entity.detail) updateEntityMutation.mutate({ detail: newValue });
                }}
              />
            </StyledDetailContentRowValue>
          </StyledDetailContentRow>

          {/* territory parent */}
          {isTerritoryWithParent(entity) && (
            <StyledDetailContentRow>
              <StyledDetailContentRowLabel>Parent Territory</StyledDetailContentRowLabel>
              <StyledDetailContentRowValue>
                <StyledTagWrap>
                  <EntityTag
                    fullWidth
                    entity={entity.entities[entity.data.parent?.territoryId]}
                    disableDoubleClick={entity.data.parent?.territoryId === rootTerritoryId}
                    disableDrag={entity.data.parent?.territoryId === rootTerritoryId}
                    disableTooltip={entity.data.parent?.territoryId === rootTerritoryId}
                  />
                </StyledTagWrap>
                {/* move to different parent territory */}
                {entity.class === EntityEnums.Class.Territory &&
                  entity.data.parent.territoryId !== rootTerritoryId && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <EntitySuggester
                        placeholder="move"
                        disableTemplatesAccept
                        filterEditorRights
                        inputWidth={"full"}
                        disableCreate
                        categoryTypes={[EntityEnums.Class.Territory]}
                        onPicked={(selectedEntity) => {
                          setMoveToParentEntity(selectedEntity);
                          setShowTActionModal(true);
                        }}
                        excludedActantIds={excludedMoveTerritories}
                        button={
                          <Button
                            icon={<TbHomeMove size={14} />}
                            onClick={() => setShowTActionModal(true)}
                            tooltipLabel="move current territory"
                            noBackground
                            noBorder
                            inverted
                          />
                        }
                      />
                    </div>
                  )}
              </StyledDetailContentRowValue>
            </StyledDetailContentRow>
          )}

          {/* statement terriroty */}
          {isStatementWithTerritory(entity) && (
            <StyledDetailContentRow>
              <StyledDetailContentRowLabel>Territory</StyledDetailContentRowLabel>
              <StyledDetailContentRowValue>
                <EntityTag entity={entity.entities[entity.data.territory?.territoryId]} />
              </StyledDetailContentRowValue>
            </StyledDetailContentRow>
          )}
          <StyledDetailContentRow>
            <StyledDetailContentRowLabel>Status</StyledDetailContentRowLabel>
            <StyledDetailContentRowValue>
              <AttributeButtonGroup
                noMargin
                iconsOnly={widthTooNarrow}
                disabled={!userCanAdmin || (entity.id === rootTerritoryId && !isOwner)}
                options={entityStatusDict.map((entityStatusOption) => {
                  const icon = getEntityStatusIcon(entityStatusOption["value"]);

                  return {
                    longValue: entityStatusOption["label"],
                    shortValue: entityStatusOption["label"],
                    icon: widthTooNarrow ? icon : undefined,
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
            <StyledDetailContentRowLabel>Label language</StyledDetailContentRowLabel>
            <StyledDetailContentRowValue>
              <Dropdown.Single.Basic
                disabled={!userCanEdit}
                width="full"
                options={languageDict}
                value={entity.language}
                onChange={(selectedOption) => {
                  updateEntityMutation.mutate({
                    language: selectedOption || EntityEnums.Language.Empty,
                  });
                }}
              />
            </StyledDetailContentRowValue>
          </StyledDetailContentRow>

          {/* part of speech */}

          {entity.class === EntityEnums.Class.Action && (
            <StyledDetailContentRow>
              <StyledDetailContentRowLabel>Part of Speech</StyledDetailContentRowLabel>
              <StyledDetailContentRowValue>
                <Dropdown.Single.Basic
                  disabled={!userCanEdit}
                  width="full"
                  options={actionPartOfSpeechDict}
                  value={(entity.data as IActionData).pos}
                  onChange={(selectedOption) => {
                    const oldData = { ...entity.data };
                    updateEntityMutation.mutate({
                      data: {
                        ...oldData,
                        ...{
                          pos: selectedOption,
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
              <StyledDetailContentRowLabel>Part of Speech</StyledDetailContentRowLabel>
              <StyledDetailContentRowValue>
                <Dropdown.Single.Basic
                  disabled={!userCanEdit}
                  width="full"
                  options={conceptPartOfSpeechDict}
                  value={(entity.data as IConceptData).pos}
                  onChange={(selectedOption) => {
                    const oldData = { ...entity.data };
                    updateEntityMutation.mutate({
                      data: {
                        ...oldData,
                        ...{
                          pos: selectedOption,
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
              <StyledDetailContentRowLabel>Logical Type</StyledDetailContentRowLabel>
              <StyledDetailContentRowValue>
                <AttributeButtonGroup
                  noMargin
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
                      selected: actantLogicalTypeDict[0]["value"] === entity.data.logicalType,
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
                      selected: actantLogicalTypeDict[1]["value"] === entity.data.logicalType,
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
                      selected: actantLogicalTypeDict[2]["value"] === entity.data.logicalType,
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
                      selected: actantLogicalTypeDict[3]["value"] === entity.data.logicalType,
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
                  <span
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      gap: "0.5rem",
                      alignItems: "center",
                    }}
                  >
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
                    <div>
                      <Button
                        icon={<FaExternalLinkAlt />}
                        onClick={() => window.open(entity.data.url, "_blank")}
                        inverted
                        disabled={!entity.data.url}
                        tooltipLabel="open in new tab"
                      />
                    </div>
                  </span>
                </StyledDetailContentRowValue>
              </StyledDetailContentRow>

              <StyledDetailContentRow>
                <StyledDetailContentRowLabel>Base URL</StyledDetailContentRowLabel>
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
                <StyledDetailContentRowLabel>Part Label</StyledDetailContentRowLabel>
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
                <StyledDetailContentRowLabel>Linked Document</StyledDetailContentRowLabel>
                <StyledDetailContentRowValue onFocus={() => refetchDocuments()}>
                  <Dropdown.Single.Basic
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
                            documentId: selectedOption,
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

          <StyledDetailContentRow>
            <br />
          </StyledDetailContentRow>

          {entity.class !== EntityEnums.Class.Statement && (
            <StyledDetailContentRow>
              <StyledDetailContentRowLabel>Alternative labels</StyledDetailContentRowLabel>
              <StyledDetailContentRowValue>
                <EntityDetailFormSectionAlternativeLabels
                  entity={entity}
                  newLabel={newLabel}
                  updateEntityMutation={updateEntityMutation}
                  handlePromoteLabel={handlePromoteLabel}
                  userCanEdit={userCanEdit}
                />
              </StyledDetailContentRowValue>
            </StyledDetailContentRow>
          )}
        </StyledDetailForm>
      </StyledFormWrapper>

      {showTActionModal && (
        <TerritoryActionModal
          territory={entity}
          oldParentTerritory={entity.entities[entity.data.parent.territoryId]}
          selectedParentEntity={moveToParentEntity}
          onClose={() => setShowTActionModal(false)}
          setMoveToParentEntity={setMoveToParentEntity}
          showModal={showTActionModal}
          updateTerritoryMutation={updateTerritoryMutation}
          excludedMoveTerritories={excludedMoveTerritories}
        />
      )}
    </>
  );
};
