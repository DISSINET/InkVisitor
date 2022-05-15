import {
  actantLogicalTypeDict,
  entitiesDict,
  entityStatusDict,
  languageDict,
} from "@shared/dictionaries";
import { allEntities, DropdownItem } from "@shared/dictionaries/entity";
import { EntityClass, Language, UserRole, UserRoleMode } from "@shared/enums";
import {
  IAction,
  IEntity,
  IOption,
  IProp,
  IReference,
  IStatement,
} from "@shared/types";
import api from "api";
import {
  Button,
  ButtonGroup,
  Dropdown,
  Input,
  Loader,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalInputForm,
  MultiInput,
  Submit,
} from "components";
import { StyledTypeBar } from "components/Suggester/SuggesterStyles";
import { StyledHeading, StyledUsedInTitle } from "components/Table/TableStyles";
import { CProp, DEntity, DStatement } from "constructors";
import { useSearchParams } from "hooks";
import React, { useEffect, useMemo, useState } from "react";
import {
  FaClone,
  FaEdit,
  FaPlus,
  FaRecycle,
  FaRegCopy,
  FaTrashAlt,
} from "react-icons/fa";
import { GrClone } from "react-icons/gr";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { OptionTypeBase, ValueType } from "react-select";
import { toast } from "react-toastify";
import { DraggedPropRowCategory } from "types";
import { v4 as uuidv4 } from "uuid";
import { EntityTag } from "..";
import { AttributeButtonGroup } from "../AttributeButtonGroup/AttributeButtonGroup";
import { AuditTable } from "../AuditTable/AuditTable";
import { StyledContent } from "../EntityBookmarkBox/EntityBookmarkBoxStyles";
import { EntityReferenceTable } from "../EntityReferenceTable/EntityReferenceTable";
import { JSONExplorer } from "../JSONExplorer/JSONExplorer";
import { PropGroup } from "../PropGroup/PropGroup";
import {
  StyledActantHeaderRow,
  StyledDetailContentRow,
  StyledDetailContentRowLabel,
  StyledDetailContentRowValue,
  StyledDetailContentRowValueID,
  StyledDetailForm,
  StyledDetailSection,
  StyledDetailSectionContent,
  StyledDetailSectionContentUsedIn,
  StyledDetailSectionEntityList,
  StyledDetailSectionHeader,
  StyledDetailWrapper,
  StyledFormWrapper,
  StyledTagWrap,
} from "./EntityDetailBoxStyles";
import { EntityDetailMetaPropsTable } from "./EntityDetailUsedInTable/EntityDetailMetaPropsTable/EntityDetailMetaPropsTable";
import { EntityDetailStatementPropsTable } from "./EntityDetailUsedInTable/EntityDetailStatementPropsTable/EntityDetailStatementPropsTable";
import { EntityDetailStatementsTable } from "./EntityDetailUsedInTable/EntityDetailStatementsTable/EntityDetailStatementsTable";

interface EntityDetailBox {}
export const EntityDetailBox: React.FC<EntityDetailBox> = ({}) => {
  const {
    detailId,
    setDetailId,
    statementId,
    setStatementId,
    territoryId,
    setTerritoryId,
  } = useSearchParams();

  const [createTemplateModal, setCreateTemplateModal] =
    useState<boolean>(false);
  const [createTemplateLabel, setCreateTemplateLabel] = useState<string>("");
  const [showRemoveSubmit, setShowRemoveSubmit] = useState(false);
  const [usedInPage, setUsedInPage] = useState<number>(0);
  const statementsPerPage = 20;

  const [applyTemplateModal, setApplyTemplateModal] = useState<boolean>(false);
  const [templateToApply, setTemplateToApply] = useState<IEntity | false>(
    false
  );

  const handleCreateTemplate = () => {
    // create template as a copy of the entity
    if (entity) {
      const userRole = localStorage.getItem("userrole") as UserRole;
      const templateEntity =
        entity.class === EntityClass.Statement
          ? DStatement(entity as IStatement, userRole)
          : DEntity(entity as IEntity, userRole);

      if (entity.class === EntityClass.Statement) {
        delete templateEntity.data["territory"];
      }
      templateEntity.isTemplate = true;
      templateEntity.usedTemplate = "";
      templateEntity.label = createTemplateLabel;
      api.entityCreate(templateEntity);

      setTimeout(() => {
        queryClient.invalidateQueries(["templates"]);
      }, 1000);
      updateEntityMutation.mutate({ usedTemplate: templateEntity.id });

      setCreateTemplateModal(false);
      setCreateTemplateLabel("");

      toast.info(
        `Template "${templateEntity.label}" created from entity "${entity.label}"`
      );
    }
  };

  const handleCancelCreateTemplate = () => {
    setCreateTemplateModal(false);
    setCreateTemplateLabel("");
  };

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

  const handleApplyTemplate = () => {
    if (templateToApply && entity) {
      // TODO #952 handle conflicts in Templates application
      const entityAfterTemplateApplied = {
        ...{
          data: templateToApply.data,
          notes: templateToApply.notes,
          props: templateToApply.props,
          references: templateToApply.references,
          usedTemplate: templateToApply.id,
        },
      };

      toast.info(
        `Template "${templateToApply.label}" applied to Statement "${entity.label}"`
      );

      updateEntityMutation.mutate(entityAfterTemplateApplied);
    }
    setTemplateToApply(false);
  };

  const queryClient = useQueryClient();

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
    { enabled: !!detailId && api.isLoggedIn(), retry: 2 }
  );

  const {
    status: templateStatus,
    data: templates,
    error: templateError,
    isFetching: isFetchingTemplates,
  } = useQuery(
    ["entity-templates", "templates", entity?.class, detailId],
    async () => {
      const res = await api.entitiesGetMore({
        onlyTemplates: true,
        class: entity?.class,
      });

      const templates = res.data;
      templates.sort((a: IEntity, b: IEntity) =>
        a.label.toLocaleLowerCase() > b.label.toLocaleLowerCase() ? 1 : -1
      );
      return templates;
    },
    { enabled: !!entity && api.isLoggedIn(), retry: 2 }
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
    console.log("new templates", options);
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
    { enabled: !!detailId && api.isLoggedIn(), retry: 2 }
  );

  // refetch audit when statement changes
  useEffect(() => {
    queryClient.invalidateQueries("audit");
  }, [entity]);

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

  // mutations
  // const allEntitiesOption = {
  //   value: "*",
  //   label: "*",
  //   info: "",
  // };
  // const entityOptions = [...entitiesDict] as any;
  // entityOptions.push(allEntitiesOption);

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
          variables.references ||
          variables.detail ||
          variables.label ||
          variables.status ||
          variables.data?.logicalType
        ) {
          if (entity?.class === EntityClass.Territory) {
            queryClient.invalidateQueries("tree");
          }
          queryClient.invalidateQueries("territory");
          queryClient.invalidateQueries("bookmarks");
        }
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
  const addProp = (originId: string) => {
    if (entity) {
      const newProp = CProp();
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
    if (error && (error as any).error === "EntityDoesNotExits") {
      setDetailId("");
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

  const updatePropIds = (props: IProp[]) => {
    for (let prop of props) {
      for (let prop1 of prop.children) {
        for (let prop2 of prop1.children) {
          prop2.id = uuidv4();
        }
        prop1.id = uuidv4();
      }
      prop.id = uuidv4();
    }
    return props;
  };

  const duplicateEntity = (entityToDuplicate: IEntity) => {
    const newEntity = DEntity(
      entityToDuplicate,
      localStorage.getItem("userrole") as UserRole
    );
    duplicateEntityMutation.mutate(newEntity);
  };

  const duplicateEntityMutation = useMutation(
    async (newEntity: IEntity) => {
      await api.entityCreate(newEntity);
    },
    {
      onSuccess: (data, variables) => {
        setDetailId(variables.id);
        toast.info(`Entity duplicated!`);
        queryClient.invalidateQueries("templates");
      },
      onError: () => {
        toast.error(`Error: Entity not duplicated!`);
      },
    }
  );

  return (
    <>
      {entity && (
        <>
          <StyledActantHeaderRow type={entity.class}>
            <StyledTagWrap>
              <EntityTag
                actant={entity}
                propId={entity.id}
                tooltipText={entity.data.text}
                fullWidth
              />
            </StyledTagWrap>
            <ButtonGroup style={{ marginTop: "1rem" }}>
              {entity.class !== EntityClass.Statement && userCanEdit && (
                <Button
                  icon={<FaClone size={14} />}
                  color="primary"
                  label="duplicate"
                  tooltip="duplicate entity"
                  inverted
                  onClick={() => {
                    duplicateEntity(entity);
                  }}
                />
              )}
              {mayBeRemoved && userCanEdit && (
                <Button
                  color="primary"
                  icon={<FaTrashAlt />}
                  label="remove"
                  tooltip="remove entity"
                  inverted
                  onClick={() => {
                    setShowRemoveSubmit(true);
                  }}
                />
              )}
              {userCanEdit && (
                <Button
                  key="template"
                  icon={<GrClone size={14} />}
                  tooltip="create template from entity"
                  inverted
                  color="primary"
                  label="Create template"
                  onClick={() => {
                    setCreateTemplateModal(true);
                  }}
                />
              )}
              <Button
                key="refresh"
                icon={<FaRecycle size={14} />}
                tooltip="refresh data"
                inverted
                color="primary"
                label="refresh"
                onClick={() => {
                  queryClient.invalidateQueries(["entity"]);
                }}
              />
              {entity.class === EntityClass.Statement && (
                <Button
                  key="edit"
                  icon={<FaEdit size={14} />}
                  tooltip="open statement in editor"
                  inverted={true}
                  color="primary"
                  label="open"
                  onClick={() => {
                    setStatementId(entity.id);
                    setTerritoryId(entity.data.territory.id);
                  }}
                />
              )}
            </ButtonGroup>
          </StyledActantHeaderRow>

          <StyledDetailWrapper type={entity.class}>
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

                    {/* <StyledDetailContentRow>
                      <StyledDetailContentRowLabel>
                        Entity Type
                      </StyledDetailContentRowLabel>
                      <StyledDetailContentRowValue>
                        <div style={{ position: "relative" }}>
                          <Dropdown
                            value={{
                              label: entity.class,
                              value: entity.class,
                            }}
                            options={entitiesDict}
                            onChange={(
                              option: ValueType<OptionTypeBase, any>
                            ) => {
                              // setSelectedCategory(option);
                              // TODO: submit modal => change category mutation
                              console.log(option);
                            }}
                            width={40}
                            entityDropdown
                            disableTyping
                          />
                          <StyledTypeBar
                            entity={`entity${entity.class}`}
                          ></StyledTypeBar>
                        </div>
                      </StyledDetailContentRowValue>
                    </StyledDetailContentRow> */}

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
                      addProp={addProp}
                      userCanEdit={userCanEdit}
                      openDetailOnCreate={false}
                      movePropToIndex={(propId, oldIndex, newIndex) => {
                        movePropToIndex(propId, oldIndex, newIndex);
                      }}
                      category={DraggedPropRowCategory.META_PROP}
                      disabledAttributes={["elvl"]}
                    />
                  </tbody>
                </table>
                {userCanEdit && (
                  <Button
                    color="primary"
                    label="create new meta property"
                    icon={<FaPlus />}
                    onClick={async () => {
                      const newProp = CProp();
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
          setDetailId("");
        }}
        onCancel={() => setShowRemoveSubmit(false)}
        show={showRemoveSubmit}
        loading={deleteEntityMutation.isLoading}
      />
      <Loader
        show={
          isFetching ||
          updateEntityMutation.isLoading ||
          deleteEntityMutation.isLoading
        }
      />
      <Modal
        showModal={applyTemplateModal}
        width="thin"
        onEnterPress={() => {
          setApplyTemplateModal(false);
          handleApplyTemplate();
        }}
        onClose={() => {
          setApplyTemplateModal(false);
        }}
      >
        <ModalHeader title="Create Template" />
        <ModalContent>
          <StyledContent>
            <ModalInputForm>{`Apply template?`}</ModalInputForm>
            <div>
              {templateToApply && <EntityTag actant={templateToApply} />}
            </div>
            {/* here goes the info about template #951 */}
          </StyledContent>
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <Button
              key="cancel"
              label="Cancel"
              color="greyer"
              inverted
              onClick={() => {
                setApplyTemplateModal(false);
              }}
            />
            <Button
              key="submit"
              label="Apply"
              color="info"
              onClick={() => {
                setApplyTemplateModal(false);
                handleApplyTemplate();
              }}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
      <Modal
        showModal={createTemplateModal}
        width="thin"
        onEnterPress={() => {
          handleCreateTemplate();
        }}
        onClose={() => {
          handleCancelCreateTemplate();
        }}
      >
        <ModalHeader title="Create Template" />
        <ModalContent>
          <StyledContent>
            <ModalInputForm>
              <StyledDetailForm>
                <StyledDetailContentRow>
                  <StyledDetailContentRowLabel>
                    Label
                  </StyledDetailContentRowLabel>
                  <StyledDetailContentRowValue>
                    <Input
                      disabled={!userCanEdit}
                      width="full"
                      value={createTemplateLabel}
                      onChangeFn={async (newLabel: string) => {
                        setCreateTemplateLabel(newLabel);
                      }}
                      changeOnType
                    />
                  </StyledDetailContentRowValue>
                </StyledDetailContentRow>
              </StyledDetailForm>
            </ModalInputForm>
          </StyledContent>
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <Button
              key="cancel"
              label="Cancel"
              color="greyer"
              inverted
              onClick={() => {
                handleCancelCreateTemplate();
              }}
            />
            <Button
              key="submit"
              label="Create"
              color="info"
              onClick={() => {
                handleCreateTemplate();
              }}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </>
  );
};
