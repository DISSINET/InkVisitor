import { EntityClass, UserRoleMode } from "@shared/enums";
import {
  IProp,
  IResponseStatement,
  IStatementActant,
  IStatementAction,
  IStatementReference,
} from "@shared/types";
import api from "api";
import { Button, Input, Loader, MultiInput } from "components";
import {
  CProp,
  CReference,
  CStatementActant,
  CStatementAction,
} from "constructors";
import { useSearchParams } from "hooks";
import React, { useEffect, useMemo } from "react";
import { FaTrashAlt, FaUnlink } from "react-icons/fa";
import { BsInfoCircle } from "react-icons/bs";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { excludedSuggesterEntities } from "Theme/constants";
import { AttributeButtonGroup } from "../AttributeButtonGroup/AttributeButtonGroup";
import { JSONExplorer } from "../JSONExplorer/JSONExplorer";
import { PropGroup } from "../PropGroup/PropGroup";
import { StatementListBreadcrumbItem } from "../StatementsListBox/StatementListHeader/StatementListBreadcrumbItem/StatementListBreadcrumbItem";
import { EntitySuggester, EntityTag } from "./../";
import { AuditTable } from "./../AuditTable/AuditTable";
import { StatementEditorActantTable } from "./StatementEditorActantTable/StatementEditorActantTable";
import { StatementEditorActionTable } from "./StatementEditorActionTable/StatementEditorActionTable";
import {
  StyledBreadcrumbWrap,
  StyledEditorActantTableWrapper,
  StyledEditorPreSection,
  StyledEditorEmptyState,
  StyledEditorSection,
  StyledEditorSectionContent,
  StyledEditorSectionHeader,
  StyledListHeaderColumn,
  StyledReferencesList,
  StyledReferencesListColumn,
  StyledTagsList,
  StyledTagsListItem,
  StyledTagWrapper,
} from "./StatementEditorBoxStyles";
import { DraggedPropRowCategory } from "types";

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
const classesPropType = [EntityClass.Concept];
const classesPropValue = [
  EntityClass.Action,
  EntityClass.Person,
  EntityClass.Group,
  EntityClass.Object,
  EntityClass.Concept,
  EntityClass.Location,
  EntityClass.Value,
  EntityClass.Event,
  EntityClass.Statement,
  EntityClass.Territory,
  EntityClass.Resource,
];
const classesResources = [EntityClass.Resource];
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
  const { statementId, setStatementId, territoryId, setTerritoryId } =
    useSearchParams();

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
    { enabled: !!statementId && api.isLoggedIn(), retry: 2 }
  );

  //console.log(statement);
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
    { enabled: !!statementId && api.isLoggedIn(), retry: 2 }
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
      retry: 2,
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
      updateActionsRefreshListMutation.mutate(newData);
    }
  };

  const addActant = (newStatementActantId: string) => {
    if (statement) {
      const newStatementActant = CStatementActant();
      newStatementActant.actant = newStatementActantId;
      const newData = {
        actants: [...statement.data.actants, newStatementActant],
      };
      updateActantsRefreshListMutation.mutate(newData);
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

  // references
  const addReference = (resourceId: string) => {
    if (statement && resourceId) {
      const newReference: IStatementReference = CReference(resourceId);
      const newData = {
        references: [...statement.data.references, newReference],
      };
      updateStatementDataMutation.mutate(newData);
    }
  };
  const updateReference = (referenceId: string, changes: any) => {
    if (statement && referenceId) {
      const updatedReferences = statement.data.references.map((r) =>
        r.id === referenceId ? { ...r, ...changes } : r
      );
      const newData = {
        references: updatedReferences,
      };
      updateStatementDataMutation.mutate(newData);
    }
  };
  const removeReference = (referenceId: string) => {
    if (statement && referenceId) {
      const newData = {
        references: statement.data.references.filter(
          (p) => p.id !== referenceId
        ),
      };
      updateStatementDataMutation.mutate(newData);
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

  const updateStatementDataMutation = useMutation(
    async (changes: object) => {
      await api.entityUpdate(statementId, {
        data: changes,
      });
    },
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(["statement"]);
      },
    }
  );

  const updateActionsRefreshListMutation = useMutation(
    async (changes: object) => {
      await api.entityUpdate(statementId, {
        data: changes,
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("statement");
        queryClient.invalidateQueries("territory");
      },
    }
  );

  const updateActantMutation = useMutation(
    async (changes: object) => await api.entityUpdate(statementId, changes),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["statement"]);
      },
    }
  );

  const updateActantsRefreshListMutation = useMutation(
    async (changes: object) =>
      await api.entityUpdate(statementId, {
        data: changes,
      }),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries("statement");
        queryClient.invalidateQueries("territory");
        queryClient.invalidateQueries("entity");
      },
    }
  );

  const renderPropGroup = (
    originId: string,
    props: IProp[],
    statement: IResponseStatement,
    category: DraggedPropRowCategory
  ) => {
    const originActant = statement.entities[originId];

    if (originActant && props.length > 0) {
      return (
        <PropGroup
          originId={originActant.id}
          entities={statement.entities}
          props={props}
          territoryId={territoryId}
          updateProp={updateProp}
          removeProp={removeProp}
          addProp={addProp}
          movePropToIndex={movePropToIndex}
          userCanEdit={userCanEdit}
          openDetailOnCreate={false}
          category={category}
        />
      );
    }
  };

  const moveStatementMutation = useMutation(
    async (newTerritoryId: string) => {
      await api.entityUpdate(statementId, {
        data: { territory: { id: newTerritoryId, order: -1 } },
      });
    },
    {
      onSuccess: (data, variables) => {
        setTerritoryId(variables);
        queryClient.invalidateQueries("tree");
      },
    }
  );

  return (
    <>
      {statement ? (
        <div style={{ marginBottom: "4rem" }} key={statement.id}>
          <StyledEditorPreSection>
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
                <StatementListBreadcrumbItem territoryId={territoryData.id} />
              )}
              <Loader size={20} show={isFetchingTerritory} />
            </StyledBreadcrumbWrap>
          </StyledEditorPreSection>
          {userCanEdit && (
            <StyledEditorPreSection>
              {"Move to territory: "}
              <EntitySuggester
                filterEditorRights
                inputWidth={96}
                allowCreate={false}
                categoryTypes={[EntityClass.Territory]}
                onSelected={(newSelectedId: string) => {
                  moveStatementMutation.mutate(newSelectedId);
                }}
              />
            </StyledEditorPreSection>
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
                        updateActantsRefreshListMutation.mutate(newData);
                      }
                    }}
                    value={statement.data.text}
                  />
                </div>
              </div>
            </StyledEditorSectionContent>
          </StyledEditorSection>

          {/* Actions */}
          <StyledEditorSection key="editor-section-actions">
            <StyledEditorSectionHeader>Actions</StyledEditorSectionHeader>
            <StyledEditorSectionContent>
              <StyledEditorActantTableWrapper>
                <StatementEditorActionTable
                  userCanEdit={userCanEdit}
                  statement={statement}
                  statementId={statementId}
                  updateActionsMutation={updateActionsRefreshListMutation}
                  renderPropGroup={renderPropGroup}
                  addProp={addProp}
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
          <StyledEditorSection key="editor-section-actants">
            <StyledEditorSectionHeader>Actants</StyledEditorSectionHeader>
            <StyledEditorSectionContent>
              <StyledEditorActantTableWrapper>
                <StatementEditorActantTable
                  statement={statement}
                  userCanEdit={userCanEdit}
                  statementId={statementId}
                  classEntitiesActant={classesActants}
                  updateActantsMutation={updateActantsRefreshListMutation}
                  renderPropGroup={renderPropGroup}
                  addProp={addProp}
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
              <StyledReferencesList>
                {statement.data.references.length > 0 && (
                  <React.Fragment>
                    <StyledListHeaderColumn>Resource</StyledListHeaderColumn>
                    <StyledListHeaderColumn>Part</StyledListHeaderColumn>
                    <StyledListHeaderColumn>Type</StyledListHeaderColumn>
                    <StyledListHeaderColumn></StyledListHeaderColumn>
                  </React.Fragment>
                )}
                {statement.data.references.map(
                  (reference: IStatementReference, ri) => {
                    const referenceActant =
                      statement?.entities[reference.resource];

                    return (
                      <React.Fragment key={ri}>
                        <StyledReferencesListColumn>
                          {referenceActant ? (
                            <StyledTagWrapper>
                              <EntityTag
                                actant={referenceActant}
                                fullWidth
                                button={
                                  userCanEdit && (
                                    <Button
                                      key="d"
                                      tooltip="unlink actant"
                                      icon={<FaUnlink />}
                                      inverted={true}
                                      color="plain"
                                      onClick={() => {
                                        updateReference(reference.id, {
                                          resource: "",
                                        });
                                      }}
                                    />
                                  )
                                }
                              />
                            </StyledTagWrapper>
                          ) : (
                            userCanEdit && (
                              <EntitySuggester
                                territoryActants={territoryActants}
                                openDetailOnCreate
                                onSelected={(newSelectedId: string) => {
                                  updateReference(reference.id, {
                                    resource: newSelectedId,
                                  });
                                }}
                                categoryTypes={classesResources}
                              />
                            )
                          )}
                        </StyledReferencesListColumn>
                        <StyledReferencesListColumn>
                          <Input
                            type="text"
                            disabled={!userCanEdit}
                            value={reference.part}
                            onChangeFn={(newPart: string) => {
                              updateReference(reference.id, {
                                part: newPart,
                              });
                            }}
                          ></Input>
                        </StyledReferencesListColumn>
                        <StyledReferencesListColumn>
                          <div>
                            <AttributeButtonGroup
                              disabled={!userCanEdit}
                              options={[
                                {
                                  longValue: "primary",
                                  shortValue: "prim",
                                  onClick: () => {
                                    if (reference.type !== "P") {
                                      updateReference(reference.id, {
                                        type: "P",
                                      });
                                    }
                                  },
                                  selected: reference.type === "P",
                                },
                                {
                                  longValue: "secondary",
                                  shortValue: "sec",
                                  onClick: () => {
                                    if (reference.type !== "S") {
                                      updateReference(reference.id, {
                                        type: "S",
                                      });
                                    }
                                  },
                                  selected: reference.type === "S",
                                },
                              ]}
                            />
                          </div>
                        </StyledReferencesListColumn>
                        <StyledReferencesListColumn>
                          {userCanEdit && (
                            <Button
                              key="delete"
                              tooltip="remove reference row"
                              inverted={true}
                              icon={<FaTrashAlt />}
                              color="plain"
                              onClick={() => {
                                removeReference(reference.id);
                              }}
                            />
                          )}
                        </StyledReferencesListColumn>
                      </React.Fragment>
                    );
                  }
                )}
              </StyledReferencesList>
              {userCanEdit && (
                <EntitySuggester
                  territoryActants={territoryActants}
                  openDetailOnCreate
                  onSelected={(newSelectedId: string) => {
                    addReference(newSelectedId);
                  }}
                  categoryTypes={classesResources}
                  placeholder={"add new reference"}
                />
              )}
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
                    addTag(newSelectedId);
                  }}
                  categoryTypes={classesTags}
                  placeholder={"add new tag"}
                  excludedEntities={excludedSuggesterEntities}
                />
              )}
            </StyledEditorSectionContent>
          </StyledEditorSection>

          {/* Notes */}
          <StyledEditorSection key="editor-section-notes" lastSection>
            <StyledEditorSectionHeader>Notes</StyledEditorSectionHeader>
            <StyledEditorSectionContent>
              <MultiInput
                disabled={!userCanEdit}
                values={statement.notes}
                onChange={(newValues: string[]) => {
                  updateActantMutation.mutate({ notes: newValues });
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
      <Loader
        show={
          isFetchingStatement ||
          updateActionsRefreshListMutation.isLoading ||
          updateActantsRefreshListMutation.isLoading ||
          updateStatementDataMutation.isLoading
        }
      />
    </>
  );
};
