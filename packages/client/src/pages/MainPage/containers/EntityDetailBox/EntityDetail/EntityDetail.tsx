import {
  actantLogicalTypeDict,
  entitiesDict,
  entitiesDictKeys,
  entityStatusDict,
  languageDict,
} from "@shared/dictionaries";
import { allEntities } from "@shared/dictionaries/entity";
import { EntityClass, Language, UserRoleMode } from "@shared/enums";
import { IAction, IEntity, IOption, IProp, IReference } from "@shared/types";
import api from "api";
import {
  Button,
  Dropdown,
  Input,
  Loader,
  MultiInput,
  Submit,
  TypeBar,
} from "components";
import { StyledUsedInTitle } from "components/Table/TableStyles";
import { CMetaProp } from "constructors";
import { useSearchParams } from "hooks";
import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaRegCopy } from "react-icons/fa";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { OptionTypeBase, ValueType } from "react-select";
import { toast } from "react-toastify";
import { rootTerritoryId } from "Theme/constants";
import {
  DraggedPropRowCategory,
  DropdownItem,
  PropAttributeFilter,
} from "types";
import { AttributeButtonGroup } from "../../AttributeButtonGroup/AttributeButtonGroup";
import { AuditTable } from "../../AuditTable/AuditTable";
import { EntityReferenceTable } from "../../EntityReferenceTable/EntityReferenceTable";
import { EntityTag } from "../../EntityTag/EntityTag";
import { JSONExplorer } from "../../JSONExplorer/JSONExplorer";
import { StyledHeading } from "../../LoginModal/LoginModalStyles";
import { PropGroup } from "../../PropGroup/PropGroup";
import { ApplyTemplateModal } from "../ApplyTemplateModal/ApplyTemplateModal";
import { EntityDetailCreateTemplateModal } from "../EntityDetailCreateTemplateModal/EntityDetailCreateTemplateModal";
import {
  StyledDetailContentRow,
  StyledDetailContentRowLabel,
  StyledDetailContentRowValue,
  StyledDetailForm,
} from "../EntityDetailBoxStyles";
import { EntityDetailHeaderRow } from "../EntityDetailHeaderRow/EntityDetailHeaderRow";
import { EntityDetailMetaPropsTable } from "../EntityDetailUsedInTable/EntityDetailMetaPropsTable/EntityDetailMetaPropsTable";
import { EntityDetailStatementPropsTable } from "../EntityDetailUsedInTable/EntityDetailStatementPropsTable/EntityDetailStatementPropsTable";
import { EntityDetailStatementsTable } from "../EntityDetailUsedInTable/EntityDetailStatementsTable/EntityDetailStatementsTable";
import {
  StyledDetailContentRowValueID,
  StyledDetailSection,
  StyledDetailSectionContent,
  StyledDetailSectionContentUsedIn,
  StyledDetailSectionEntityList,
  StyledDetailSectionHeader,
  StyledDetailWrapper,
  StyledFormWrapper,
} from "./EntityDetailStyles";

const allowedEntityChangeClasses = [
  EntityClass.Value,
  EntityClass.Person,
  EntityClass.Event,
  EntityClass.Group,
  EntityClass.Location,
  EntityClass.Object,
];

interface EntityDetail {
  detailId: string;
}
export const EntityDetail: React.FC<EntityDetail> = ({ detailId }) => {
  const {
    status,
    data: entity,
    error,
    isFetching,
  } = useQuery(
    ["entity", detailId],
    async () => {
      const res = await api.detailGet(detailId);
      return res.data;
    },
    { enabled: !!detailId && api.isLoggedIn() }
  );

  const {
    statementId,
    setStatementId,
    territoryId,
    setTerritoryId,
    removeDetailId,
  } = useSearchParams();

  const [createTemplateModal, setCreateTemplateModal] =
    useState<boolean>(false);

  const [showRemoveSubmit, setShowRemoveSubmit] = useState(false);
  const [selectedEntityType, setSelectedEntityType] = useState<EntityClass>();
  const [showTypeSubmit, setShowTypeSubmit] = useState(false);
  const [usedInPage, setUsedInPage] = useState<number>(0);
  const statementsPerPage = 20;

  const [applyTemplateModal, setApplyTemplateModal] = useState<boolean>(false);
  const [templateToApply, setTemplateToApply] = useState<IEntity | false>(
    false
  );

  const handleAskForTemplateApply = (templateOptionToApply: IOption) => {
    if (templates) {
      const templateThatIsGoingToBeApplied = templates.find(
        (template: IEntity) => template.id === templateOptionToApply.value
      );

      if (templateThatIsGoingToBeApplied) {
        setTemplateToApply(templateThatIsGoingToBeApplied);
        setApplyTemplateModal(true);
      }
    }
  };

  const queryClient = useQueryClient();

  const isClassChangeable =
    entity && allowedEntityChangeClasses.includes(entity.class);

  const {
    status: templateStatus,
    data: templates,
    error: templateError,
    isFetching: isFetchingTemplates,
  } = useQuery(
    ["entity-templates", "templates", entity?.class, detailId],
    async () => {
      const res = await api.entitiesSearch({
        onlyTemplates: true,
        class: entity?.class,
      });

      const templates = res.data;
      templates.sort((a: IEntity, b: IEntity) =>
        a.label.toLocaleLowerCase() > b.label.toLocaleLowerCase() ? 1 : -1
      );
      return templates;
    },
    { enabled: !!entity && api.isLoggedIn() }
  );

  const templateOptions: DropdownItem[] = useMemo(() => {
    const options = [
      {
        value: "",
        label: "select template",
      },
    ];

    if (entity && templates) {
      templates
        .filter((template) => template.id !== entity.id)
        .forEach((template) => {
          options.push({
            value: template.id,
            label: template.label,
          });
        });
    }
    return options;
  }, [templates]);

  // Audit query
  const {
    status: statusAudit,
    data: audit,
    error: auditError,
    isFetching: isFetchingAudit,
  } = useQuery(
    ["audit", detailId],
    async () => {
      const res = await api.auditGet(detailId);
      return res.data;
    },
    { enabled: !!detailId && api.isLoggedIn() }
  );

  // refetch audit when statement changes
  useEffect(() => {
    queryClient.invalidateQueries("audit");
  }, [entity]);

  useEffect(() => {
    if (entity) {
      setSelectedEntityType(entity.class);
    }
  }, []);

  const userCanAdmin: boolean = useMemo(() => {
    return !!entity && entity.right === UserRoleMode.Admin;
  }, [entity]);

  const userCanEdit: boolean = useMemo(() => {
    return (
      !!entity &&
      (entity.right === UserRoleMode.Admin ||
        entity.right === UserRoleMode.Write)
    );
  }, [entity]);

  const updateEntityMutation = useMutation(
    async (changes: any) => await api.entityUpdate(detailId, changes),
    {
      onSuccess: (data, variables) => {
        // TODO - check this
        queryClient.invalidateQueries(["entity"]);
        queryClient.invalidateQueries("statement");

        if (statementId === detailId) {
          queryClient.invalidateQueries("statement");
        }
        if (
          variables.references !== undefined ||
          variables.detail !== undefined ||
          variables.label !== undefined ||
          variables.status ||
          variables.data?.logicalType
        ) {
          if (entity?.class === EntityClass.Territory) {
            queryClient.invalidateQueries("tree");
          }
          queryClient.invalidateQueries("territory");
          queryClient.invalidateQueries("bookmarks");
        }
        if (variables.label !== undefined) {
          queryClient.invalidateQueries("detail-tab-entities");
        }
        if (entity?.isTemplate) {
          queryClient.invalidateQueries("templates");
        }
      },
    }
  );

  const changeEntityTypeMutation = useMutation(
    async (newClass: string) =>
      await api.entityUpdate(detailId, { class: newClass }),
    {
      onSuccess: (data, variables) => {
        setShowTypeSubmit(false);
        queryClient.invalidateQueries(["entity"]);
        queryClient.invalidateQueries("statement");
        if (variables === EntityClass.Territory) {
          queryClient.invalidateQueries("tree");
        }
        queryClient.invalidateQueries("territory");
        queryClient.invalidateQueries("bookmarks");
        if (entity?.isTemplate) {
          queryClient.invalidateQueries("templates");
        }
      },
    }
  );

  const deleteEntityMutation = useMutation(
    (entityId: string) => api.entityDelete(entityId),
    {
      onSuccess: async (data, entityId) => {
        setShowRemoveSubmit(false);

        toast.info(`Entity removed!`);

        // hide selected territory if T removed

        if (
          entity &&
          entity.class == EntityClass.Territory &&
          entity.id === territoryId
        ) {
          setTerritoryId("");
        } else {
          queryClient.invalidateQueries("territory");
        }

        // hide editor box if the removed entity was also opened in the editor
        if (
          entity &&
          entity.class == EntityClass.Statement &&
          entity.id === statementId
        ) {
          setStatementId("");
        } else {
          queryClient.invalidateQueries("statement");
        }

        queryClient.invalidateQueries("tree");
      },
    }
  );

  // Props handling

  // adding only second or third level
  // function adding the first level prop is in the button
  const addMetaProp = (originId: string) => {
    if (entity) {
      const newProp = CMetaProp();
      const newProps = [...entity.props];

      newProps.forEach((prop1, pi1) => {
        if (prop1.id === originId) {
          newProps[pi1].children = [...newProps[pi1].children, newProp];
        }

        // 3rd level
        newProps[pi1].children.forEach((prop2, pi2) => {
          if (prop2.id == originId) {
            newProps[pi1].children[pi2].children = [
              ...newProps[pi1].children[pi2].children,
              newProp,
            ];
          }
        });
      });

      updateEntityMutation.mutate({ props: newProps });
    }
  };

  const updateProp = (propId: string, changes: any) => {
    if (entity) {
      const newProps = [...entity.props];

      newProps.forEach((prop1, pi1) => {
        // 1st level
        if (prop1.id === propId) {
          newProps[pi1] = { ...newProps[pi1], ...changes };
        }

        // 2nd level
        prop1.children.forEach((prop2, pi2) => {
          if (prop2.id === propId) {
            newProps[pi1].children[pi2] = {
              ...newProps[pi1].children[pi2],
              ...changes,
            };
          }

          // 3rd level
          prop1.children[pi2].children.forEach((prop3, pi3) => {
            if (prop3.id === propId) {
              newProps[pi1].children[pi2].children[pi3] = {
                ...newProps[pi1].children[pi2].children[pi3],
                ...changes,
              };
            }
          });
        });
      });
      updateEntityMutation.mutate({ props: newProps });
    }
  };

  const removeProp = (propId: string) => {
    if (entity) {
      const newProps = [...entity.props].filter(
        (prop, pi) => prop.id !== propId
      );

      // 2nd level
      newProps.forEach((prop1, pi1) => {
        newProps[pi1].children = prop1.children.filter(
          (child) => child.id !== propId
        );

        // 3rd level
        newProps[pi1].children.forEach((prop2, pi2) => {
          newProps[pi1].children[pi2].children = newProps[pi1].children[
            pi2
          ].children.filter((child) => child.id !== propId);
        });
      });

      updateEntityMutation.mutate({ props: newProps });
    }
  };

  const changeOrder = (
    propId: string,
    props: IProp[],
    oldIndex: number,
    newIndex: number
  ) => {
    for (let prop of props) {
      if (prop.id === propId) {
        props.splice(newIndex, 0, props.splice(oldIndex, 1)[0]);
        return props;
      }
      for (let prop1 of prop.children) {
        if (prop1.id === propId) {
          prop.children.splice(
            newIndex,
            0,
            prop.children.splice(oldIndex, 1)[0]
          );
          return props;
        }
        for (let prop2 of prop1.children) {
          if (prop2.id === propId) {
            prop1.children.splice(
              newIndex,
              0,
              prop1.children.splice(oldIndex, 1)[0]
            );
            return props;
          }
        }
      }
    }
    return props;
  };

  const movePropToIndex = (
    propId: string,
    oldIndex: number,
    newIndex: number
  ) => {
    if (entity) {
      const newProps = [...entity.props];
      changeOrder(propId, newProps, oldIndex, newIndex);

      updateEntityMutation.mutate({ props: newProps });
    }
  };

  useEffect(() => {
    if (error && (error as any).error === "EntityDoesNotExist") {
      removeDetailId(detailId);
    }
  }, [error]);

  const usedInPages = useMemo(() => {
    if (entity && entity.usedInStatement) {
      return Math.ceil(entity.usedInStatement.length / statementsPerPage);
    } else {
      return 0;
    }
  }, [detailId, entity]);

  useEffect(() => {
    setUsedInPage(0);
  }, [detailId]);

  const mayBeRemoved = useMemo(() => {
    return (
      entity && entity.usedInStatement && entity.usedInStatement.length === 0
    );
  }, [entity]);

  const actantMode = useMemo(() => {
    const actantClass = entity?.class;
    if (actantClass) {
      if (actantClass === EntityClass.Action) {
        return "action";
      } else if (actantClass === EntityClass.Territory) {
        return "territory";
      } else if (actantClass === EntityClass.Resource) {
        return "resource";
      } else if (actantClass === EntityClass.Concept) {
        return "concept";
      }
    }
    return "entity";
  }, [entity]);

  return (
    <>
      {entity && (
        <>
          <EntityDetailHeaderRow
            entity={entity}
            userCanEdit={userCanEdit}
            mayBeRemoved={mayBeRemoved}
            setShowRemoveSubmit={setShowRemoveSubmit}
            setCreateTemplateModal={setCreateTemplateModal}
          />

          <StyledDetailWrapper>
            {/* form section */}
            <StyledDetailSection firstSection>
              <StyledDetailSectionContent firstSection>
                <StyledFormWrapper>
                  <StyledDetailForm>
                    <StyledDetailContentRow>
                      <StyledDetailContentRowLabel>
                        ID
                      </StyledDetailContentRowLabel>
                      <StyledDetailContentRowValue>
                        <StyledDetailContentRowValueID>
                          {entity.id}
                          <Button
                            inverted
                            tooltip="copy ID"
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
                          <div style={{ position: "relative" }}>
                            <Dropdown
                              value={{
                                label: entitiesDictKeys[entity.class].label,
                                value: entitiesDictKeys[entity.class].value,
                              }}
                              options={allowedEntityChangeClasses.map(
                                (c) => entitiesDictKeys[c]
                              )}
                              onChange={(
                                option: ValueType<OptionTypeBase, any>
                              ) => {
                                setSelectedEntityType(
                                  (option as IOption).value as EntityClass
                                );
                                setShowTypeSubmit(true);
                                // TODO: submit modal => change category mutation
                              }}
                              width={76}
                              entityDropdown
                              disableTyping
                            />
                            <TypeBar entityLetter={entity.class} />
                          </div>
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
                      <StyledDetailContentRowLabel>
                        Label
                      </StyledDetailContentRowLabel>
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
                      <StyledDetailContentRowLabel>
                        Detail
                      </StyledDetailContentRowLabel>
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
                    {entity.class === EntityClass.Territory &&
                      entity.data.parent &&
                      Object.keys(entity.entities).includes(
                        entity.data.parent.id
                      ) && (
                        <StyledDetailContentRow>
                          <StyledDetailContentRowLabel>
                            Parent Territory
                          </StyledDetailContentRowLabel>
                          <StyledDetailContentRowValue>
                            <EntityTag
                              actant={entity.entities[entity.data.parent.id]}
                              disableDoubleClick={
                                entity.data.parent.id === rootTerritoryId
                              }
                              disableDrag={
                                entity.data.parent.id === rootTerritoryId
                              }
                              disableTooltip={
                                entity.data.parent.id === rootTerritoryId
                              }
                            />
                          </StyledDetailContentRowValue>
                        </StyledDetailContentRow>
                      )}

                    {/* statement  terriroty */}
                    {entity.class === EntityClass.Statement &&
                      entity.data.territory &&
                      Object.keys(entity.entities).includes(
                        entity.data.territory.id
                      ) && (
                        <StyledDetailContentRow>
                          <StyledDetailContentRowLabel>
                            Territory
                          </StyledDetailContentRowLabel>
                          <StyledDetailContentRowValue>
                            <EntityTag
                              actant={entity.entities[entity.data.territory.id]}
                            />
                          </StyledDetailContentRowValue>
                        </StyledDetailContentRow>
                      )}
                    <StyledDetailContentRow>
                      <StyledDetailContentRowLabel>
                        Status
                      </StyledDetailContentRowLabel>
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
                              selected:
                                entityStatusDict[0]["value"] === entity.status,
                            },
                            {
                              longValue: entityStatusDict[1]["label"],
                              shortValue: entityStatusDict[1]["label"],
                              onClick: () => {
                                updateEntityMutation.mutate({
                                  status: entityStatusDict[1]["value"],
                                });
                              },
                              selected:
                                entityStatusDict[1]["value"] === entity.status,
                            },
                            {
                              longValue: entityStatusDict[2]["label"],
                              shortValue: entityStatusDict[2]["label"],
                              onClick: () => {
                                updateEntityMutation.mutate({
                                  status: entityStatusDict[2]["value"],
                                });
                              },
                              selected:
                                entityStatusDict[2]["value"] === entity.status,
                            },
                            {
                              longValue: entityStatusDict[3]["label"],
                              shortValue: entityStatusDict[3]["label"],
                              onClick: () => {
                                updateEntityMutation.mutate({
                                  status: entityStatusDict[3]["value"],
                                });
                              },
                              selected:
                                entityStatusDict[3]["value"] === entity.status,
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
                              language: newValue.value || Language.Empty,
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
                                      logicalType:
                                        actantLogicalTypeDict[0]["value"],
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
                                      logicalType:
                                        actantLogicalTypeDict[1]["value"],
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
                                      logicalType:
                                        actantLogicalTypeDict[2]["value"],
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
                                      logicalType:
                                        actantLogicalTypeDict[3]["value"],
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

                    {/* Actions */}
                    {actantMode === "action" && (
                      <StyledDetailContentRow>
                        <StyledDetailContentRowLabel>
                          Subject entity type
                        </StyledDetailContentRowLabel>
                        <StyledDetailContentRowValue>
                          <Dropdown
                            allowAny
                            disabled={!userCanEdit}
                            isMulti
                            options={entitiesDict}
                            value={[allEntities]
                              .concat(entitiesDict)
                              .filter((i: any) =>
                                (entity as IAction).data.entities?.s.includes(
                                  i.value
                                )
                              )}
                            width="full"
                            noOptionsMessage={() => "no entity"}
                            placeholder={"no entity"}
                            onChange={(newValue: any) => {
                              const oldData = { ...entity.data };
                              updateEntityMutation.mutate({
                                data: {
                                  ...oldData,
                                  ...{
                                    entities: {
                                      s: newValue
                                        ? (newValue as string[]).map(
                                            (v: any) => v.value
                                          )
                                        : [],
                                      a1: entity.data.entities.a1,
                                      a2: entity.data.entities.a2,
                                    },
                                  },
                                },
                              });
                            }}
                          />
                        </StyledDetailContentRowValue>
                      </StyledDetailContentRow>
                    )}
                    {actantMode === "action" && (
                      <StyledDetailContentRow>
                        <StyledDetailContentRowLabel>
                          Subject valency
                        </StyledDetailContentRowLabel>
                        <StyledDetailContentRowValue>
                          <Input
                            disabled={!userCanEdit}
                            value={(entity as IAction).data.valencies?.s}
                            width="full"
                            onChangeFn={async (newValue: string) => {
                              const oldData = { ...entity.data };
                              updateEntityMutation.mutate({
                                data: {
                                  ...oldData,
                                  ...{
                                    valencies: {
                                      s: newValue,
                                      a1: entity.data.valencies.a1,
                                      a2: entity.data.valencies.a2,
                                    },
                                  },
                                },
                              });
                            }}
                          />
                        </StyledDetailContentRowValue>
                      </StyledDetailContentRow>
                    )}

                    {actantMode === "action" && (
                      <StyledDetailContentRow>
                        <StyledDetailContentRowLabel>
                          Actant1 entity type
                        </StyledDetailContentRowLabel>
                        <StyledDetailContentRowValue>
                          <Dropdown
                            disabled={!userCanEdit}
                            isMulti
                            options={entitiesDict}
                            value={[allEntities]
                              .concat(entitiesDict)
                              .filter((i: any) =>
                                (entity as IAction).data.entities?.a1.includes(
                                  i.value
                                )
                              )}
                            placeholder={"no entity"}
                            width="full"
                            onChange={(newValue: any) => {
                              const oldData = { ...entity.data };
                              updateEntityMutation.mutate({
                                data: {
                                  ...oldData,
                                  ...{
                                    entities: {
                                      a1: newValue
                                        ? (newValue as string[]).map(
                                            (v: any) => v.value
                                          )
                                        : [],
                                      s: entity.data.entities.s,
                                      a2: entity.data.entities.a2,
                                    },
                                  },
                                },
                              });
                            }}
                          />
                        </StyledDetailContentRowValue>
                      </StyledDetailContentRow>
                    )}

                    {actantMode === "action" && (
                      <StyledDetailContentRow>
                        <StyledDetailContentRowLabel>
                          Actant1 valency
                        </StyledDetailContentRowLabel>
                        <StyledDetailContentRowValue>
                          <Input
                            disabled={!userCanEdit}
                            value={(entity as IAction).data.valencies?.a1}
                            width="full"
                            onChangeFn={async (newValue: string) => {
                              const oldData = { ...entity.data };
                              updateEntityMutation.mutate({
                                data: {
                                  ...oldData,
                                  ...{
                                    valencies: {
                                      s: entity.data.valencies.s,
                                      a1: newValue,
                                      a2: entity.data.valencies.a2,
                                    },
                                  },
                                },
                              });
                            }}
                          />
                        </StyledDetailContentRowValue>
                      </StyledDetailContentRow>
                    )}

                    {actantMode === "action" && (
                      <StyledDetailContentRow>
                        <StyledDetailContentRowLabel>
                          Actant2 entity type
                        </StyledDetailContentRowLabel>
                        <StyledDetailContentRowValue>
                          <Dropdown
                            disabled={!userCanEdit}
                            isMulti
                            options={entitiesDict}
                            value={[allEntities]
                              .concat(entitiesDict)
                              .filter((i: any) =>
                                (entity as IAction).data.entities?.a2.includes(
                                  i.value
                                )
                              )}
                            placeholder={"no entity"}
                            width="full"
                            onChange={(newValue: any) => {
                              const oldData = { ...entity.data };

                              updateEntityMutation.mutate({
                                data: {
                                  ...oldData,
                                  ...{
                                    entities: {
                                      a2: newValue
                                        ? (newValue as string[]).map(
                                            (v: any) => v.value
                                          )
                                        : [],
                                      s: entity.data.entities.s,
                                      a1: entity.data.entities.a1,
                                    },
                                  },
                                },
                              });
                            }}
                          />
                        </StyledDetailContentRowValue>
                      </StyledDetailContentRow>
                    )}

                    {actantMode === "action" && (
                      <StyledDetailContentRow>
                        <StyledDetailContentRowLabel>
                          Actant2 valency
                        </StyledDetailContentRowLabel>
                        <StyledDetailContentRowValue>
                          <Input
                            disabled={!userCanEdit}
                            value={(entity as IAction).data.valencies?.a2}
                            width="full"
                            onChangeFn={async (newValue: string) => {
                              const oldData = { ...entity.data };
                              updateEntityMutation.mutate({
                                data: {
                                  ...oldData,
                                  ...{
                                    valencies: {
                                      s: entity.data.valencies.s,
                                      a1: entity.data.valencies.a1,
                                      a2: newValue,
                                    },
                                  },
                                },
                              });
                            }}
                          />
                        </StyledDetailContentRowValue>
                      </StyledDetailContentRow>
                    )}

                    {actantMode === "resource" && (
                      <React.Fragment>
                        <StyledDetailContentRow>
                          <StyledDetailContentRowLabel>
                            URL
                          </StyledDetailContentRowLabel>
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

                    {/* templates */}
                    {entity.usedTemplate &&
                      entity.usedTemplate in entity.entities && (
                        <StyledDetailContentRow>
                          <StyledDetailContentRowLabel>
                            Applied Template
                          </StyledDetailContentRowLabel>
                          <StyledDetailContentRowValue>
                            <EntityTag
                              actant={entity.entities[entity.usedTemplate]}
                            />
                          </StyledDetailContentRowValue>
                        </StyledDetailContentRow>
                      )}

                    <StyledDetailContentRow>
                      <br />
                    </StyledDetailContentRow>
                    <StyledDetailContentRow>
                      <StyledDetailContentRowLabel>
                        Notes
                      </StyledDetailContentRowLabel>
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
              </StyledDetailSectionContent>
            </StyledDetailSection>

            {/* reference section */}
            <StyledDetailSection>
              <StyledDetailSectionHeader>References</StyledDetailSectionHeader>
              <StyledDetailSectionContent>
                <EntityReferenceTable
                  disabled={!userCanEdit}
                  references={entity.references || []}
                  entities={entity.entities}
                  onChange={(newValues: IReference[]) => {
                    updateEntityMutation.mutate({ references: newValues });
                  }}
                />
              </StyledDetailSectionContent>
            </StyledDetailSection>

            {/* meta props section */}
            <StyledDetailSection metaSection>
              <StyledDetailSectionHeader>
                Meta properties
              </StyledDetailSectionHeader>
              <StyledDetailSectionContent firstSection>
                <table>
                  <tbody>
                    <PropGroup
                      boxEntity={entity}
                      originId={entity.id}
                      entities={entity.entities}
                      props={entity.props}
                      territoryId={territoryId}
                      updateProp={updateProp}
                      removeProp={removeProp}
                      addProp={addMetaProp}
                      userCanEdit={userCanEdit}
                      openDetailOnCreate={false}
                      movePropToIndex={(propId, oldIndex, newIndex) => {
                        movePropToIndex(propId, oldIndex, newIndex);
                      }}
                      category={DraggedPropRowCategory.META_PROP}
                      disabledAttributes={
                        {
                          statement: [
                            "elvl",
                            "moodvariant",
                            "mood",
                            "bundleOperator",
                          ],
                          type: ["elvl", "logic", "virtuality", "partitivity"],
                          value: ["elvl", "logic", "virtuality", "partitivity"],
                        } as PropAttributeFilter
                      }
                    />
                  </tbody>
                </table>
                {userCanEdit && (
                  <Button
                    color="primary"
                    label="create new meta property"
                    icon={<FaPlus />}
                    onClick={async () => {
                      const newProp = CMetaProp();
                      const newActant = { ...entity };
                      newActant.props.push(newProp);
                      updateEntityMutation.mutate({ props: newActant.props });
                    }}
                  />
                )}
              </StyledDetailSectionContent>
            </StyledDetailSection>

            <StyledDetailSection>
              <StyledDetailSectionHeader>Used in:</StyledDetailSectionHeader>

              {/* used as template */}
              {entity.isTemplate && entity.usedAsTemplate && (
                <StyledDetailSectionContentUsedIn key="as template">
                  <StyledHeading>
                    <StyledUsedInTitle>
                      <b>{entity.usedAsTemplate.length}</b> As a template
                    </StyledUsedInTitle>
                  </StyledHeading>
                  <StyledDetailSectionEntityList>
                    {entity.usedAsTemplate.map((entityId) => (
                      <React.Fragment key={entityId}>
                        <EntityTag actant={entity.entities[entityId]} />
                      </React.Fragment>
                    ))}
                  </StyledDetailSectionEntityList>
                </StyledDetailSectionContentUsedIn>
              )}

              {/* usedIn props */}
              {!entity.isTemplate && (
                <EntityDetailMetaPropsTable
                  title={{
                    singular: "Meta Property",
                    plural: "Meta Properties",
                  }}
                  entities={entity.entities}
                  useCases={entity.usedInMetaProps}
                  key="MetaProp"
                />
              )}

              {/* usedIn statements */}
              {!entity.isTemplate && (
                <EntityDetailStatementsTable
                  title={{ singular: "Statement", plural: "Statements" }}
                  entities={entity.entities}
                  useCases={entity.usedInStatement}
                  key="Statement"
                />
              )}

              {/* usedIn statement props */}
              {!entity.isTemplate && (
                <EntityDetailStatementPropsTable
                  title={{
                    singular: "Statement Property",
                    plural: "Statement Properties",
                  }}
                  entities={entity.entities}
                  useCases={entity.usedInStatementProps}
                  key="StatementProp"
                />
              )}
            </StyledDetailSection>

            {/* Audits */}
            <StyledDetailSection key="editor-section-audits">
              <StyledDetailSectionHeader>Audits</StyledDetailSectionHeader>
              <StyledDetailSectionContent>
                {audit && <AuditTable {...audit} />}
              </StyledDetailSectionContent>
            </StyledDetailSection>

            {/* JSON */}
            <StyledDetailSection key="editor-section-json">
              <StyledDetailSectionHeader>JSON</StyledDetailSectionHeader>
              <StyledDetailSectionContent>
                {entity && <JSONExplorer data={entity} />}
              </StyledDetailSectionContent>
            </StyledDetailSection>
          </StyledDetailWrapper>
        </>
      )}

      <Submit
        title="Remove entity"
        text="Do you really want to remove this entity?"
        submitLabel="Remove"
        onSubmit={() => {
          deleteEntityMutation.mutate(detailId);
          removeDetailId(detailId);
        }}
        onCancel={() => setShowRemoveSubmit(false)}
        show={showRemoveSubmit}
        loading={deleteEntityMutation.isLoading}
      />
      <Submit
        title="Change entity type"
        text={`Changing entity type to: [${
          selectedEntityType ? entitiesDictKeys[selectedEntityType].label : ""
        }]. You may loose some values. Do you want to continue?`}
        submitLabel="Continue"
        onSubmit={() => {
          if (selectedEntityType) {
            changeEntityTypeMutation.mutate(selectedEntityType);
          }
        }}
        onCancel={() => setShowTypeSubmit(false)}
        show={showTypeSubmit}
      />
      <Loader
        show={
          isFetching ||
          updateEntityMutation.isLoading ||
          deleteEntityMutation.isLoading ||
          changeEntityTypeMutation.isLoading
        }
      />

      <ApplyTemplateModal
        showModal={applyTemplateModal}
        entity={entity}
        setApplyTemplateModal={setApplyTemplateModal}
        updateEntityMutation={updateEntityMutation}
        templateToApply={templateToApply}
        setTemplateToApply={setTemplateToApply}
      />

      <EntityDetailCreateTemplateModal
        setCreateTemplateModal={setCreateTemplateModal}
        entity={entity}
        showModal={createTemplateModal}
        userCanEdit={userCanEdit}
        updateEntityMutation={updateEntityMutation}
      />
    </>
  );
};
