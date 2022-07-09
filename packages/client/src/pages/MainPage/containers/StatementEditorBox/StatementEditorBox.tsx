import { DropdownItem } from "@shared/dictionaries/entity";
import { EntityClass, Order, UserRoleMode } from "@shared/enums";
import {
  IEntity,
  IOption,
  IReference,
  IStatementActant,
  IStatementAction,
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
} from "components";
import { CProp, CStatementActant, CStatementAction } from "constructors";
import { useSearchParams } from "hooks";
import React, { useEffect, useMemo, useState } from "react";
import { BsInfoCircle } from "react-icons/bs";
import { FaUnlink } from "react-icons/fa";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { excludedSuggesterEntities } from "Theme/constants";
import { StyledContent } from "../EntityBookmarkBox/EntityBookmarkBoxStyles";
import { EntityReferenceTable } from "../EntityReferenceTable/EntityReferenceTable";
import { JSONExplorer } from "../JSONExplorer/JSONExplorer";
import { StatementListBreadcrumbItem } from "../StatementsListBox/StatementListHeader/StatementListBreadcrumbItem/StatementListBreadcrumbItem";
import { EntitySuggester, EntityTag } from "./../";
import { AuditTable } from "./../AuditTable/AuditTable";
import { StatementEditorActantTable } from "./StatementEditorActantTable/StatementEditorActantTable";
import { StatementEditorActionTable } from "./StatementEditorActionTable/StatementEditorActionTable";
import {
  StyledBreadcrumbWrap,
  StyledEditorActantTableWrapper,
  StyledEditorContentRow,
  StyledEditorContentRowLabel,
  StyledEditorContentRowValue,
  StyledEditorEmptyState,
  StyledEditorHeaderInputWrap,
  StyledEditorPreSection,
  StyledEditorSection,
  StyledEditorSectionContent,
  StyledEditorSectionHeader,
  StyledEditorStatementInfo,
  StyledEditorStatementInfoLabel,
  StyledEditorTemplateSection,
  StyledHeaderTagWrap,
  StyledTagsList,
  StyledTagsListItem,
} from "./StatementEditorBoxStyles";

const classesActants = [
  EntityClass.Statement,
  EntityClass.Action,
  EntityClass.Territory,
  EntityClass.Resource,
  EntityClass.Person,
  EntityClass.Group,
  EntityClass.Object,
  EntityClass.Concept,
  EntityClass.Location,
  EntityClass.Value,
  EntityClass.Event,
];
const classesTags = [
  EntityClass.Action,
  EntityClass.Territory,
  EntityClass.Resource,
  EntityClass.Person,
  EntityClass.Group,
  EntityClass.Object,
  EntityClass.Concept,
  EntityClass.Location,
  EntityClass.Value,
  EntityClass.Event,
];

export const StatementEditorBox: React.FC = () => {
  const {
    statementId,
    setStatementId,
    territoryId,
    setTerritoryId,
    selectedDetailId,
  } = useSearchParams();

  const queryClient = useQueryClient();

  // Statement query
  const {
    status: statusStatement,
    data: statement,
    error: statementError,
    isFetching: isFetchingStatement,
  } = useQuery(
    ["statement", statementId],
    async () => {
      const res = await api.statementGet(statementId);
      return res.data;
    },
    { enabled: !!statementId && api.isLoggedIn() }
  );

  // Audit query
  const {
    status: statusAudit,
    data: audit,
    error: auditError,
    isFetching: isFetchingAudit,
  } = useQuery(
    ["audit", statementId],
    async () => {
      const res = await api.auditGet(statementId);
      return res.data;
    },
    { enabled: !!statementId && api.isLoggedIn() }
  );

  // territory query
  const {
    status,
    data: territoryActants,
    error,
    isFetching,
  } = useQuery(
    ["territoryActants", statement?.data?.territory?.id],
    async () => {
      if (statement?.data?.territory?.id) {
        const res = await api.entityIdsInTerritory(
          statement?.data.territory.id
        );
        return res.data;
      } else {
        return [];
      }
    },
    {
      initialData: [],
      enabled: !!statement?.data?.territory?.id && api.isLoggedIn(),
    }
  );

  // TEMPLATES
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

  const handleApplyTemplate = () => {
    if (templateToApply && statement) {
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
        `Template ${templateToApply.label} applied to Statement ${statement.label}`
      );
      updateStatementMutation.mutate(entityAfterTemplateApplied);
    }
    setTemplateToApply(false);
  };

  const {
    status: templateStatus,
    data: templates,
    error: templateError,
    isFetching: isFetchingTemplates,
  } = useQuery(
    ["statement-templates"],
    async () => {
      const res = await api.entitiesSearch({
        onlyTemplates: true,
        class: EntityClass.Statement,
      });

      const templates = res.data;
      templates.sort((a: IEntity, b: IEntity) =>
        a.label.toLocaleLowerCase() > b.label.toLocaleLowerCase() ? 1 : -1
      );
      return templates;
    },
    { enabled: !!statement && api.isLoggedIn() }
  );

  const templateOptions: DropdownItem[] = useMemo(() => {
    const options = [
      {
        value: "",
        label: "select template",
      },
    ];

    if (templates) {
      templates.forEach((template) => {
        options.push({
          value: template.id,
          label: template.label,
        });
      });
    }
    return options;
  }, [templates]);

  // refetch audit when statement changes
  useEffect(() => {
    queryClient.invalidateQueries("audit");
  }, [statement]);

  // stores territory id
  const statementTerritoryId: string | undefined = useMemo(() => {
    return statement?.data?.territory?.id;
  }, [statement]);

  useEffect(() => {
    if (!territoryId && statementId && statementTerritoryId) {
      setTerritoryId(statementTerritoryId);
    }
  }, [territoryId, statementId, statementTerritoryId]);

  // get data for territory
  const {
    status: territoryStatus,
    data: territoryData,
    error: territoryError,
    isFetching: isFetchingTerritory,
  } = useQuery(
    ["territory", statementTerritoryId],
    async () => {
      const res = await api.entitiesGet(statementTerritoryId as string);
      return res.data;
    },
    {
      enabled: !!statementId && !!statementTerritoryId,
    }
  );

  //TODO recurse to get all parents
  const territoryPath = territoryData && Array(territoryData.data?.parent?.id);

  const userCanEdit: boolean = useMemo(() => {
    return (
      !!statement &&
      (statement.right === UserRoleMode.Admin ||
        statement.right === UserRoleMode.Write)
    );
  }, [statement]);

  useEffect(() => {
    if (
      statementError &&
      (statementError as any).error === "StatementDoesNotExits"
    ) {
      setStatementId("");
    }
  }, [statementError]);

  // actions
  const addAction = (newActionId: string) => {
    if (statement) {
      const newStatementAction = CStatementAction(newActionId);

      const newData = {
        actions: [...statement.data.actions, newStatementAction],
      };
      updateStatementDataMutation.mutate(newData);
    }
  };

  const addActant = (newStatementActantId: string) => {
    if (statement) {
      const newStatementActant = CStatementActant();
      newStatementActant.actant = newStatementActantId;
      const newData = {
        actants: [...statement.data.actants, newStatementActant],
      };
      updateStatementDataMutation.mutate(newData);
    }
  };

  // Props handling
  const addProp = (originId: string) => {
    if (statement) {
      const newProp = CProp();
      const newStatementData = { ...statement.data };

      [...newStatementData.actants, ...newStatementData.actions].forEach(
        (actant: IStatementActant | IStatementAction) => {
          const actantId = "actant" in actant ? actant.actant : actant.action;
          // adding 1st level prop
          if (actantId === originId) {
            actant.props = [...actant.props, newProp];
          }
          // adding 2nd level prop
          actant.props.forEach((prop1, pi1) => {
            if (prop1.id == originId) {
              actant.props[pi1].children = [
                ...actant.props[pi1].children,
                newProp,
              ];
            }

            // adding 3rd level prop
            actant.props[pi1].children.forEach((prop2, pi2) => {
              if (prop2.id == originId) {
                actant.props[pi1].children[pi2].children = [
                  ...actant.props[pi1].children[pi2].children,
                  newProp,
                ];
              }
            });
          });
        }
      );

      updateStatementDataMutation.mutate(newStatementData);
    }
  };

  const updateProp = (propId: string, changes: any) => {
    if (statement && propId) {
      const newStatementData = { ...statement.data };

      // this is probably an overkill
      [...newStatementData.actants, ...newStatementData.actions].forEach(
        (actant: IStatementActant | IStatementAction) => {
          actant.props.forEach((prop1, pi1) => {
            // 1st level
            if (prop1.id === propId) {
              actant.props[pi1] = { ...actant.props[pi1], ...changes };
            }

            // 2nd level
            actant.props[pi1].children.forEach((prop2, pi2) => {
              if (prop2.id === propId) {
                actant.props[pi1].children[pi2] = {
                  ...actant.props[pi1].children[pi2],
                  ...changes,
                };
              }

              // 3rd level
              actant.props[pi1].children[pi2].children.forEach((prop3, pi3) => {
                if (prop3.id === propId) {
                  actant.props[pi1].children[pi2].children[pi3] = {
                    ...actant.props[pi1].children[pi2].children[pi3],
                    ...changes,
                  };
                }
              });
            });
          });
        }
      );

      updateStatementDataMutation.mutate(newStatementData);
    }
  };

  const removeProp = (propId: string) => {
    if (statement && propId) {
      const newStatementData = { ...statement.data };

      [...newStatementData.actants, ...newStatementData.actions].forEach(
        (actant: IStatementActant | IStatementAction) => {
          actant.props = actant.props.filter(
            (actantProp) => actantProp.id !== propId
          );

          // 2nd level
          actant.props.forEach((prop1, pi1) => {
            actant.props[pi1].children = actant.props[pi1].children.filter(
              (childProp) => childProp.id != propId
            );

            // 3rd level
            actant.props[pi1].children.forEach((prop2, pi2) => {
              actant.props[pi1].children[pi2].children = actant.props[
                pi1
              ].children[pi2].children.filter(
                (childProp) => childProp.id != propId
              );
            });
          });
        }
      );

      updateStatementDataMutation.mutate(newStatementData);
    }
  };

  const changeOrder = (
    propId: string,
    actants: IStatementActant[] | IStatementAction[],
    oldIndex: number,
    newIndex: number
  ) => {
    for (let actant of actants) {
      for (let prop of actant.props) {
        if (prop.id === propId) {
          actant.props.splice(newIndex, 0, actant.props.splice(oldIndex, 1)[0]);
          return actants;
        }
        for (let prop1 of prop.children) {
          if (prop1.id === propId) {
            prop.children.splice(
              newIndex,
              0,
              prop.children.splice(oldIndex, 1)[0]
            );
            return actants;
          }
          for (let prop2 of prop1.children) {
            if (prop2.id === propId) {
              prop1.children.splice(
                newIndex,
                0,
                prop1.children.splice(oldIndex, 1)[0]
              );
              return actants;
            }
          }
        }
      }
    }
    return actants;
  };

  const movePropToIndex = (
    propId: string,
    oldIndex: number,
    newIndex: number
  ) => {
    if (statement) {
      const { actions, actants, ...dataWithoutActants } = statement.data;
      changeOrder(propId, actions, oldIndex, newIndex);
      changeOrder(propId, actants, oldIndex, newIndex);

      const newStatementData = {
        actions,
        actants,
        ...dataWithoutActants,
      };

      updateStatementDataMutation.mutate(newStatementData);
    }
  };

  //tags
  const addTag = (tagId: string) => {
    if (statement && tagId) {
      const newData = { tags: [...statement.data.tags, tagId] };
      updateStatementDataMutation.mutate(newData);
    }
  };
  const removeTag = (tagId: string) => {
    if (statement && tagId) {
      const newData = { tags: statement.data.tags.filter((p) => p !== tagId) };
      updateStatementDataMutation.mutate(newData);
    }
  };

  // MUTATIONS
  const updateStatementMutation = useMutation(
    async (changes: object) => {
      await api.entityUpdate(statementId, changes);
    },
    {
      onSuccess: (data, variables: any) => {
        if (selectedDetailId === statementId) {
          queryClient.invalidateQueries(["entity"]);
        }
        if (statement && statement.isTemplate) {
          queryClient.invalidateQueries(["templates"]);
        }
        if (variables.label !== undefined) {
          queryClient.invalidateQueries("detail-tab-entities");
        }
        queryClient.invalidateQueries(["statement"]);
        queryClient.invalidateQueries(["territory"]);
      },
    }
  );
  const updateStatementDataMutation = useMutation(
    async (changes: object) => {
      await api.entityUpdate(statementId, {
        data: changes,
      });
    },
    {
      onSuccess: (data, variables: any) => {
        queryClient.invalidateQueries(["entity"]);
        queryClient.invalidateQueries(["statement"]);
        queryClient.invalidateQueries(["territory"]);
        if (variables.text !== undefined) {
          queryClient.invalidateQueries("detail-tab-entities");
        }
      },
    }
  );

  const moveStatementMutation = useMutation(
    async (newTerritoryId: string) => {
      await api.entityUpdate(statementId, {
        data: { territory: { id: newTerritoryId, order: Order.First } },
      });
    },
    {
      onSuccess: (data, variables) => {
        setTerritoryId(variables);
        queryClient.invalidateQueries("statement");
        queryClient.invalidateQueries("tree");
        queryClient.invalidateQueries("territory");
      },
    }
  );

  return (
    <>
      {statement ? (
        <div style={{ marginBottom: "4rem" }} key={statement.id}>
          <StyledEditorPreSection>
            <StyledEditorStatementInfo>
              <StyledHeaderTagWrap>
                <EntityTag actant={statement} fullWidth />
              </StyledHeaderTagWrap>
              <div style={{ display: "flex" }}>
                <StyledEditorStatementInfoLabel>
                  change statement label:
                </StyledEditorStatementInfoLabel>
                <StyledEditorHeaderInputWrap>
                  <Input
                    type="text"
                    value={statement.label}
                    onChangeFn={(newValue: string) => {
                      updateStatementMutation.mutate({ label: newValue });
                    }}
                  />
                </StyledEditorHeaderInputWrap>
              </div>
            </StyledEditorStatementInfo>
            {!statement.isTemplate && (
              <StyledBreadcrumbWrap>
                {territoryPath &&
                  territoryPath.map((territory: string, key: number) => {
                    return (
                      <React.Fragment key={key}>
                        <StatementListBreadcrumbItem territoryId={territory} />
                      </React.Fragment>
                    );
                  })}
                {territoryData && (
                  <React.Fragment key={territoryData.id}>
                    <StatementListBreadcrumbItem
                      territoryId={territoryData.id}
                    />
                  </React.Fragment>
                )}
                <Loader size={20} show={isFetchingTerritory} />
              </StyledBreadcrumbWrap>
            )}
          </StyledEditorPreSection>
          {userCanEdit && (
            <StyledEditorPreSection>
              {"Move to territory: "}
              <EntitySuggester
                filterEditorRights
                inputWidth={96}
                disableCreate
                categoryTypes={[EntityClass.Territory]}
                onSelected={(newSelectedId: string) => {
                  moveStatementMutation.mutate(newSelectedId);
                }}
              />
            </StyledEditorPreSection>
          )}
          {userCanEdit && (
            <StyledEditorTemplateSection>
              <StyledEditorContentRow>
                <StyledEditorContentRowLabel>
                  Apply Template
                </StyledEditorContentRowLabel>
                <StyledEditorContentRowValue>
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
                </StyledEditorContentRowValue>
              </StyledEditorContentRow>
            </StyledEditorTemplateSection>
          )}
          <StyledEditorSection firstSection key="editor-section-summary">
            <StyledEditorSectionContent firstSection>
              <div>
                <div>
                  <Input
                    disabled={!userCanEdit}
                    type="textarea"
                    width="full"
                    noBorder
                    placeholder="Insert statement text here"
                    onChangeFn={(newValue: string) => {
                      if (newValue !== statement.data.text) {
                        const newData = {
                          text: newValue,
                        };
                        updateStatementDataMutation.mutate(newData);
                      }
                    }}
                    value={statement.data.text}
                  />
                </div>
              </div>
            </StyledEditorSectionContent>
          </StyledEditorSection>

          {/* Actions */}
          <StyledEditorSection metaSection key="editor-section-actions">
            <StyledEditorSectionHeader>Actions</StyledEditorSectionHeader>
            <StyledEditorSectionContent>
              <StyledEditorActantTableWrapper>
                <StatementEditorActionTable
                  userCanEdit={userCanEdit}
                  statement={statement}
                  statementId={statementId}
                  updateActionsMutation={updateStatementDataMutation}
                  addProp={addProp}
                  updateProp={updateProp}
                  removeProp={removeProp}
                  movePropToIndex={movePropToIndex}
                />
              </StyledEditorActantTableWrapper>

              {userCanEdit && (
                <EntitySuggester
                  territoryActants={territoryActants}
                  openDetailOnCreate
                  onSelected={(newSelectedId: string) => {
                    addAction(newSelectedId);
                  }}
                  categoryTypes={[EntityClass.Action]}
                  excludedEntities={excludedSuggesterEntities}
                  placeholder={"add new action"}
                />
              )}
            </StyledEditorSectionContent>
          </StyledEditorSection>

          {/* Actants */}
          <StyledEditorSection metaSection key="editor-section-actants">
            <StyledEditorSectionHeader>Actants</StyledEditorSectionHeader>
            <StyledEditorSectionContent>
              <StyledEditorActantTableWrapper>
                <StatementEditorActantTable
                  statement={statement}
                  userCanEdit={userCanEdit}
                  statementId={statementId}
                  classEntitiesActant={classesActants}
                  updateStatementDataMutation={updateStatementDataMutation}
                  addProp={addProp}
                  updateProp={updateProp}
                  removeProp={removeProp}
                  movePropToIndex={movePropToIndex}
                />
              </StyledEditorActantTableWrapper>
              {userCanEdit && (
                <EntitySuggester
                  territoryActants={territoryActants}
                  openDetailOnCreate
                  onSelected={(newSelectedId: string) => {
                    addActant(newSelectedId);
                  }}
                  categoryTypes={classesActants}
                  placeholder={"add new actant"}
                  excludedEntities={excludedSuggesterEntities}
                />
              )}
            </StyledEditorSectionContent>
          </StyledEditorSection>

          {/* Refs */}
          <StyledEditorSection key="editor-section-refs">
            <StyledEditorSectionHeader>References</StyledEditorSectionHeader>
            <StyledEditorSectionContent>
              <EntityReferenceTable
                openDetailOnCreate
                entities={statement.entities}
                references={statement.references}
                onChange={(newReferences: IReference[]) => {
                  updateStatementMutation.mutate({ references: newReferences });
                }}
                disabled={!userCanEdit}
              />
            </StyledEditorSectionContent>
          </StyledEditorSection>

          {/* Tags */}
          <StyledEditorSection key="editor-section-tags">
            <StyledEditorSectionHeader>Tags</StyledEditorSectionHeader>
            <StyledEditorSectionContent>
              <StyledTagsList>
                {statement.data.tags.map((tag: string) => {
                  const tagActant = statement?.entities[tag];
                  return (
                    tagActant && (
                      <StyledTagsListItem key={tag}>
                        <EntityTag
                          actant={tagActant}
                          fullWidth
                          tooltipPosition="left top"
                          button={
                            <Button
                              key="d"
                              tooltip="unlink actant from tags"
                              icon={<FaUnlink />}
                              color="plain"
                              inverted={true}
                              onClick={() => {
                                removeTag(tag);
                              }}
                            />
                          }
                        />
                      </StyledTagsListItem>
                    )
                  );
                })}
              </StyledTagsList>
              {userCanEdit && (
                <EntitySuggester
                  territoryActants={territoryActants}
                  openDetailOnCreate
                  onSelected={(newSelectedId: string) => {
                    if (!statement.data.tags.find((t) => t === newSelectedId)) {
                      addTag(newSelectedId);
                    } else {
                      toast.info("Tag already added!");
                    }
                  }}
                  categoryTypes={classesTags}
                  placeholder={"add new tag"}
                  excludedEntities={excludedSuggesterEntities}
                  excludedActantIds={statement.data.tags}
                />
              )}
            </StyledEditorSectionContent>
          </StyledEditorSection>

          {/* Notes */}
          <StyledEditorSection key="editor-section-notes" lastSection>
            <StyledEditorSectionHeader>Notes</StyledEditorSectionHeader>
            <StyledEditorSectionContent>
              <MultiInput
                width="full"
                disabled={!userCanEdit}
                values={statement.notes}
                onChange={(newValues: string[]) => {
                  updateStatementMutation.mutate({ notes: newValues });
                }}
              />
            </StyledEditorSectionContent>
          </StyledEditorSection>

          {/* Audits */}
          <StyledEditorSection key="editor-section-audits">
            <StyledEditorSectionHeader>Audits</StyledEditorSectionHeader>
            <StyledEditorSectionContent>
              {audit && <AuditTable {...audit} />}
            </StyledEditorSectionContent>
          </StyledEditorSection>

          {/* JSON */}
          <StyledEditorSection key="editor-section-json">
            <StyledEditorSectionHeader>JSON</StyledEditorSectionHeader>
            <StyledEditorSectionContent>
              {statement && <JSONExplorer data={statement} />}
            </StyledEditorSectionContent>
          </StyledEditorSection>
        </div>
      ) : (
        <>
          <StyledEditorEmptyState>
            <BsInfoCircle size="23" />
          </StyledEditorEmptyState>
          <StyledEditorEmptyState>
            {"No statement selected yet. Pick one from the statements table"}
          </StyledEditorEmptyState>
        </>
      )}
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
      <Loader
        show={
          isFetchingStatement ||
          updateStatementMutation.isLoading ||
          updateStatementDataMutation.isLoading
        }
      />
    </>
  );
};

export const MemoizedStatementEditorBox = React.memo(StatementEditorBox);
