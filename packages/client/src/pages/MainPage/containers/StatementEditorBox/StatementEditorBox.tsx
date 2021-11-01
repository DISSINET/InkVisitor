import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import api from "api";

import {
  FaTrashAlt,
  FaPlus,
  FaUnlink,
  FaCaretUp,
  FaCaretDown,
} from "react-icons/fa";

import { ActantTag } from "./../";
import {
  CProp,
  CReference,
  CStatementActant,
  CStatementAction,
} from "constructors";

import {
  IActant,
  IStatementProp,
  IStatementReference,
  IResponseStatement,
} from "@shared/types";
import { Button, Input, Loader, MultiInput } from "components";
import { ActantSuggester } from "./../";

import {
  StyledReferencesListColumn,
  StyledListHeaderColumn,
  StyledPropsActantHeader,
  StyledPropsActantList,
  StyledPropLineColumn,
  StyledReferencesList,
  StyledTagsList,
  StyledTagsListItem,
  StyledEditorSection,
  StyledEditorSectionContent,
  StyledEditorSectionHeader,
  StyledEditorActantTableWrapper,
  StyledPropButtonGroup,
} from "./StatementEditorBoxStyles";
import { StatementEditorActantTable } from "./StatementEditorActantTable/StatementEditorActantTable";
import { StatementEditorActionTable } from "./StatementEditorActionTable/StatementEditorActionTable";
import { AttributesEditor } from "../AttributesEditor/AttributesEditor";
import { StyledSubRow } from "./StatementEditorActionTable/StatementEditorActionTableRow/StatementEditorActionTableRowStyles";
import { ColumnInstance } from "react-table";
import { useSearchParams } from "hooks";
import { AttributeButtonGroup } from "../AttributeButtonGroup/AttributeButtonGroup";
import { UserRoleMode } from "@shared/enums";

const classesActants = ["A", "T", "R", "P", "G", "O", "C", "L", "V", "E"];
const classesPropType = ["C"];
const classesPropValue = [
  "A",
  "P",
  "G",
  "O",
  "C",
  "L",
  "V",
  "E",
  "S",
  "T",
  "R",
];
const classesResources = ["R"];
const classesTags = ["A", "T", "R", "P", "G", "O", "C", "L", "V", "E"];

export const StatementEditorBox: React.FC = () => {
  const { statementId, setStatementId } = useSearchParams();

  const queryClient = useQueryClient();

  // Statement query
  const {
    status: statusStatement,
    data: statement,
    error: errorStatement,
    isFetching: isFetchingStatement,
  } = useQuery(
    ["statement", statementId],
    async () => {
      const res = await api.statementGet(statementId);
      return res.data;
    },
    { enabled: !!statementId && api.isLoggedIn(), retry: 2 }
  );

  const userCanEdit: boolean = useMemo(() => {
    return (
      !!statement &&
      (statement.right === UserRoleMode.Admin ||
        statement.right === UserRoleMode.Write)
    );
  }, [statement]);

  console.log("user can edit", userCanEdit);

  useEffect(() => {
    if (
      errorStatement &&
      (errorStatement as any).error === "StatementDoesNotExits"
    ) {
      setStatementId("");
    }
  }, [errorStatement]);

  // getting origin actants of properties
  const propsByOrigins = useMemo(() => {
    if (statement) {
      const allProps = statement?.data.props;

      const statementActants = statement?.actants?.filter(
        (sa) =>
          statement.data.actants.map((a) => a.actant).includes(sa.id) ||
          statement.data.actions.map((a) => a.action).includes(sa.id)
      );

      const allPossibleOrigins = [...(statementActants || [])];

      const originProps: {
        [key: string]: {
          type: "action" | "actant";
          origin: string;
          props: any[];
          actant: IActant;
        };
      } = {};

      allPossibleOrigins.forEach((origin) => {
        originProps[origin.id as string] = {
          type: origin.class === "A" ? "action" : "actant",
          origin: origin.id,
          props: [],
          actant: origin,
        };
      });

      // 1st level
      allProps.forEach((prop) => {
        const originProp = originProps[prop.origin];
        if (originProp) {
          originProp.props.push({ ...prop, ...{ props: [] } });
        }
      });

      // 2nd level
      allProps.forEach((prop) => {
        Object.keys(originProps).forEach((opKey: string) => {
          const op = originProps[opKey];
          op.props.forEach((op2) => {
            if (op2.id === prop.origin) {
              op2.props.push(prop);
            }
          });
        });
      });

      return originProps;
    } else {
      return {};
    }
  }, [JSON.stringify(statement)]);

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

  const updateProp = (propId: string, changes: any) => {
    if (statement && propId) {
      const updatedProps = statement.data.props.map((p) =>
        p.id === propId ? { ...p, ...changes } : p
      );

      const newData = { ...{ props: updatedProps } };
      updateActantsDataMutation.mutate(newData);
    }
  };

  const addProp = (originId: string) => {
    if (statement && originId) {
      const newProp = CProp();
      newProp.origin = originId;

      const newData = { props: [...statement.data.props, newProp] };
      updateActantsDataMutation.mutate(newData);
    }
  };

  const removeProp = (propId: string) => {
    if (statement && propId) {
      const newData = {
        props: statement.data.props.filter((p) => p.id !== propId),
      };
      updateActantsDataMutation.mutate(newData);
    }
  };

  const movePropUp = (propId: string) => {
    if (statement) {
      const propToMove = statement.data.props.find((p) => p.id === propId);
      if (propToMove) {
        const propsForOriginIds = statement.data.props
          .filter((p) => p.origin === propToMove.origin)
          .map((p) => p.id);
        if (propsForOriginIds.length > 1) {
          const statementsPropIds = statement.data.props.map((p) => p.id);
          const oldIndex = statementsPropIds.indexOf(propId);
          const oldIndexInPropsForOriginId = propsForOriginIds.indexOf(propId);

          if (oldIndex !== 0 && oldIndexInPropsForOriginId !== 0) {
            const previousIndexInPropsForOriginId =
              oldIndexInPropsForOriginId - 1;
            const previousIndexInProps = statementsPropIds.indexOf(
              propsForOriginIds[previousIndexInPropsForOriginId]
            );
            const oldIndex = statementsPropIds.indexOf(propId);

            const newStatementProps = [...statement.data.props];

            newStatementProps.splice(
              oldIndex,
              0,
              newStatementProps.splice(previousIndexInProps, 1)[0]
            );

            updateActantsDataMutation.mutate({ props: newStatementProps });
          }
        }
      }
    }
  };

  const movePropDown = (propId: string) => {
    if (statement) {
      const propToMove = statement.data.props.find((p) => p.id === propId);
      if (propToMove) {
        const propsForOriginIds = statement.data.props
          .filter((p) => p.origin === propToMove.origin)
          .map((p) => p.id);
        if (propsForOriginIds.length > 1) {
          const statementsPropIds = statement.data.props.map((p) => p.id);
          const oldIndex = statementsPropIds.indexOf(propId);
          const oldIndexInPropsForOriginId = propsForOriginIds.indexOf(propId);

          if (
            oldIndex !== statementsPropIds.length &&
            oldIndexInPropsForOriginId !== propsForOriginIds.length
          ) {
            const nextIndexInPropsForOriginId = oldIndexInPropsForOriginId + 1;
            const nextIndexInProps = statementsPropIds.indexOf(
              propsForOriginIds[nextIndexInPropsForOriginId]
            );
            const oldIndex = statementsPropIds.indexOf(propId);

            const newStatementProps = [...statement.data.props];

            newStatementProps.splice(
              oldIndex,
              0,
              newStatementProps.splice(nextIndexInProps, 1)[0]
            );

            updateActantsDataMutation.mutate({ props: newStatementProps });
          }
        }
      }
    }
  };

  // references
  const addReference = (resourceId: string) => {
    if (statement && resourceId) {
      const newReference: IStatementReference = CReference(resourceId);
      const newData = {
        references: [...statement.data.references, newReference],
      };
      updateActantsDataMutation.mutate(newData);
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
      updateActantsDataMutation.mutate(newData);
    }
  };
  const removeReference = (referenceId: string) => {
    if (statement && referenceId) {
      const newData = {
        references: statement.data.references.filter(
          (p) => p.id !== referenceId
        ),
      };
      updateActantsDataMutation.mutate(newData);
    }
  };

  //tags
  const addTag = (tagId: string) => {
    if (statement && tagId) {
      const newData = { tags: [...statement.data.tags, tagId] };
      updateActantsDataMutation.mutate(newData);
    }
  };
  const removeTag = (tagId: string) => {
    if (statement && tagId) {
      const newData = { tags: statement.data.tags.filter((p) => p !== tagId) };
      updateActantsDataMutation.mutate(newData);
    }
  };

  const updateActantsDataMutation = useMutation(
    async (changes: object) =>
      await api.actantsUpdate(statementId, {
        data: changes,
      }),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(["statement"]);
      },
    }
  );

  const updateActantMutation = useMutation(
    async (changes: object) => await api.actantsUpdate(statementId, changes),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["statement"]);
      },
    }
  );

  const updateActionsRefreshListMutation = useMutation(
    async (changes: object) => {
      await api.actantsUpdate(statementId, {
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

  const updateActantsRefreshListMutation = useMutation(
    async (changes: object) =>
      await api.actantsUpdate(statementId, {
        data: changes,
      }),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries("statement");
        queryClient.invalidateQueries("territory");
        queryClient.invalidateQueries("actant");
      },
    }
  );

  const renderPropGroup = (
    propOriginId: string,
    statement: IResponseStatement,
    visibleColumns: ColumnInstance<{}>[]
  ) => {
    const propOrigin = propsByOrigins[propOriginId];
    const originActant = propOrigin?.actant;

    if (originActant && propOrigin.props.length > 0) {
      return (
        <tr>
          <td colSpan={visibleColumns.length + 1}>
            <StyledSubRow>
              <React.Fragment key={originActant.id}>
                <StyledPropsActantHeader></StyledPropsActantHeader>

                <StyledPropsActantList>
                  <StyledListHeaderColumn>Type</StyledListHeaderColumn>
                  <StyledListHeaderColumn>Value</StyledListHeaderColumn>
                  <StyledListHeaderColumn></StyledListHeaderColumn>
                  {propOrigin.props.map((prop1: any, pi1: number) => {
                    return (
                      <React.Fragment key={prop1 + pi1}>
                        {renderPropRow(statement, prop1, "1", pi1, false)}
                        {prop1.props.map((prop2: any, pi2: number) => {
                          return renderPropRow(
                            statement,
                            prop2,
                            "2",
                            pi2,
                            pi2 === prop1.props.length - 1
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </StyledPropsActantList>
              </React.Fragment>
            </StyledSubRow>
          </td>
        </tr>
      );
    }
  };

  const renderPropRow = (
    statement: IResponseStatement,
    prop: IStatementProp,
    level: "1" | "2",
    order: number,
    lastSecondLevel: boolean
  ) => {
    const propTypeActant = statement.actants?.find(
      (a) => a.id === prop.type.id
    );
    const propValueActant = statement.actants?.find(
      (a) => a.id === prop.value.id
    );

    return (
      <React.Fragment key={prop.origin + level + "|" + order}>
        <StyledPropLineColumn
          padded={level === "2"}
          lastSecondLevel={lastSecondLevel}
        >
          {propTypeActant ? (
            <ActantTag
              actant={propTypeActant}
              short={false}
              button={
                <Button
                  key="d"
                  icon={<FaUnlink />}
                  color="plain"
                  inverted={true}
                  tooltip="unlink actant"
                  onClick={() => {
                    updateProp(prop.id, {
                      type: {
                        ...prop.type,
                        ...{ id: "" },
                      },
                    });
                  }}
                />
              }
            />
          ) : (
            <ActantSuggester
              openDetailOnCreate
              onSelected={(newSelectedId: string) => {
                updateProp(prop.id, {
                  type: {
                    ...prop.type,
                    ...{ id: newSelectedId },
                  },
                });
              }}
              categoryIds={classesPropType}
            ></ActantSuggester>
          )}
          <StyledPropButtonGroup>
            <AttributesEditor
              modalTitle={`Property Type attributes [${
                propTypeActant ? propTypeActant.label : ""
              }]`}
              entityType={propTypeActant ? propTypeActant.class : false}
              data={{
                elvl: prop.type.elvl,
                logic: prop.type.logic,
                virtuality: prop.type.virtuality,
                partitivity: prop.type.partitivity,
              }}
              handleUpdate={(newData) => {
                updateProp(prop.id, { type: { ...prop.type, ...newData } });
              }}
              loading={updateActantsDataMutation.isLoading}
            />
          </StyledPropButtonGroup>
        </StyledPropLineColumn>
        <StyledPropLineColumn
          padded={level === "2"}
          lastSecondLevel={lastSecondLevel}
        >
          {propValueActant ? (
            <ActantTag
              actant={propValueActant}
              short={false}
              button={
                <Button
                  key="d"
                  icon={<FaUnlink />}
                  tooltip="unlink actant"
                  color="plain"
                  inverted={true}
                  onClick={() => {
                    updateProp(prop.id, {
                      value: {
                        ...prop.value,
                        ...{ id: "" },
                      },
                    });
                  }}
                />
              }
            />
          ) : (
            <ActantSuggester
              openDetailOnCreate
              onSelected={(newSelectedId: string) => {
                updateProp(prop.id, {
                  value: {
                    ...prop.type,
                    ...{ id: newSelectedId },
                  },
                });
              }}
              categoryIds={classesPropValue}
            ></ActantSuggester>
          )}
          <StyledPropButtonGroup>
            <AttributesEditor
              modalTitle={`Property Value attributes [${
                propValueActant ? propValueActant.label : ""
              }]`}
              entityType={propValueActant ? propValueActant.class : false}
              data={{
                elvl: prop.value.elvl,
                logic: prop.value.logic,
                virtuality: prop.value.virtuality,
                partitivity: prop.value.partitivity,
              }}
              handleUpdate={(newData) => {
                updateProp(prop.id, {
                  value: { ...prop.value, ...newData },
                });
              }}
              loading={updateActantsDataMutation.isLoading}
            />
          </StyledPropButtonGroup>
        </StyledPropLineColumn>

        <StyledPropLineColumn lastSecondLevel={lastSecondLevel}>
          <StyledPropButtonGroup leftMargin={false}>
            <AttributesEditor
              modalTitle={`Property Statement attributes [${propValueActant?.label} - ${propTypeActant?.label}]`}
              data={{
                elvl: prop.elvl,
                certainty: prop.certainty,
                logic: prop.logic,
                mood: prop.mood,
                moodvariant: prop.moodvariant,
                operator: prop.operator,
                bundleStart: prop.bundleStart,
                bundleEnd: prop.bundleEnd,
              }}
              handleUpdate={(newData) => {
                updateProp(prop.id, newData);
              }}
              loading={updateActantsDataMutation.isLoading}
            />
            {level === "1" && (
              <Button
                key="add"
                icon={<FaPlus />}
                tooltip="add second level prop"
                color="plain"
                inverted={true}
                onClick={() => {
                  addProp(prop.id);
                }}
              />
            )}
            <Button
              key="delete"
              icon={<FaTrashAlt />}
              tooltip="remove prop row"
              color="plain"
              inverted={true}
              onClick={() => {
                removeProp(prop.id);
              }}
            />{" "}
            <Button
              key="up"
              inverted
              icon={<FaCaretUp />}
              tooltip="move prop up"
              color="plain"
              onClick={() => {
                movePropUp(prop.id);
              }}
            />
            <Button
              key="down"
              inverted
              icon={<FaCaretDown />}
              tooltip="move prop down"
              color="plain"
              onClick={() => {
                movePropDown(prop.id);
              }}
            />
          </StyledPropButtonGroup>
        </StyledPropLineColumn>
      </React.Fragment>
    );
  };

  return (
    <>
      {statement ? (
        <div style={{ marginBottom: "4rem" }} key={statement.id}>
          <StyledEditorSection firstSection key="editor-section-summary">
            <StyledEditorSectionContent firstSection>
              <div>
                <div>
                  <Input
                    disabled={!userCanEdit}
                    type="textarea"
                    width="full"
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
                  statement={statement}
                  statementId={statementId}
                  updateActionsMutation={updateActionsRefreshListMutation}
                  renderPropGroup={renderPropGroup}
                  addProp={addProp}
                  propsByOrigins={propsByOrigins}
                />
              </StyledEditorActantTableWrapper>

              {userCanEdit && (
                <ActantSuggester
                  openDetailOnCreate
                  onSelected={(newSelectedId: string) => {
                    addAction(newSelectedId);
                  }}
                  categoryIds={["A"]}
                  placeholder={"add new action"}
                ></ActantSuggester>
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
                  statementId={statementId}
                  classEntitiesActant={classesActants}
                  updateActantsMutation={updateActantsRefreshListMutation}
                  renderPropGroup={renderPropGroup}
                  addProp={addProp}
                  propsByOrigins={propsByOrigins}
                />
              </StyledEditorActantTableWrapper>
              {userCanEdit && (
                <ActantSuggester
                  openDetailOnCreate
                  onSelected={(newSelectedId: string) => {
                    addActant(newSelectedId);
                  }}
                  categoryIds={classesActants}
                  placeholder={"add new actant"}
                ></ActantSuggester>
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
                    const referenceActant = statement?.actants?.find(
                      (a) => a.id === reference.resource
                    );

                    return (
                      <React.Fragment key={ri}>
                        <StyledReferencesListColumn>
                          {referenceActant ? (
                            <ActantTag
                              actant={referenceActant}
                              short={false}
                              button={
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
                              }
                            />
                          ) : (
                            <ActantSuggester
                              openDetailOnCreate
                              onSelected={(newSelectedId: string) => {
                                updateReference(reference.id, {
                                  resource: newSelectedId,
                                });
                              }}
                              categoryIds={classesResources}
                            ></ActantSuggester>
                          )}
                        </StyledReferencesListColumn>
                        <StyledReferencesListColumn>
                          <Input
                            type="text"
                            value={reference.part}
                            onChangeFn={(newPart: string) => {
                              updateReference(reference.id, {
                                part: newPart,
                              });
                            }}
                          ></Input>
                        </StyledReferencesListColumn>
                        <StyledReferencesListColumn>
                          <AttributeButtonGroup
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
                        </StyledReferencesListColumn>
                        <StyledReferencesListColumn>
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
                        </StyledReferencesListColumn>
                      </React.Fragment>
                    );
                  }
                )}
              </StyledReferencesList>
              {userCanEdit && (
                <ActantSuggester
                  openDetailOnCreate
                  onSelected={(newSelectedId: string) => {
                    addReference(newSelectedId);
                  }}
                  categoryIds={classesResources}
                  placeholder={"add new reference"}
                ></ActantSuggester>
              )}
            </StyledEditorSectionContent>
          </StyledEditorSection>

          {/* Tags */}
          <StyledEditorSection key="editor-section-tags">
            <StyledEditorSectionHeader>Tags</StyledEditorSectionHeader>
            <StyledEditorSectionContent>
              <StyledTagsList>
                {statement.data.tags.map((tag: string) => {
                  const tagActant = statement?.actants?.find(
                    (a) => a.id === tag
                  );
                  return (
                    tagActant && (
                      <StyledTagsListItem key={tag}>
                        <ActantTag
                          actant={tagActant}
                          short={false}
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
                <ActantSuggester
                  openDetailOnCreate
                  onSelected={(newSelectedId: string) => {
                    addTag(newSelectedId);
                  }}
                  categoryIds={classesTags}
                  placeholder={"add new tag"}
                ></ActantSuggester>
              )}
            </StyledEditorSectionContent>
          </StyledEditorSection>

          {/* Notes */}
          <StyledEditorSection key="editor-section-notes" lastSection>
            <StyledEditorSectionHeader>Notes</StyledEditorSectionHeader>
            <StyledEditorSectionContent>
              <MultiInput
                values={statement.notes}
                onChange={(newValues: string[]) => {
                  updateActantMutation.mutate({ notes: newValues });
                }}
              />
            </StyledEditorSectionContent>
          </StyledEditorSection>
        </div>
      ) : (
        "no statement selected"
      )}
      <Loader
        show={isFetchingStatement || updateActantsRefreshListMutation.isLoading}
      />
    </>
  );
};
