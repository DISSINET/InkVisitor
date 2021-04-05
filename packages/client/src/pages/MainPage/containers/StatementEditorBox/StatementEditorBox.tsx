import React, { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import api from "api";
const queryString = require("query-string");

import styled from "styled-components";

import { FaTrashAlt, FaPlusCircle } from "react-icons/fa";

import { useLocation, useHistory } from "react-router";

import {
  ActantTag,
  ActionDropdown,
  CertaintyToggle,
  ModalityToggle,
  ElvlToggle,
} from "./../";

import { CProp, CStatementActant } from "constructors";

import { actantPositionDict } from "./../../../../../../shared/dictionaries";
import { IActant, IProp, IStatementActant } from "@shared/types";
import { Button, ButtonGroup, Input } from "components";
import { ActantSuggester } from "./../";

const classEntities = ["P", "G", "O", "C", "L", "V", "E"];

export const StatementEditorBox: React.FC = () => {
  let history = useHistory();
  let location = useLocation();
  var hashParams = queryString.parse(location.hash);

  const territoryId = hashParams.territory;
  const statementId = hashParams.statement;

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
    { enabled: !!statementId }
  );

  // getting origin actants of properties
  const propsByOrigins = useMemo(() => {
    if (statement) {
      console.log(
        "getting new props",
        statement.data.actants,
        statement.actants
      );
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
      const newData = { ...statement.data };
      newData.actants.push(newStatementActant);
      update(newData);
    }
  };
  const updateActant = (statementActantId: string, changes: any) => {
    if (statement && statementActantId) {
      const updatedActants = statement.data.actants.map((a) =>
        a.id === statementActantId ? { ...a, ...changes } : a
      );
      const newData = { ...statement.data, ...{ actants: updatedActants } };
      update(newData);
    }
  };

  const updateProp = (propId: string, changes: any) => {
    if (statement && propId) {
      const updatedProps = statement.data.props.map((p) =>
        p.id === propId ? { ...p, ...changes } : p
      );
      const newData = { ...statement.data, ...{ props: updatedProps } };
      update(newData);
    }
  };

  const addProp = (originId: string) => {
    if (statement && originId) {
      const newProp = CProp();
      newProp.origin = originId;
      const newData = { ...statement.data };
      newData.props.push(newProp);
      update(newData);
    }
  };

  const removeProp = (originId: string) => {
    if (statement && originId) {
      const newData = { ...statement.data };
      newData.props = newData.props.filter((p) => p.id !== originId);
      update(newData);
    }
  };

  const update = async (changes: object) => {
    const res = await api.actantsUpdate(statementId, {
      data: changes,
    });
    queryClient.invalidateQueries(["statement"]);
  };

  return (
    <div>
      {statement ? (
        <div style={{ marginBottom: "4rem" }}>
          <div key={statement.id}>
            <StyledEditorSection firstSection key="editor-section-summary">
              <StyledEditorSectionHeader>Summary</StyledEditorSectionHeader>
              <div className="editor-section-content">
                <div className="table-row">
                  <div className="label">Action</div>
                  <div className="value">
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
                <div className="table-row">
                  <div className="label">Text</div>
                  <div className="value">
                    <Input
                      type="textarea"
                      cols={55}
                      onChangeFn={(newValue: string) => {
                        const newData = {
                          ...statement.data,
                          ...{ text: newValue },
                        };
                        update(newData);
                      }}
                      value={statement.data.text}
                    />
                  </div>
                </div>
                <div className="table-row">
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
              </div>
            </StyledEditorSection>

            {/* Actants */}
            <StyledEditorSection key="editor-section-actants">
              <StyledEditorSectionHeader>Actants</StyledEditorSectionHeader>
              <div className="editor-section-content">
                <table className="">
                  <thead>
                    <tr>
                      <th key="actants"></th>
                      <th key="position"></th>
                      <th key="certainty"></th>
                      <th key="actions"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {statement.data.actants.map((sActant, sai) => {
                      const actant = statement.actants.find(
                        (a) => a.id === sActant.actant
                      );
                      if (actant) {
                        return (
                          <tr key={sai}>
                            <td>
                              <ActantTag
                                key={sai}
                                actant={actant}
                                short={false}
                              />
                            </td>
                            <td>
                              <Input
                                type="select"
                                value={sActant.position}
                                options={actantPositionDict}
                                onChangeFn={(newPosition: any) => {
                                  updateActant(sActant.id, {
                                    position: newPosition,
                                  });
                                }}
                              ></Input>
                            </td>
                            <td>
                              <ModalityToggle
                                value={sActant.modality}
                                onChangeFn={(newValue: string) => {
                                  updateActant(sActant.id, {
                                    modality: newValue,
                                  });
                                }}
                              />
                              <ElvlToggle
                                value={sActant.elvl}
                                onChangeFn={(newValue: string) => {
                                  updateActant(sActant.id, {
                                    elvl: newValue,
                                  });
                                }}
                              />
                              <CertaintyToggle
                                value={sActant.certainty}
                                onChangeFn={(newValue: string) => {
                                  updateActant(sActant.id, {
                                    certainty: newValue,
                                  });
                                }}
                              />
                            </td>
                            <td>
                              <Button
                                key="d"
                                icon={<FaTrashAlt />}
                                color="danger"
                                onClick={() => {}}
                              />
                            </td>
                          </tr>
                        );
                      }
                    })}
                  </tbody>
                </table>
                <ActantSuggester
                  onSelected={(newSelectedId: string) => {
                    addActant(newSelectedId);
                  }}
                  categoryIds={classEntities}
                ></ActantSuggester>
              </div>
            </StyledEditorSection>

            {/* Props */}
            <StyledEditorSection key="editor-section-props">
              <StyledEditorSectionHeader>
                Properties (has)
              </StyledEditorSectionHeader>
              <div
                className="editor-section-content"
                key={JSON.stringify(statement.data)}
              >
                {propsByOrigins.map((propOrigin, sai) => {
                  const originActant = propOrigin.actant;
                  //console.log(propOrigin, originActant);

                  if (originActant) {
                    const renderPropRow = (
                      prop: IProp,
                      level: "1" | "2",
                      lastSecondLevel: boolean
                    ) => {
                      const propTypeActant = statement.actants.find(
                        (a) => a.id === prop.type.id
                      );
                      const propValueActant = statement.actants.find(
                        (a) => a.id === prop.value.id
                      );

                      return (
                        <>
                          <StyledPropLineColumn
                            padded={level === "2"}
                            lastSecondLevel={lastSecondLevel}
                          >
                            {propTypeActant ? (
                              <>
                                <ActantTag
                                  key={sai}
                                  actant={propTypeActant}
                                  short={false}
                                  button={
                                    <Button
                                      key="d"
                                      icon={<FaTrashAlt />}
                                      color="danger"
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
                              </>
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
                                categoryIds={classEntities}
                              ></ActantSuggester>
                            )}
                          </StyledPropLineColumn>
                          <StyledPropLineColumn
                            padded={level === "2"}
                            lastSecondLevel={lastSecondLevel}
                          >
                            {propValueActant ? (
                              <>
                                <ActantTag
                                  key={sai}
                                  actant={propValueActant}
                                  short={false}
                                  button={
                                    <Button
                                      key="d"
                                      icon={<FaTrashAlt />}
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
                              </>
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
                                categoryIds={classEntities}
                              ></ActantSuggester>
                            )}
                          </StyledPropLineColumn>
                          <StyledPropLineColumn
                            lastSecondLevel={lastSecondLevel}
                          >
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
                          <StyledPropLineColumn
                            lastSecondLevel={lastSecondLevel}
                          >
                            <StyledPropButtonGroup leftMargin={false}>
                              {level === "1" && (
                                <Button
                                  key="add"
                                  icon={<FaPlusCircle />}
                                  color="primary"
                                  onClick={() => {
                                    addProp(prop.id);
                                  }}
                                />
                              )}
                              <Button
                                key="delete"
                                icon={<FaTrashAlt />}
                                color="danger"
                                onClick={() => {
                                  removeProp(prop.id);
                                }}
                              />
                            </StyledPropButtonGroup>
                          </StyledPropLineColumn>
                        </>
                      );
                    };

                    return (
                      <StyledPropsActantWrapper key={originActant.id}>
                        <StyledPropsActantHeader>
                          <ActantTag
                            key={sai}
                            actant={originActant}
                            short={false}
                          />
                          <StyledPropButtonGroup>
                            <Button
                              key="d"
                              icon={<FaPlusCircle />}
                              color="primary"
                              onClick={() => {
                                addProp(originActant.id);
                              }}
                            />
                          </StyledPropButtonGroup>
                        </StyledPropsActantHeader>
                        {propOrigin.props.length > 0 ? (
                          <StyledPropsActantList>
                            <StyledPropsActantListHeaderColumn>
                              Type
                            </StyledPropsActantListHeaderColumn>
                            <StyledPropsActantListHeaderColumn>
                              Value
                            </StyledPropsActantListHeaderColumn>
                            <StyledPropsActantListHeaderColumn>
                              Attributes
                            </StyledPropsActantListHeaderColumn>
                            <StyledPropsActantListHeaderColumn>
                              Actions
                            </StyledPropsActantListHeaderColumn>
                            {propOrigin.props.map((prop1, pi1) => {
                              return (
                                <>
                                  {renderPropRow(prop1, "1", false)}
                                  {prop1.props.map(
                                    (prop2: any, pi2: number) => {
                                      return renderPropRow(
                                        prop2,
                                        "2",
                                        pi2 === prop1.props.length - 1
                                      );
                                    }
                                  )}
                                </>
                              );
                            })}
                          </StyledPropsActantList>
                        ) : null}
                      </StyledPropsActantWrapper>
                    );
                  }
                })}
              </div>
            </StyledEditorSection>

            {/* Refs */}
            <StyledEditorSection key="editor-section-refs">
              <StyledEditorSectionHeader>References</StyledEditorSectionHeader>
              <div className="editor-section-content"></div>
            </StyledEditorSection>

            {/* Tags */}
            <StyledEditorSection key="editor-section-tags">
              <StyledEditorSectionHeader>Tags</StyledEditorSectionHeader>
              <div className="editor-section-content"></div>
            </StyledEditorSection>

            {/* Notes */}
            <StyledEditorSection key="editor-section-notes">
              <StyledEditorSectionHeader>Notes</StyledEditorSectionHeader>
              <div className="editor-section-content"></div>
            </StyledEditorSection>
          </div>
        </div>
      ) : (
        "no statement selected"
      )}
    </div>
  );
};

interface StyledPropsActantWrapper {}
export const StyledPropsActantWrapper = styled.div<StyledPropsActantWrapper>``;

interface StyledPropsActantHeader {}
export const StyledPropsActantHeader = styled.div<StyledPropsActantHeader>`
  display: inline-flex;
  padding-top: ${({ theme }) => theme.space[1]};
  padding-bottom: ${({ theme }) => theme.space[6]};
`;

interface StyledPropsActantList {}
export const StyledPropsActantList = styled.div<StyledPropsActantList>`
  display: grid;
  padding-left: ${({ theme }) => theme.space[8]};
  grid-template-columns: 15em 15em 9em 6em;
  grid-template-rows: auto;
  grid-auto-flow: row;
  padding-bottom: ${({ theme }) => theme.space[6]};
`;

interface StyledPropButtonGroup {
  leftMargin?: boolean;
}
export const StyledPropButtonGroup = styled.div<StyledPropButtonGroup>`
  margin-left: ${({ theme, leftMargin = true }) =>
    leftMargin ? theme.space[3] : theme.space[0]};
  display: inline-flex;
`;

interface StyledPropLineColumn {
  padded?: boolean;
  lastSecondLevel?: boolean;
}
export const StyledPropLineColumn = styled.div<StyledPropLineColumn>`
  display: inline-flex;
  padding-bottom: ${({ theme, lastSecondLevel }) =>
    lastSecondLevel ? theme.space[4] : theme.space[1]};
  align-items: center;
  padding-left: ${({ theme, padded }) =>
    padded ? theme.space[6] : theme.space[0]};
`;

interface StyledEditorSection {
  firstSection?: boolean;
}
export const StyledEditorSection = styled.div<StyledEditorSection>`
  padding-top: ${({ theme, firstSection = false }) =>
    firstSection ? 0 : theme.space[4]};
  padding-bottom: ${({ theme }) => theme.space[6]};
  border-bottom-width: ${({ theme }) => theme.borderWidths[2]};
  border-bottom-color: ${({ theme }) => theme.colors.black};
  border-bottom-style: solid;
`;

interface StyledEditorSectionHeader {}
export const StyledEditorSectionHeader = styled.div<StyledEditorSectionHeader>`
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ theme }) => theme.fontSizes.xl};
`;

interface StyledPropsActantListHeaderColumn {}
export const StyledPropsActantListHeaderColumn = styled.div<StyledPropsActantListHeaderColumn>`
  font-weight: ${({ theme }) => theme.fontWeights.light};
  margin-left: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSizes["sm"]};
  font-style: italic;
`;
