import { FaTrashAlt, FaPlus } from "react-icons/fa";
import React, { useEffect, useState } from "react";

import { toast } from "react-toastify";

import { Entities } from "types";
import {
  ActantSuggester,
  DropItemI,
} from "pages/MainPage/components/ActantSuggester/ActantSuggester";
import {
  Tag,
  Button,
  Input,
  Suggester,
  DropDown,
  Toast,
  Submit,
} from "components";
import { StatementI, ResponseMetaI, ActantI } from "@shared/types";
import { SuggestionI } from "components/Suggester/Suggester";
import { OptionTypeBase, ValueType } from "react-select";
import "./editor.css";

import { getActant } from "api/getActant";
import { createActant } from "api/createActant";

import { v4 as uuidv4 } from "uuid";

interface StatementEditor {
  activeStatement: StatementI;
  activeTerritoryActants: ActantI[];
  meta: ResponseMetaI;

  actantDeleteFn: (id: string) => Promise<boolean>;
  actantCreateFn: (actant: ActantI) => Promise<boolean>;
  actantUpdateFn: (actant: ActantI) => Promise<boolean>;
}

const EntitiesActant = [
  "P",
  "R",
  "G",
  "O",
  "C",
  "L",
  "V",
  "E",
  "S",
  "T",
] as const;

const EntitiesPropType = ["C"] as const;

const EntitiesPropValue = [
  "T",
  "S",
  "R",
  "P",
  "G",
  "O",
  "C",
  "L",
  "V",
  "E",
] as const;

const EntitiesResource = ["R"] as const;

const EntitiesTags = [
  "P",
  "T",
  "R",
  "G",
  "O",
  "C",
  "L",
  "V",
  "E",
  "S",
] as const;

/**
 * Setting the statement
 */

export const StatementEditor: React.FC<StatementEditor> = ({
  activeStatement,
  activeTerritoryActants,
  meta,

  actantDeleteFn,
  actantCreateFn,
  actantUpdateFn,
}) => {
  const [selectedAction, setSelectedAction] = useState<
    ValueType<OptionTypeBase>
  >();

  // todo: check whether we really need to create copies of props
  const activeStatementCopy: StatementI = JSON.parse(
    JSON.stringify(activeStatement)
  );
  const activeTerritoryActantsCopy: ActantI[] = JSON.parse(
    JSON.stringify(activeTerritoryActants)
  );

  // statement object that is edited
  const [statement, setStatement] = useState(activeStatementCopy);

  // the list of all actants potentially needed to draw the editor component; may get updated when a new actant / prop is added
  const [actants, setActants] = useState(activeTerritoryActantsCopy);

  // modal
  const [deleteSubmitOpen, setDeleteSubmitOpen] = useState(false);
  const [deleteActantId, setDeleteActantId] = useState("");

  const openDeleteSubmit = (actantId: string) => {
    setDeleteActantId(actantId);
    setDeleteSubmitOpen(true);
  };
  const closeDeleteSubmit = () => {
    setDeleteSubmitOpen(false);
  };

  // check whether the actant is in the list of actants or it should be added
  const checkActant = async (actantId: string) => {
    if (actants.find((a) => a.id === actantId)) {
      return true;
    } else {
      const newActant = await getActant(actantId);
      const newActants = [...actants];
      newActants.push(newActant);
      setActants(newActants);
    }
  };

  const actionTypes = meta.actions.map((a) => ({
    value: a.id,
    label: a.labels[0].label,
  }));

  useEffect(() => {
    if (statement?.data.action) {
      const actionObject = meta.actions.find(
        (action) => action.id === statement.data.action
      );
      setSelectedAction({
        value: actionObject?.id,
        label: actionObject?.labels[0].label,
      });
    }
  }, [statement?.data.action]);

  useEffect(() => {
    if (statement !== activeStatement) {
      setStatement(activeStatementCopy);
    }
  }, [activeStatement]);

  const changeDataValue = (
    newValue: string,
    propName:
      | "label"
      | "action"
      | "territory"
      | "certainty"
      | "elvl"
      | "modality"
      | "text"
      | "note"
  ) => {
    const newStatement = { ...statement };
    newStatement.data[propName] = newValue;
    setStatement(newStatement);
  };

  const updateStatementActant = (
    statementActantId: string,
    propName: "position" | "certainty" | "elvl",
    newValue: string
  ) => {
    const newStatement = { ...statement };
    const actantToChange = newStatement.data.actants.find(
      (a) => a.id === statementActantId
    );
    if (actantToChange) {
      actantToChange[propName] = newValue;
      setStatement(newStatement);
    }
  };

  const addNewStatementActant = (actantId: string) => {
    const newStatement = { ...statement };

    newStatement.data.actants.push({
      id: uuidv4(),
      actant: actantId,
      position: "s",
      elvl: "1",
      certainty: "1",
    });
    checkActant(actantId);
    setStatement(newStatement);
  };

  const createNewActant = async (
    entity: typeof EntitiesActant[number],
    label: string
  ): Promise<false | string> => {
    const newActant: ActantI = {
      id: uuidv4(),
      class: entity,
      data: {
        label: label,
      },
      meta: {},
    };
    const createResponse = await createActant(newActant);
    toast.dark("Actant created!");
    return createResponse && createResponse.id ? createResponse.id : false;
  };

  const removeStatementActant = (actantId: string) => {
    const newStatement = { ...statement };
    newStatement.data.actants = newStatement.data.actants.filter(
      (a) => a.id !== actantId
    );
    setStatement(newStatement);
  };

  const addNewProp = (statementActantId: string) => {
    const newStatement = { ...statement };
    newStatement.data.props.push({
      id: uuidv4(),
      origin: statementActantId,
      type: "",
      value: "",
      elvl: "1",
      certainty: "1",
    });
    setStatement(newStatement);
  };

  const removeProp = (propId: string) => {
    const newStatement = { ...statement };
    newStatement.data.props = newStatement.data.props.filter(
      (p) => p.id !== propId
    );
    setStatement(newStatement);
  };

  const updateActantProp = (
    propId: string,
    propName: "certainty" | "elvl" | "type" | "value",
    newValue: string
  ) => {
    const newStatement = { ...statement };
    const propToChange = newStatement.data.props.find((a) => a.id === propId);
    if (propToChange) {
      propToChange[propName] = newValue;
      setStatement(newStatement);
    }
  };

  const addNewReference = (resourceId: string) => {
    const newStatement = { ...statement };
    newStatement.data.references.push({
      id: uuidv4(),
      resource: resourceId,
      part: "",
      type: "P",
    });
    setStatement(newStatement);
  };

  const updateStatementReference = (
    referenceId: string,
    propName: "part" | "type",
    newValue: string
  ) => {
    const newStatement = { ...statement };
    const referenceToChange = newStatement.data.references.find(
      (a) => a.id === referenceId
    );
    if (referenceToChange) {
      referenceToChange[propName] = newValue;
      setStatement(newStatement);
    }
  };

  const removeStatementReference = (resourceId: string) => {
    const newStatement = { ...statement };
    newStatement.data.references = newStatement.data.references.filter(
      (r) => r.resource !== resourceId
    );
    setStatement(newStatement);
  };

  const addNewTag = (actantId: string) => {
    const newStatement = { ...statement };
    if (!newStatement.data.tags.find((t) => t == actantId)) {
      newStatement.data.tags.push(actantId);
    }
    setStatement(newStatement);
  };

  const removeTag = (actantId: string) => {
    const newStatement = { ...statement };
    newStatement.data.tags = newStatement.data.tags.filter(
      (t) => t !== actantId
    );
    setStatement(newStatement);
  };

  const renderActantProps = (actant: ActantI | undefined, originId: string) => {
    if (actant) {
      const actantProps = statement.data.props.filter(
        (p) => p.origin === originId
      );
      return (
        <div className="property-part" key={originId}>
          <Tag
            propId={actant.id}
            category={Entities[actant.class].id}
            color={Entities[actant.class].color}
            label={actant.data.label}
          />

          <div className="add-new-property-button">
            <Button
              icon={<FaPlus />}
              color="primary"
              onClick={() => {
                addNewProp(originId);
              }}
            />
          </div>

          {actantProps.length ? (
            <table className="property-table">
              <thead>
                <tr>
                  <th key="type">Type</th>
                  <th key="value">Value</th>
                  <th key="certainty">Certainty</th>
                  <th key="elvl">Elvl</th>
                  <th key="actions"></th>
                </tr>
              </thead>
              <tbody>
                {actantProps.map((actantProp, ap) => {
                  const typeId = actantProp.type;
                  const valueId = actantProp.value;

                  const type = typeId
                    ? actants.find((a) => a.id === typeId)
                    : false;
                  const value = valueId
                    ? actants.find((a) => a.id === valueId)
                    : false;

                  return (
                    <tr key={ap} className="property-row">
                      <td key="type">
                        {type ? (
                          <Tag
                            propId={type.id}
                            category={Entities[type.class].id}
                            color={Entities[type.class].color}
                            label={type.data.label}
                          />
                        ) : (
                          <ActantSuggester
                            entityIds={EntitiesPropType}
                            onDrop={(item: {
                              id: string;
                              type: string;
                              category: string;
                            }) => {
                              if (item.category === "C") {
                                updateActantProp(
                                  actantProp.id,
                                  "type",
                                  item.id
                                );
                              }
                            }}
                            onPick={async (suggestion: SuggestionI) => {
                              await checkActant(suggestion.id);
                              updateActantProp(
                                actantProp.id,
                                "type",
                                suggestion.id
                              );
                            }}
                            onCreate={async (
                              entity: typeof EntitiesActant[number],
                              label: string
                            ) => {
                              const actantId = await createNewActant(
                                entity,
                                label
                              );

                              if (actantId !== false) {
                                await checkActant(actantId);
                                updateActantProp(
                                  actantProp.id,
                                  "type",
                                  actantId
                                );
                              }
                            }}
                          />
                        )}
                      </td>
                      <td key="value">
                        {value ? (
                          <Tag
                            propId={value.id}
                            category={Entities[value.class].id}
                            color={Entities[value.class].color}
                            label={value.data.label}
                          />
                        ) : (
                          <ActantSuggester
                            entityIds={EntitiesPropValue}
                            onPick={async (suggestion: SuggestionI) => {
                              await checkActant(suggestion.id);
                              updateActantProp(
                                actantProp.id,
                                "value",
                                suggestion.id
                              );
                            }}
                            onCreate={async (
                              entity: typeof EntitiesActant[number],
                              label: string
                            ) => {
                              const actantId = await createNewActant(
                                entity,
                                label
                              );

                              if (actantId !== false) {
                                await checkActant(actantId);
                                updateActantProp(
                                  actantProp.id,
                                  "value",
                                  actantId
                                );
                              }
                            }}
                            onDrop={(item: {
                              id: string;
                              type: string;
                              category: string;
                            }) => {
                              updateActantProp(actantProp.id, "value", item.id);
                            }}
                          />
                        )}
                      </td>
                      <td key="certainty">
                        <Input
                          type="select"
                          onChangeFn={(newValue: string) => {
                            updateActantProp(
                              actantProp.id,
                              "certainty",
                              newValue
                            );
                          }}
                          options={meta.dictionaries.certainties}
                          value={actantProp.certainty}
                        />
                      </td>
                      <td key="elvl">
                        <Input
                          type="select"
                          onChangeFn={(newValue: string) => {
                            updateActantProp(actantProp.id, "elvl", newValue);
                          }}
                          options={meta.dictionaries.elvls}
                          value={actantProp.elvl}
                        />
                      </td>
                      <td key="actions">
                        <Button
                          icon={<FaTrashAlt />}
                          color="danger"
                          onClick={() => {
                            removeProp(actantProp.id);
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}
        </div>
      );
    } else {
      return <div />;
    }
  };
  return (
    <div className="statement-editor">
      {statement && (
        <>
          <div style={{ marginBottom: "4rem" }}>
            <div key={statement.id}>
              <div className="section section-introduction">
                <h2 className="section-heading-first">Summary</h2>
                <div className="table">
                  <div className="table-row leading-3">
                    <div className="label">Action</div>
                    <div className="value">
                      <DropDown
                        value={selectedAction}
                        onChange={(selectedAction: ValueType<OptionTypeBase>) =>
                          setSelectedAction(selectedAction)
                        }
                        options={actionTypes}
                      />
                    </div>
                  </div>
                  <div className="table-row">
                    <div className="label">Modality</div>
                    <div className="value">
                      <Input
                        type="select"
                        onChangeFn={(newValue: string) =>
                          changeDataValue(newValue, "modality")
                        }
                        options={meta.dictionaries.modalities}
                        value={statement.data.modality}
                      />
                    </div>
                  </div>
                  <div className="table-row">
                    <div className="label">Elvl</div>
                    <div className="value">
                      <Input
                        type="select"
                        onChangeFn={(newValue: string) =>
                          changeDataValue(newValue, "elvl")
                        }
                        options={meta.dictionaries.elvls}
                        value={statement.data.elvl}
                      />
                    </div>
                  </div>
                  <div className="table-row">
                    <div className="label">Certainty</div>
                    <div className="value">
                      <Input
                        type="select"
                        onChangeFn={(newValue: string) =>
                          changeDataValue(newValue, "certainty")
                        }
                        options={meta.dictionaries.certainties}
                        value={statement.data.certainty}
                      />
                    </div>
                  </div>
                  <div className="table-row">
                    <div className="label">Statement Text</div>
                    <div className="value">
                      <Input
                        type="textarea"
                        cols={55}
                        onChangeFn={(newValue: string) =>
                          changeDataValue(newValue, "text")
                        }
                        value={statement.data.text}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div key="actants" className="section section-actants">
              <h2 className="section-heading">Actants</h2>
              <table className="">
                <thead>
                  <tr>
                    <th key="actants">Actants</th>
                    <th key="position">Position</th>
                    <th key="certainty">Certainty</th>
                    <th key="elvl">Elvl</th>
                    <th key="actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {statement.data.actants
                    .sort(function (a, b) {
                      const positionRanks = (position: string) => {
                        if (position === "s") {
                          return 1;
                        } else if (position === "a1") {
                          return 2;
                        } else if (position === "a2") {
                          return 3;
                        } else if (position === "a3") {
                          return 4;
                        } else if (position === "p") {
                          return 5;
                        } else {
                          return 6;
                        }
                      };

                      return positionRanks(a.position) >
                        positionRanks(b.position)
                        ? 1
                        : -1;
                    })
                    .map((statementActant, sai) => {
                      const actant = actants.find(
                        (a) => a.id === statementActant.actant
                      );
                      return actant &&
                        actant.class &&
                        Entities[actant.class] ? (
                        <tr key={statementActant.id}>
                          <td key="actants">
                            <Tag
                              key={"1"}
                              propId={actant.id}
                              category={Entities[actant.class].id}
                              color={Entities[actant.class].color}
                              label={actant.data.label}
                            />
                          </td>
                          <td key="position">
                            <Input
                              type="select"
                              onChangeFn={(newValue: string) =>
                                updateStatementActant(
                                  statementActant.id,
                                  "position",
                                  newValue
                                )
                              }
                              options={meta.dictionaries.positions}
                              value={statementActant.position}
                            />
                          </td>
                          <td key="certainty">
                            <Input
                              type="select"
                              onChangeFn={(newValue: string) =>
                                updateStatementActant(
                                  statementActant.id,
                                  "certainty",
                                  newValue
                                )
                              }
                              options={meta.dictionaries.certainties}
                              value={statementActant.certainty}
                            />
                          </td>
                          <td key="elvl">
                            <Input
                              type="select"
                              onChangeFn={(newValue: string) =>
                                updateStatementActant(
                                  statementActant.id,
                                  "elvl",
                                  newValue
                                )
                              }
                              options={meta.dictionaries.elvls}
                              value={statementActant.elvl}
                            />
                          </td>
                          <td key="actions">
                            <Button
                              key="d"
                              icon={<FaTrashAlt />}
                              color="danger"
                              onClick={() => {
                                removeStatementActant(statementActant.id);
                              }}
                            />
                          </td>
                        </tr>
                      ) : (
                        <tr key={sai} />
                      );
                    })}
                </tbody>
              </table>
              <div className="mt-1" key="actants-suggester">
                <ActantSuggester
                  entityIds={EntitiesActant}
                  onPick={(suggestion: SuggestionI) => {
                    addNewStatementActant(suggestion.id);
                  }}
                  onDrop={(item: DropItemI) => {
                    addNewStatementActant(item.id);
                  }}
                  onCreate={async (
                    entity: typeof EntitiesActant[number],
                    label: string
                  ) => {
                    const actantId = await createNewActant(entity, label);
                    if (actantId !== false) {
                      await checkActant(actantId);
                      addNewStatementActant(actantId);
                    }
                  }}
                />
              </div>
            </div>

            {
              // properties
              // TODO: more systematic way of mapping props
            }
            <div key="properties" className="section section-properties">
              <h2 className="section-heading">Properties (has)</h2>
              {renderActantProps(statement, statement.id)}
              {statement.data.actants.map((statementActant, ai) => {
                const originActant = actants.find(
                  (a) => a.id === statementActant.actant
                );
                return renderActantProps(originActant, statementActant.id);
              })}
            </div>
            {
              // references
            }
            <div className="section section-references" key="references">
              <h2 className="section-heading">References</h2>
              {statement.data.references.length ? (
                <table className="references-table">
                  <thead>
                    <tr>
                      <th key="value">Reference</th>
                      <th key="part">Part</th>
                      <th key="type">Type</th>
                      <th key="actions"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {statement.data.references.map((reference) => {
                      const resource = actants.find(
                        (a) => a.id === reference.resource
                      );
                      return resource ? (
                        <tr key={reference.id}>
                          <td>
                            <Tag
                              propId={reference.resource}
                              category={Entities["R"].id}
                              color={Entities["R"].color}
                              label={resource.data.label}
                            />
                          </td>
                          <td>
                            <Input
                              type="text"
                              onChangeFn={(newValue: string) => {
                                updateStatementReference(
                                  reference.id,
                                  "part",
                                  newValue
                                );
                              }}
                              value={reference.part}
                            />
                          </td>
                          <td>
                            <Input
                              type="select"
                              onChangeFn={(newValue: string) => {
                                updateStatementReference(
                                  reference.id,
                                  "type",
                                  newValue
                                );
                              }}
                              options={meta.dictionaries.referencetypes}
                              value={reference.type}
                            />
                          </td>

                          <td>
                            <Button
                              icon={<FaTrashAlt />}
                              color="danger"
                              onClick={() => {
                                removeStatementReference(resource.id);
                              }}
                            />
                          </td>
                        </tr>
                      ) : null;
                    })}
                  </tbody>
                </table>
              ) : null}
              <div className="">
                <ActantSuggester
                  entityIds={EntitiesResource}
                  onPick={async (suggestion: SuggestionI) => {
                    await checkActant(suggestion.id);
                    addNewReference(suggestion.id);
                  }}
                  onDrop={(item: DropItemI) => {
                    if (item.category === "R") {
                      addNewReference(item.id);
                    }
                  }}
                  onCreate={async (
                    entity: typeof EntitiesResource[number],
                    label: string
                  ) => {
                    const actantId = await createNewActant(entity, label);
                    if (actantId !== false) {
                      await checkActant(actantId);
                      addNewReference(actantId);
                    }
                  }}
                />
              </div>
            </div>
            {
              // tags
            }
            <div className="section section-tags" key="tags">
              <h2 className="section-heading">Tags</h2>
              <div className="tags">
                {statement.data.tags.map((tagId) => {
                  const tagActant = actants.find((a) => a.id === tagId);

                  return tagActant ? (
                    <div className="tag" key={tagId}>
                      <Tag
                        propId={tagId}
                        category={Entities[tagActant.class].id}
                        color={Entities[tagActant.class].color}
                        label={tagActant.data.label}
                        button={
                          <Button
                            icon={<FaTrashAlt />}
                            color="danger"
                            onClick={() => {
                              removeTag(tagId);
                            }}
                          />
                        }
                      />
                    </div>
                  ) : null;
                })}
              </div>
              <div className="">
                <ActantSuggester
                  entityIds={EntitiesTags}
                  onDrop={(item: {
                    id: string;
                    type: string;
                    category: string;
                  }) => {
                    addNewTag(item.id);
                  }}
                  onPick={async (suggestion: SuggestionI) => {
                    await checkActant(suggestion.id);
                    addNewTag(suggestion.id);
                  }}
                  onCreate={async (
                    entity: typeof EntitiesTags[number],
                    label: string
                  ) => {
                    const actantId = await createNewActant(entity, label);
                    if (actantId !== false) {
                      await checkActant(actantId);
                      addNewTag(actantId);
                    }
                  }}
                />
              </div>
            </div>
            {
              // note
            }
            <div className="section section-notes">
              <h2 className="section-heading">Notes</h2>

              <Input
                type="textarea"
                label="Note"
                onChangeFn={(newValue: string) =>
                  changeDataValue(newValue, "note")
                }
                value={statement.data.note}
              />
            </div>
          </div>

          {/* -------- Footer action buttons -------- */}

          <div className="editor-footer section section-actions absolute pt-1 pl-1 flex justify-end bg-primary">
            <div className="action-buttons">
              <div className="action-button">
                <Button
                  label="Save"
                  color="success"
                  onClick={() => {
                    actantUpdateFn(statement);
                  }}
                  marginRight
                />
              </div>
              <div className="action-button">
                <Button
                  label="Delete"
                  color="danger"
                  onClick={() => {
                    openDeleteSubmit(activeStatementCopy.id);
                    //actantDeleteFn(activeStatementCopy.id);
                  }}
                  marginRight
                />
              </div>
              <div className="action-button">
                <Button
                  label="Cancel Changes"
                  color="warning"
                  onClick={() => {
                    toast.dark("Changes cancelled!");
                    setStatement(activeStatementCopy);
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
      <Toast />
      <Submit
        title={"Delete actant"}
        text={`Do you really want to delete actant with ID [${deleteActantId}]?`}
        show={deleteSubmitOpen}
        onCancel={() => closeDeleteSubmit()}
        onSubmit={() => {
          actantDeleteFn(deleteActantId);
        }}
      />
    </div>
  );
};
