import { EntityEnums, UserEnums } from "@shared/enums";
import {
  IEntity,
  IOption,
  IReference,
  IResponseStatement,
  IStatementActant,
  IStatementAction,
} from "@shared/types";
import api from "api";
import { Button, Dropdown, Input, Loader, MultiInput } from "components";
import {
  ApplyTemplateModal,
  AuditTable,
  BreadcrumbItem,
  EntitySuggester,
  EntityTag,
  JSONExplorer,
} from "components/advanced";
import {
  CClassification,
  CIdentification,
  CProp,
  CStatementActant,
  CStatementAction,
} from "constructors";
import { useSearchParams } from "hooks";
import React, { useEffect, useMemo, useState } from "react";
import { FaUnlink } from "react-icons/fa";
import { UseMutationResult, useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { excludedSuggesterEntities } from "Theme/constants";
import { classesEditorActants, classesEditorTags, DropdownItem } from "types";
import { getEntityLabel, getShortLabelByLetterCount } from "utils";
import { EntityReferenceTable } from "../../EntityReferenceTable/EntityReferenceTable";
import { StatementEditorActantTable } from "./StatementEditorActantTable/StatementEditorActantTable";
import { StatementEditorActionTable } from "./StatementEditorActionTable/StatementEditorActionTable";
import { StatementEditorOrdering } from "./StatementEditorOrdering/StatementEditorOrdering";
import {
  StyledBreadcrumbWrap,
  StyledEditorActantTableWrapper,
  StyledEditorContentRow,
  StyledEditorContentRowLabel,
  StyledEditorContentRowValue,
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
} from "./../StatementEditorBoxStyles";

interface StatementEditor {
  statement: IResponseStatement;
  updateStatementMutation: UseMutationResult<void, unknown, object, unknown>;
  updateStatementDataMutation: UseMutationResult<
    void,
    unknown,
    object,
    unknown
  >;
  moveStatementMutation: UseMutationResult<void, unknown, string, unknown>;
}
export const StatementEditor: React.FC<StatementEditor> = ({
  statement,
  updateStatementMutation,
  updateStatementDataMutation,
  moveStatementMutation,
}) => {
  const { statementId, territoryId, setTerritoryId, appendDetailId } =
    useSearchParams();

  const queryClient = useQueryClient();

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
    ["territoryActants", statement.data.territory?.territoryId],
    async () => {
      if (statement.data.territory?.territoryId) {
        const res = await api.entityIdsInTerritory(
          statement.data.territory.territoryId
        );
        return res.data;
      } else {
        return [];
      }
    },
    {
      initialData: [],
      enabled: !!statement.data.territory?.territoryId && api.isLoggedIn(),
    }
  );

  // TEMPLATES
  const [showApplyTemplateModal, setShowApplyTemplateModal] =
    useState<boolean>(false);
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
        setShowApplyTemplateModal(true);
      }
    }
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
        class: EntityEnums.Class.Statement,
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
      templates
        .filter((template) => template.id !== statement.id)
        .forEach((template) => {
          const maxLetterCount = 200;
          options.push({
            value: template.id,
            label: getShortLabelByLetterCount(
              getEntityLabel(template),
              maxLetterCount
            ),
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
    return statement.data.territory?.territoryId;
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
    ["territory", "statement-editor", statementTerritoryId],
    async () => {
      const res = await api.territoryGet(statementTerritoryId as string);
      return res.data;
    },
    {
      enabled: !!statementId && !!statementTerritoryId,
    }
  );

  //TODO recurse to get all parents
  const territoryPath =
    territoryData &&
    territoryData.data?.parent &&
    Array(territoryData.data?.parent?.territoryId);

  const userCanEdit: boolean = useMemo(() => {
    return (
      statement.right === UserEnums.RoleMode.Admin ||
      statement.right === UserEnums.RoleMode.Write
    );
  }, [statement]);

  // actions
  const addAction = (newActionId: string) => {
    const newStatementAction = CStatementAction(
      newActionId,
      statement.elementsOrders.length
    );
    const newData = {
      actions: [...statement.data.actions, newStatementAction],
    };
    updateStatementDataMutation.mutate(newData);
  };

  const addActant = (newStatementActantId: string) => {
    const newStatementActant = CStatementActant(
      newStatementActantId,
      statement.elementsOrders.length
    );
    const newData = {
      actants: [...statement.data.actants, newStatementActant],
    };
    updateStatementDataMutation.mutate(newData);
  };

  // Props handling
  const addProp = (rowId: string) => {
    const newProp = CProp(statement.elementsOrders.length);
    const newStatementData = { ...statement.data };

    [...newStatementData.actants, ...newStatementData.actions].forEach(
      (actant: IStatementActant | IStatementAction) => {
        // const actantId =
        // "id" in actant ? actant.id : actant.id;
        // adding 1st level prop
        if (actant.id === rowId) {
          actant.props = [...actant.props, newProp];
        }
        // adding 2nd level prop
        actant.props.forEach((prop1, pi1) => {
          if (prop1.id == rowId) {
            actant.props[pi1].children = [
              ...actant.props[pi1].children,
              newProp,
            ];
          }

          // adding 3rd level prop
          actant.props[pi1].children.forEach((prop2, pi2) => {
            if (prop2.id == rowId) {
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
  };

  const addClassification = (rowId: string) => {
    const newClassification = CClassification(statement.elementsOrders.length);
    const newStatementData = { ...statement.data };

    [...newStatementData.actants].forEach((actant: IStatementActant) => {
      if (actant.id === rowId) {
        actant.classifications = [...actant.classifications, newClassification];
      }
    });

    updateStatementDataMutation.mutate(newStatementData);
  };

  const addIdentification = (rowId: string) => {
    const newIdentification = CIdentification(statement.elementsOrders.length);
    const newStatementData = { ...statement.data };

    [...newStatementData.actants].forEach((actant: IStatementActant) => {
      if (actant.id === rowId) {
        actant.identifications = [...actant.identifications, newIdentification];
      }
    });

    updateStatementDataMutation.mutate(newStatementData);
  };

  const updateProp = (propId: string, changes: any) => {
    if (propId) {
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
    if (propId) {
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
    const { actions, actants, ...dataWithoutActants } = statement.data;
    changeOrder(propId, actions, oldIndex, newIndex);
    changeOrder(propId, actants, oldIndex, newIndex);

    const newStatementData = {
      actions,
      actants,
      ...dataWithoutActants,
    };

    updateStatementDataMutation.mutate(newStatementData);
  };

  //tags
  const addTag = (tagId: string) => {
    if (tagId) {
      const newData = { tags: [...statement.data.tags, tagId] };
      updateStatementDataMutation.mutate(newData);
    }
  };
  const removeTag = (tagId: string) => {
    if (tagId) {
      const newData = { tags: statement.data.tags.filter((p) => p !== tagId) };
      updateStatementDataMutation.mutate(newData);
    }
  };

  return (
    <>
      <div style={{ marginBottom: "4rem" }} key={statement.id}>
        <StyledEditorPreSection>
          <StyledEditorStatementInfo>
            <StyledHeaderTagWrap>
              <EntityTag entity={statement} fullWidth />
            </StyledHeaderTagWrap>
            {userCanEdit && (
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
            )}
          </StyledEditorStatementInfo>
          {!statement.isTemplate && (
            <StyledBreadcrumbWrap>
              {territoryPath &&
                territoryPath.map((territory: string, key: number) => {
                  return (
                    <React.Fragment key={key}>
                      <BreadcrumbItem territoryId={territory} />
                    </React.Fragment>
                  );
                })}
              {territoryData && (
                <React.Fragment key={territoryData.id}>
                  <BreadcrumbItem
                    territoryId={territoryData.id}
                    territoryData={territoryData}
                  />
                </React.Fragment>
              )}
              <Loader size={20} show={isFetchingTerritory} />
            </StyledBreadcrumbWrap>
          )}
        </StyledEditorPreSection>
        {userCanEdit && !statement.isTemplate && (
          <StyledEditorPreSection>
            {"Move to territory: "}
            <EntitySuggester
              disableTemplatesAccept
              filterEditorRights
              inputWidth={96}
              disableCreate
              categoryTypes={[EntityEnums.Class.Territory]}
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
        <StyledEditorSection
          firstSection
          key="editor-section-summary"
          marginRight
        >
          <StyledEditorSectionContent firstSection>
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
                updateActionsMutation={updateStatementDataMutation}
                addProp={addProp}
                updateProp={updateProp}
                removeProp={removeProp}
                movePropToIndex={movePropToIndex}
                territoryParentId={statementTerritoryId}
                territoryActants={territoryActants}
              />
            </StyledEditorActantTableWrapper>

            {userCanEdit && (
              <EntitySuggester
                territoryActants={territoryActants}
                openDetailOnCreate
                onSelected={(newSelectedId: string) => {
                  addAction(newSelectedId);
                }}
                categoryTypes={[EntityEnums.Class.Action]}
                excludedEntities={excludedSuggesterEntities}
                placeholder={"add action"}
                isInsideTemplate={statement.isTemplate}
                territoryParentId={statementTerritoryId}
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
                classEntitiesActant={classesEditorActants}
                updateStatementDataMutation={updateStatementDataMutation}
                addProp={addProp}
                updateProp={updateProp}
                removeProp={removeProp}
                movePropToIndex={movePropToIndex}
                territoryParentId={statementTerritoryId}
                addClassification={addClassification}
                addIdentification={addIdentification}
                territoryActants={territoryActants}
              />
            </StyledEditorActantTableWrapper>
            {userCanEdit && (
              <EntitySuggester
                territoryActants={territoryActants}
                openDetailOnCreate
                onSelected={(newSelectedId: string) => {
                  addActant(newSelectedId);
                }}
                categoryTypes={classesEditorActants}
                placeholder={"add actant"}
                excludedEntities={excludedSuggesterEntities}
                isInsideTemplate={statement.isTemplate}
                territoryParentId={statementTerritoryId}
              />
            )}
          </StyledEditorSectionContent>
        </StyledEditorSection>

        {/* Ordering */}
        <StyledEditorSection>
          <StyledEditorSectionHeader>Ordering</StyledEditorSectionHeader>
          <StyledEditorSectionContent>
            <StatementEditorOrdering
              statementId={statementId}
              elementsOrders={statement.elementsOrders}
              entities={statement.entities}
            />
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
              isInsideTemplate={statement.isTemplate || false}
              territoryParentId={statementTerritoryId}
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
                        entity={tagActant}
                        fullWidth
                        tooltipPosition="left"
                        button={
                          <Button
                            key="d"
                            tooltipLabel="unlink actant from tags"
                            icon={<FaUnlink />}
                            color="plain"
                            inverted
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
                disableTemplatesAccept
                categoryTypes={classesEditorTags}
                placeholder={"add new tag"}
                excludedEntities={excludedSuggesterEntities}
                excludedActantIds={statement.data.tags}
                isInsideTemplate={statement.isTemplate}
                territoryParentId={statementTerritoryId}
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

      <ApplyTemplateModal
        showModal={showApplyTemplateModal}
        setShowApplyTemplateModal={setShowApplyTemplateModal}
        updateEntityMutation={updateStatementMutation}
        templateToApply={templateToApply}
        setTemplateToApply={setTemplateToApply}
        entity={statement}
      />
    </>
  );
};
