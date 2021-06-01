import React, { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import api from "api";
const queryString = require("query-string");

import {
  FaTrashAlt,
  FaPlus,
  FaUnlink,
  FaCaretUp,
  FaCaretDown,
} from "react-icons/fa";

import { useLocation, useHistory } from "react-router";

import {
  ActantTag,
  ActionDropdown,
  CertaintyToggle,
  ModalityToggle,
  ElvlToggle,
} from "./../";

import { CProp, CStatementActant } from "constructors";

import {
  actantPositionDict,
  referenceTypeDict,
} from "./../../../../../../shared/dictionaries";
import {
  IActant,
  IProp,
  IStatement,
  IStatementReference,
  IResponseStatement,
} from "@shared/types";
import { Button, Input, Loader } from "components";
import { ActantSuggester } from "./../";
import { StatementEditorActantList } from "./StatementEditorActantList/StatementEditorActantList";

import {
  StyledEditorSection,
  StyledEditorSectionHeader,
  StyledEditorSectionContent,
  StyledReferencesListColumn,
  StyledListHeaderColumn,
  StyledActantList,
  StyledActantListItem,
  StyledPropsActantHeader,
  StyledPropsActantList,
  StyledPropButtonGroup,
  StyledPropLineColumn,
  StyledReferencesList,
  StyledTagsList,
  StyledTagsListItem,
} from "./StatementEditorBoxStyles";
import { StatementEditorActantTable } from "./StatementEditorActantTable/StatementEditorActantTable";

const classesActants = ["P", "G", "O", "C", "L", "V", "E", "S", "T", "R"];
const classesPropType = ["C"];
const classesPropValue = ["P", "G", "O", "C", "L", "V", "E", "S", "T", "R"];
const classesResources = ["R"];
const classesTags = ["C", "P", "G", "O", "L", "V", "E", "S", "T", "R"];

export const StatementEditorBox: React.FC = () => {
  let history = useHistory();
  let location = useLocation();
  var hashParams = queryString.parse(location.hash);

  const statementId = hashParams.statement;
  const territoryId = hashParams.territory;

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
    { enabled: !!statementId && api.isLoggedIn() }
  );

  // getting origin actants of properties
  const propsByOrigins = useMemo(() => {
    if (statement) {
      // console.log(
      //   "getting new props",
      //   statement.data.actants,
      //   statement.actants
      // );
      const allProps = statement?.data.props;
      const statementItself = { ...statement };

      const statementActants = statement.actants.filter((sa) =>
        statement.data.actants.map((a) => a.actant).includes(sa.id)
      );

      const allPossibleOrigins = [statementItself, ...statementActants];

      const originProps: { origin: any; props: any[]; actant: IActant }[] = [];

      allPossibleOrigins.forEach((origin) => {
        originProps.push({ origin: origin.id, props: [], actant: origin });
      });

      // 1st level
      allProps.forEach((prop) => {
        const originProp = originProps.find((op) => op.origin === prop.origin);
        if (originProp) {
          originProp.props.push({ ...prop, ...{ props: [] } });
        }
      });

      // 2nd level
      allProps.forEach((prop) => {
        originProps.forEach((op) => {
          op.props.forEach((op2) => {
            if (op2.id === prop.origin) {
              op2.props.push(prop);
            }
          });
        });
      });

      //console.log(originProps);

      return originProps;
    } else {
      return [];
    }
  }, [JSON.stringify(statement)]);

  const addActant = (newStatementActantId: string) => {
    if (statement) {
      const newStatementActant = CStatementActant();
      newStatementActant.actant = newStatementActantId;
      const newData = {
        actants: [...statement.data.actants, newStatementActant],
      };
      update(newData);
    }
  };

  const updateProp = (propId: string, changes: any) => {
    if (statement && propId) {
      const updatedProps = statement.data.props.map((p) =>
        p.id === propId ? { ...p, ...changes } : p
      );
      const newData = { ...{ props: updatedProps } };
      update(newData);
    }
  };

  const addProp = (originId: string) => {
    if (statement && originId) {
      const newProp = CProp();
      newProp.origin = originId;

      const newData = { props: [...statement.data.props, newProp] };
      update(newData);
    }
  };

  const removeProp = (propId: string) => {
    if (statement && propId) {
      const newData = {
        props: statement.data.props.filter((p) => p.id !== propId),
      };
      update(newData);
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

            update({ props: newStatementProps });
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

            update({ props: newStatementProps });
          }
        }
      }
    }
  };

  // references
  const addReference = () => {};
  const updateReference = (referenceId: string, changes: any) => {
    if (statement && referenceId) {
      const updatedReferences = statement.data.references.map((r) =>
        r.id === referenceId ? { ...r, ...changes } : r
      );
      const newData = {
        references: updatedReferences,
      };
      update(newData);
    }
  };
  const removeReference = (referenceId: string) => {
    if (statement && referenceId) {
      const newData = {
        references: statement.data.references.filter(
          (p) => p.id !== referenceId
        ),
      };
      update(newData);
    }
  };

  //tags
  const addTag = (tagId: string) => {
    if (statement && tagId) {
      const newData = { tags: [...statement.data.tags, tagId] };
      update(newData);
    }
  };
  const removeTag = (tagId: string) => {
    if (statement && tagId) {
      const newData = { tags: statement.data.tags.filter((p) => p !== tagId) };
      update(newData);
    }
  };

  const update = async (changes: object) => {
    const res = await api.actantsUpdate(statementId, {
      data: changes,
    });
    queryClient.invalidateQueries(["statement"]);
  };

  const renderPropGroup = (propOrigin: any, statement: IResponseStatement) => {
    const originActant = propOrigin.actant;

    if (originActant) {
      return (
        <React.Fragment key={originActant.id}>
          <StyledPropsActantHeader>
            <ActantTag actant={originActant} short={false} />
            <StyledPropButtonGroup>
              <Button
                key="d"
                icon={<FaPlus />}
                color="primary"
                tooltip="add new prop"
                onClick={() => {
                  addProp(originActant.id);
                }}
              />
            </StyledPropButtonGroup>
          </StyledPropsActantHeader>
          {propOrigin.props.length > 0 ? (
            <StyledPropsActantList>
              <StyledListHeaderColumn>Type</StyledListHeaderColumn>
              <StyledListHeaderColumn>Value</StyledListHeaderColumn>
              <StyledListHeaderColumn>Attributes</StyledListHeaderColumn>
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
          ) : null}
        </React.Fragment>
      );
    }
  };

  const renderPropRow = (
    statement: IResponseStatement,
    prop: IProp,
    level: "1" | "2",
    order: number,
    lastSecondLevel: boolean
  ) => {
    const propTypeActant = statement.actants.find((a) => a.id === prop.type.id);
    const propValueActant = statement.actants.find(
      (a) => a.id === prop.value.id
    );

    return (
      <React.Fragment key={prop.origin + level + "|" + order}>
        <StyledPropLineColumn></StyledPropLineColumn>
        <StyledPropLineColumn
          padded={level === "2"}
          lastSecondLevel={lastSecondLevel}
        >
          {propTypeActant ? (
            <React.Fragment>
              <ActantTag
                actant={propTypeActant}
                short={false}
                button={
                  <Button
                    key="d"
                    icon={<FaUnlink />}
                    color="danger"
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
              <StyledPropButtonGroup>
                <ElvlToggle
                  value={prop.type.elvl}
                  onChangeFn={(newValue: string) => {
                    updateProp(prop.id, {
                      type: {
                        ...prop.type,
                        ...{ elvl: newValue },
                      },
                    });
                  }}
                />
                <CertaintyToggle
                  value={prop.type.certainty}
                  onChangeFn={(newValue: string) => {
                    updateProp(prop.id, {
                      type: {
                        ...prop.type,
                        ...{ certainty: newValue },
                      },
                    });
                  }}
                />
              </StyledPropButtonGroup>
            </React.Fragment>
          ) : (
            <ActantSuggester
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
        </StyledPropLineColumn>
        <StyledPropLineColumn
          padded={level === "2"}
          lastSecondLevel={lastSecondLevel}
        >
          {propValueActant ? (
            <React.Fragment>
              <ActantTag
                actant={propValueActant}
                short={false}
                button={
                  <Button
                    key="d"
                    icon={<FaUnlink />}
                    tooltip="unlink actant"
                    color="danger"
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
              <StyledPropButtonGroup>
                <ElvlToggle
                  value={prop.value.elvl}
                  onChangeFn={(newValue: string) => {
                    updateProp(prop.id, {
                      value: {
                        ...prop.value,
                        ...{ elvl: newValue },
                      },
                    });
                  }}
                />
                <CertaintyToggle
                  value={prop.value.certainty}
                  onChangeFn={(newValue: string) => {
                    updateProp(prop.id, {
                      value: {
                        ...prop.value,
                        ...{ certainty: newValue },
                      },
                    });
                  }}
                />
              </StyledPropButtonGroup>
            </React.Fragment>
          ) : (
            <ActantSuggester
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
        </StyledPropLineColumn>
        <StyledPropLineColumn lastSecondLevel={lastSecondLevel}>
          <StyledPropButtonGroup leftMargin={false}>
            <ModalityToggle
              value={prop.modality}
              onChangeFn={(newValue: string) => {
                updateProp(prop.id, {
                  modality: newValue,
                });
              }}
            />
            <ElvlToggle
              value={prop.elvl}
              onChangeFn={(newValue: string) => {
                updateProp(prop.id, {
                  elvl: newValue,
                });
              }}
            />
            <CertaintyToggle
              value={prop.certainty}
              onChangeFn={(newValue: string) => {
                updateProp(prop.id, {
                  certainty: newValue,
                });
              }}
            />
          </StyledPropButtonGroup>
        </StyledPropLineColumn>
        <StyledPropLineColumn lastSecondLevel={lastSecondLevel}>
          <StyledPropButtonGroup leftMargin={false}>
            {level === "1" && (
              <Button
                key="add"
                icon={<FaPlus />}
                tooltip="add second level prop"
                color="primary"
                onClick={() => {
                  addProp(prop.id);
                }}
              />
            )}
            <Button
              key="delete"
              icon={<FaTrashAlt />}
              tooltip="remove prop row"
              color="danger"
              onClick={() => {
                removeProp(prop.id);
              }}
            />{" "}
            <Button
              key="up"
              inverted
              icon={<FaCaretUp />}
              tooltip="move prop up"
              color="info"
              onClick={() => {
                movePropUp(prop.id);
              }}
            />
            <Button
              key="down"
              inverted
              icon={<FaCaretDown />}
              tooltip="move prop down"
              color="info"
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
    <div>
      {statement ? (
        <div style={{ marginBottom: "4rem" }}>
          <div key={statement.id}>
            <StyledEditorSection firstSection key="editor-section-summary">
              <StyledEditorSectionHeader>Summary</StyledEditorSectionHeader>
              <StyledEditorSectionContent>
                <div>
                  <StyledListHeaderColumn>Action</StyledListHeaderColumn>
                  <div>
                    <StyledListHeaderColumn>Text</StyledListHeaderColumn>
                    <div>
                      <Input
                        type="textarea"
                        width={1000}
                        onChangeFn={(newValue: string) => {
                          const newData = {
                            ...{ text: newValue },
                            ...statement.data,
                          };
                          update(newData);
                        }}
                        value={statement.data.text}
                      />
                    </div>
                    <div>
                      <ActionDropdown
                        onSelectedChange={(newActionValue: {
                          value: string;
                          label: string;
                        }) => {
                          const newData = {
                            ...statement.data,
                            ...{ action: newActionValue.value },
                          };
                          update(newData);
                        }}
                        value={statement.data.action}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <StyledListHeaderColumn>Attributes</StyledListHeaderColumn>
                  <ModalityToggle
                    value={statement.data.modality}
                    onChangeFn={(newValue: string) => {
                      const newData = {
                        ...statement.data,
                        ...{ modality: newValue },
                      };
                      update(newData);
                    }}
                  />
                  <ElvlToggle
                    value={statement.data.elvl}
                    onChangeFn={(newValue: string) => {
                      const newData = {
                        ...statement.data,
                        ...{ elvl: newValue },
                      };
                      update(newData);
                    }}
                  />
                  <CertaintyToggle
                    value={statement.data.certainty}
                    onChangeFn={(newValue: string) => {
                      const newData = {
                        ...statement.data,
                        ...{ certainty: newValue },
                      };
                      update(newData);
                    }}
                  />
                </div>
              </StyledEditorSectionContent>
            </StyledEditorSection>

            {/* Actants */}
            <StyledEditorSection key="editor-section-actants">
              <StyledEditorSectionHeader>Actants</StyledEditorSectionHeader>
              <StyledEditorSectionContent>
                <StatementEditorActantList
                  statement={statement}
                  statementId={statementId}
                  classEntitiesActant={classesActants}
                />
                <StatementEditorActantTable
                  statement={statement}
                  moveEndRow={() => {}}
                />
                <ActantSuggester
                  onSelected={(newSelectedId: string) => {
                    addActant(newSelectedId);
                  }}
                  categoryIds={classesActants}
                  placeholder={"add new actant"}
                ></ActantSuggester>
              </StyledEditorSectionContent>
            </StyledEditorSection>

            {/* Statement Props */}
            <StyledEditorSection key="editor-section-props-statement">
              <StyledEditorSectionHeader>
                Statement Properties
              </StyledEditorSectionHeader>

              <StyledEditorSectionContent key={JSON.stringify(statement.data)}>
                {renderPropGroup(propsByOrigins[0], statement)}
              </StyledEditorSectionContent>
            </StyledEditorSection>

            {/* Actant Props */}
            <StyledEditorSection key="editor-section-props-actants">
              <StyledEditorSectionHeader>
                Actant Properties
              </StyledEditorSectionHeader>
              <StyledEditorSectionContent key={JSON.stringify(statement.data)}>
                {propsByOrigins.slice(1).map((propOrigin, sai) => {
                  return renderPropGroup(propOrigin, statement);
                })}
              </StyledEditorSectionContent>
            </StyledEditorSection>

            {/* Refs */}
            <StyledEditorSection key="editor-section-refs">
              <StyledEditorSectionHeader>References</StyledEditorSectionHeader>
              <StyledEditorSectionContent>
                <StyledReferencesList>
                  {statement.data.references.length > 0 && (
                    <React.Fragment>
                      <StyledListHeaderColumn></StyledListHeaderColumn>
                      <StyledListHeaderColumn>Resource</StyledListHeaderColumn>
                      <StyledListHeaderColumn>Part</StyledListHeaderColumn>
                      <StyledListHeaderColumn>Type</StyledListHeaderColumn>
                      <StyledListHeaderColumn></StyledListHeaderColumn>
                    </React.Fragment>
                  )}
                  {statement.data.references.map(
                    (reference: IStatementReference, ri) => {
                      const referenceActant = statement.actants.find(
                        (a) => a.id === reference.resource
                      );
                      return (
                        <React.Fragment key={ri}>
                          <StyledReferencesListColumn />
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
                                    color="danger"
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
                            <Input
                              type="select"
                              value={reference.type}
                              options={referenceTypeDict}
                              onChangeFn={(newType: any) => {
                                updateReference(reference.id, {
                                  type: newType,
                                });
                              }}
                            ></Input>
                          </StyledReferencesListColumn>
                          <StyledReferencesListColumn>
                            <Button
                              key="delete"
                              tooltip="remove reference row"
                              icon={<FaTrashAlt />}
                              color="danger"
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
                <ActantSuggester
                  onSelected={(newSelectedId: string) => {}}
                  categoryIds={classesResources}
                  placeholder={"add new reference"}
                ></ActantSuggester>
              </StyledEditorSectionContent>
            </StyledEditorSection>

            {/* Tags */}
            <StyledEditorSection key="editor-section-tags">
              <StyledEditorSectionHeader>Tags</StyledEditorSectionHeader>
              <StyledEditorSectionContent>
                <StyledTagsList>
                  {statement.data.tags.map((tag: string) => {
                    const tagActant = statement.actants.find(
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
                                color="danger"
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
                <ActantSuggester
                  onSelected={(newSelectedId: string) => {
                    addTag(newSelectedId);
                  }}
                  categoryIds={classesTags}
                  placeholder={"add new tag"}
                ></ActantSuggester>
              </StyledEditorSectionContent>
            </StyledEditorSection>

            {/* Notes */}
            <StyledEditorSection key="editor-section-notes" lastSection>
              <StyledEditorSectionHeader>Notes</StyledEditorSectionHeader>
              <StyledEditorSectionContent>
                <Input
                  type="textarea"
                  width={1000}
                  onChangeFn={(newValue: string) => {
                    const newData = {
                      ...statement.data,
                      ...{ note: newValue },
                    };
                    update(newData);
                  }}
                  value={statement.data.note}
                />
              </StyledEditorSectionContent>
            </StyledEditorSection>
          </div>
        </div>
      ) : (
        "no statement selected"
      )}
      <Loader show={isFetchingStatement} />
    </div>
  );
};
