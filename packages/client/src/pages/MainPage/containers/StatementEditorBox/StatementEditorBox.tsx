import React, { useMemo, useEffect, Profiler } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import api from "api";
import {
  FaTrashAlt,
  FaPlus,
  FaUnlink,
  FaCaretUp,
  FaCaretDown,
} from "react-icons/fa";
import { EntityTag } from "./../";
import {
  CProp,
  CReference,
  CStatementActant,
  CStatementAction,
} from "constructors";
import {
  IActant,
  IStatementReference,
  IResponseStatement,
  IProp,
  IStatementAction,
  IStatementActant,
} from "@shared/types";
import {
  AttributeIcon,
  Button,
  ButtonGroup,
  Input,
  Loader,
  MultiInput,
} from "components";
import { EntitySuggester } from "./../";
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
  StyledEditorPreSection,
  StyledTagWrapper,
  StyledBreadcrumbWrap,
} from "./StatementEditorBoxStyles";
import { StatementEditorActantTable } from "./StatementEditorActantTable/StatementEditorActantTable";
import { StatementEditorActionTable } from "./StatementEditorActionTable/StatementEditorActionTable";
import { ColumnInstance } from "react-table";
import { useSearchParams } from "hooks";
import { AttributeButtonGroup } from "../AttributeButtonGroup/AttributeButtonGroup";
import { ActantType, UserRoleMode } from "@shared/enums";
import { StyledSubRow } from "./StatementEditorActionTable/StatementEditorActionTableStyles";
import { StatementListBreadcrumbItem } from "../StatementsListBox/StatementListHeader/StatementListBreadcrumbItem/StatementListBreadcrumbItem";
import { excludedSuggesterEntities } from "Theme/constants";
import { BsArrow90DegLeft, BsArrowRightShort } from "react-icons/bs";
import { StyledItemBox } from "../StatementsListBox/StatementListHeader/StatementListBreadcrumbItem/StatementListBreadcrumbItemStyles";
import { AuditTable } from "./../AuditTable/AuditTable";
import { JSONExplorer } from "../JSONExplorer/JSONExplorer";
import { AttributesGroupEditor } from "../AttributesEditor/AttributesGroupEditor";
import { AttributeGroupDataObject } from "types";

const classesActants = [
  ActantType.Statement,
  ActantType.Action,
  ActantType.Territory,
  ActantType.Resource,
  ActantType.Person,
  ActantType.Group,
  ActantType.Object,
  ActantType.Concept,
  ActantType.Location,
  ActantType.Value,
  ActantType.Event,
];
const classesPropType = [ActantType.Concept];
const classesPropValue = [
  ActantType.Action,
  ActantType.Person,
  ActantType.Group,
  ActantType.Object,
  ActantType.Concept,
  ActantType.Location,
  ActantType.Value,
  ActantType.Event,
  ActantType.Statement,
  ActantType.Territory,
  ActantType.Resource,
];
const classesResources = [ActantType.Resource];
const classesTags = [
  ActantType.Action,
  ActantType.Territory,
  ActantType.Resource,
  ActantType.Person,
  ActantType.Group,
  ActantType.Object,
  ActantType.Concept,
  ActantType.Location,
  ActantType.Value,
  ActantType.Event,
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

  console.log(statement);

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
    ["territoryActants", statement?.data.territory.id],
    async () => {
      if (statement?.data.territory.id) {
        const res = await api.actantIdsInTerritory(
          statement?.data.territory.id
        );
        return res.data;
      } else {
        return [];
      }
    },
    {
      initialData: [],
      enabled: !!statement?.data.territory.id && api.isLoggedIn(),
    }
  );

  // refetch audit when statement changes
  useEffect(() => {
    queryClient.invalidateQueries("audit");
  }, [statement]);

  // stores territory id
  const statementTerritoryId: string | undefined = useMemo(() => {
    return statement?.data.territory.id;
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
      const res = await api.actantsGet(statementTerritoryId as string);
      return res.data;
    },
    {
      enabled: !!statementId && !!statementTerritoryId,
      retry: 2,
    }
  );

  //TODO recurse to get all parents
  const territoryPath =
    territoryData && Array(territoryData["data"]["parent"]["id"]);

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

  const updateProp = (propId: string, changes: any) => {
    if (statement && propId) {
      const newStatementData = { ...statement.data };

      // this is probably an overkill
      [...newStatementData.actants, ...newStatementData.actions].forEach(
        (actant: IStatementActant | IStatementAction) => {
          actant.props.forEach((actantProp, pi) => {
            if (actantProp.id === propId) {
              actant.props[pi] = { ...actant.props[pi], ...changes };
            }

            actant.props[pi].children.forEach((actantPropProp, pii) => {
              if (actantPropProp.id === propId) {
                actant.props[pi].children[pii] = {
                  ...actant.props[pi].children[pii],
                  ...changes,
                };
                console.log("update prop", changes);
              }
            });
          });
        }
      );

      updateStatementDataMutation.mutate(newStatementData);
    }
  };

  const addProp = (
    originId: string,
    mode: "actions" | "actants" = "actants"
  ) => {
    if (statement && originId) {
      const newProp = CProp();
      const newStatementData = { ...statement.data };
      newStatementData[mode].forEach((potentialPropOrigin) => {
        if (
          (mode === "actants" &&
            (potentialPropOrigin as IStatementActant).actant === originId) ||
          (mode === "actions" &&
            (potentialPropOrigin as IStatementAction).action === originId)
        ) {
          potentialPropOrigin.props.push(newProp);
        }
      });

      updateStatementDataMutation.mutate(newStatementData);
    }
  };

  const addPropSecondLvl = (
    originId: string,
    mode: "actions" | "actants" = "actants"
  ) => {
    if (statement && originId) {
      const newProp = CProp();
      const newStatementData = { ...statement.data };

      newStatementData[mode].forEach((actantOrActionInStatement) => {
        actantOrActionInStatement.props.forEach((potentialPropOrigin) => {
          if ((potentialPropOrigin as IProp).id === originId) {
            potentialPropOrigin.children.push(newProp);
          }
        });
      });

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

          actant.props.forEach((actantProp, pi) => {
            actant.props[pi].children = actant.props[pi].children.filter(
              (childProp) => childProp.id != propId
            );
          });
        }
      );

      updateStatementDataMutation.mutate(newStatementData);
    }
  };

  //actant.props = actant.props.splice(index + 1, 0, actant.props.splice(index, 1)[0]);
  const movePropUp = (propId: string) => {
    if (statement) {
      const newStatementData = { ...statement.data };

      [...newStatementData.actants, ...newStatementData.actions].forEach(
        (actant: IStatementActant | IStatementAction) => {
          actant.props.forEach((actantProp, pi) => {
            console.log({ ...actant });
            if (actantProp.id === propId) {
              actant.props.splice(pi - 1, 0, actant.props.splice(pi, 1)[0]);
            }

            console.log(actant);
            actant.props[pi].children.forEach((actantPropProp, pii) => {
              if (actantPropProp.id === propId) {
                actant.props[pi].children.splice(
                  pii - 1,
                  0,
                  actant.props[pi].children.splice(pii, 1)[0]
                );
              }
            });
          });
        }
      );

      updateStatementDataMutation.mutate(newStatementData);
    }
  };

  const movePropDown = (propId: string) => {
    if (statement) {
      const newStatementData = { ...statement.data };

      [...newStatementData.actants, ...newStatementData.actions].forEach(
        (actant: IStatementActant | IStatementAction) => {
          actant.props.forEach((actantProp, pi) => {
            console.log({ ...actant });
            if (actantProp.id === propId) {
              actant.props.splice(pi + 1, 0, actant.props.splice(pi, 1)[0]);
            }

            console.log(actant);
            actant.props[pi].children.forEach((actantPropProp, pii) => {
              if (actantPropProp.id === propId) {
                actant.props[pi].children.splice(
                  pii + 1,
                  0,
                  actant.props[pi].children.splice(pii, 1)[0]
                );
              }
            });
          });
        }
      );

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
      await api.actantsUpdate(statementId, {
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

  const updateActantMutation = useMutation(
    async (changes: object) => await api.actantsUpdate(statementId, changes),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["statement"]);
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
    originId: string,
    props: IProp[],
    statement: IResponseStatement,
    visibleColumns: ColumnInstance<{}>[],
    mode: "actions" | "actants" = "actants"
  ) => {
    const originActant = statement.entities[originId];

    if (originActant && props.length > 0) {
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
                  {props.map((prop1: IProp, pi1: number) => {
                    return (
                      <React.Fragment key={prop1.id}>
                        {renderPropRow(
                          statement,
                          originId,
                          prop1,
                          "1",
                          pi1,
                          props.length,
                          false,
                          mode
                        )}
                        {prop1.children.map((prop2: any, pi2: number) => {
                          return renderPropRow(
                            statement,
                            originId,
                            prop2,
                            "2",
                            pi2,
                            props.length,
                            pi2 === prop1.children.length - 1,
                            mode
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
    originId: string,
    prop: IProp,
    level: "1" | "2",
    order: number,
    allPropsAtTheLevelNo: number,
    lastSecondLevel: boolean,
    mode: "actions" | "actants" = "actants"
  ) => {
    const propTypeActant = statement.entities[prop.type.id];
    const propValueActant = statement.entities[prop.value.id];

    return (
      <React.Fragment key={originId + level + "|" + order}>
        <StyledPropLineColumn
          padded={level === "2"}
          lastSecondLevel={lastSecondLevel}
          isTag={propTypeActant ? true : false}
        >
          {propTypeActant ? (
            <EntityTag
              actant={propTypeActant}
              fullWidth
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
            <EntitySuggester
              territoryActants={territoryActants}
              openDetailOnCreate
              onSelected={(newSelectedId: string) => {
                updateProp(prop.id, {
                  type: {
                    ...prop.type,
                    ...{ id: newSelectedId },
                  },
                });
              }}
              categoryTypes={classesPropType}
              inputWidth={"full"}
              excludedEntities={excludedSuggesterEntities}
            />
          )}
          <StyledPropButtonGroup>
            {prop.type.logic == "2" ? (
              <Button
                key="neg"
                tooltip="Negative logic"
                color="success"
                inverted={true}
                noBorder
                icon={<AttributeIcon attributeName={"negation"} />}
              />
            ) : (
              <div />
            )}
          </StyledPropButtonGroup>
        </StyledPropLineColumn>
        <StyledPropLineColumn
          padded={level === "2"}
          lastSecondLevel={lastSecondLevel}
          isTag={propValueActant ? true : false}
        >
          {propValueActant ? (
            <EntityTag
              actant={propValueActant}
              fullWidth
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
            <EntitySuggester
              territoryActants={territoryActants}
              openDetailOnCreate
              onSelected={(newSelectedId: string) => {
                updateProp(prop.id, {
                  value: {
                    ...prop.type,
                    ...{ id: newSelectedId },
                  },
                });
              }}
              categoryTypes={classesPropValue}
              inputWidth={"full"}
              excludedEntities={excludedSuggesterEntities}
            />
          )}
          <StyledPropButtonGroup>
            {prop.value.logic == "2" ? (
              <Button
                key="neg"
                tooltip="Negative logic"
                color="success"
                inverted={true}
                noBorder
                icon={<AttributeIcon attributeName={"negation"} />}
              />
            ) : (
              <div />
            )}
          </StyledPropButtonGroup>
        </StyledPropLineColumn>

        <StyledPropLineColumn lastSecondLevel={lastSecondLevel}>
          <StyledPropButtonGroup>
            <AttributesGroupEditor
              modalTitle={`Property attributes`}
              disabledAllAttributes={!userCanEdit}
              propTypeActant={propTypeActant}
              propValueActant={propValueActant}
              excludedSuggesterEntities={excludedSuggesterEntities}
              classesPropType={classesPropType}
              classesPropValue={classesPropValue}
              updateProp={updateProp}
              statementId={prop.id}
              data={{
                statement: {
                  elvl: prop.elvl,
                  certainty: prop.certainty,
                  logic: prop.logic,
                  mood: prop.mood,
                  moodvariant: prop.moodvariant,
                  operator: prop.operator,
                  bundleStart: prop.bundleStart,
                  bundleEnd: prop.bundleEnd,
                },
                type: {
                  elvl: prop.type.elvl,
                  logic: prop.type.logic,
                  virtuality: prop.type.virtuality,
                  partitivity: prop.type.partitivity,
                },
                value: {
                  elvl: prop.value.elvl,
                  logic: prop.value.logic,
                  virtuality: prop.value.virtuality,
                  partitivity: prop.value.partitivity,
                },
              }}
              handleUpdate={(newData: AttributeGroupDataObject) => {
                const newDataObject = {
                  ...newData.statement,
                  ...newData,
                };
                const { statement, ...statementPropObject } = newDataObject;
                updateProp(prop.id, statementPropObject);
              }}
              userCanEdit={userCanEdit}
              loading={updateStatementDataMutation.isLoading}
            />

            {level === "1" && (
              <Button
                key="add"
                icon={<FaPlus />}
                tooltip="add second level prop"
                color="plain"
                inverted={true}
                onClick={() => {
                  addPropSecondLvl(prop.id, mode);
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
            />
            <Button
              key="up"
              inverted
              disabled={order === 0}
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
              disabled={order === allPropsAtTheLevelNo - 1}
              icon={<FaCaretDown />}
              tooltip="move prop down"
              color="plain"
              onClick={() => {
                movePropDown(prop.id);
              }}
            />
            {prop.logic == "2" ? (
              <Button
                key="neg"
                tooltip="Negative logic"
                color="success"
                inverted={true}
                noBorder
                icon={<AttributeIcon attributeName={"negation"} />}
              />
            ) : (
              <div />
            )}
            {prop.operator ? (
              <Button
                key="oper"
                tooltip="Logical operator type"
                color="success"
                inverted={true}
                noBorder
                icon={prop.operator}
              />
            ) : (
              <div />
            )}
          </StyledPropButtonGroup>
        </StyledPropLineColumn>
      </React.Fragment>
    );
  };

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
                <StyledItemBox>
                  <BsArrowRightShort />
                  <EntityTag
                    actant={territoryData}
                    button={
                      <Button
                        icon={<BsArrow90DegLeft />}
                        tooltip="go to territory"
                        color="plain"
                        inverted
                        onClick={() => {
                          setTerritoryId(territoryData.id);
                        }}
                      />
                    }
                  />
                </StyledItemBox>
              )}
              <Loader size={20} show={isFetchingTerritory} />
            </StyledBreadcrumbWrap>
          </StyledEditorPreSection>
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
                  categoryTypes={[ActantType.Action]}
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
        <>{"no statement selected"}</>
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
