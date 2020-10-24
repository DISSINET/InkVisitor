import React from "react";
import { FaTrashAlt } from "react-icons/fa";

import { Entities } from "types";
import { Tag, Button, Input, Suggester } from "components";
import { StatementI, ResponseMetaI, ActantI } from "@shared/types";
import { SuggestionI } from "components/Suggester/Suggester";

import { updateActant } from "api/updateActant";
import { deleteActant } from "api/deleteActant";
import { createActant } from "api/createActant";

interface StatementEditor {
  activeStatement: StatementI;
  meta: ResponseMetaI;
  actants: ActantI[];
  setActiveStatementId: (id: string) => void;
  fetchTerritory: (id: string) => void;
}

const suggester = () => {
  return (
    <Suggester
      suggestions={[]}
      typed={""}
      category={Entities["P"].id}
      categories={Object.keys(Entities).map((ek) => ({
        value: Entities[ek].id,
        label: Entities[ek].id,
      }))}
      onType={(newTyped: string) => console.log("newTyped", newTyped)}
      onChangeCategory={(newEntityTypeId: keyof typeof Entities) => {
        console.log("newEntityType", newEntityTypeId);
      }}
      onCreate={(suggestion: SuggestionI) => {
        console.log("suggestion " + suggestion.id + " picked");
      }}
      onPick={(created: SuggestionI) => {
        console.log("on picked");
      }}
    />
  );
};

/**
 * Setting the statement
 */

export const StatementEditor: React.FC<StatementEditor> = ({
  activeStatement,
  meta,
  actants,
  setActiveStatementId,
  fetchTerritory,
}) => {
  const actionTypes = meta.actions.map((a) => ({
    value: a.id,
    label: a.labels[0].label,
  }));

  const activeStatementCopy: StatementI = JSON.parse(
    JSON.stringify(activeStatement)
  );

  const [statement, setStatement] = React.useState(activeStatementCopy);

  React.useEffect(() => {
    if (statement !== activeStatement) {
      setStatement(activeStatementCopy);
    }
    console.log("statement hook");
  }, [activeStatement]);

  const changeActionType = (newActionType: string) => {
    const newStatement = { ...statement };
    newStatement.data.action = newActionType;
    console.log("statement updated", newStatement);
    setStatement(newStatement);
  };

  console.log("activeStatement", activeStatement.data.action);
  console.log("statement", statement.data.action);

  return (
    <div className="statement-editor">
      {statement ? (
        <div key={statement.id}>
          <div className="section section-introduction">
            <div className="section-introduction-content">
              <div className="table">
                <div className="table-row leading-3">
                  <div className="label">Action</div>
                  <div className="value">
                    <Input
                      type="select"
                      onChangeFn={changeActionType}
                      options={actionTypes}
                      value={statement.data.action}
                    />
                  </div>
                </div>
                <div className="table-row">
                  <div className="label">Modality</div>
                  <div className="value">
                    <Input
                      type="select"
                      onChangeFn={() => {}}
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
                      onChangeFn={() => {}}
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
                      onChangeFn={() => {}}
                      options={meta.dictionaries.certainties}
                      value={statement.data.certainty}
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="">Statement Text</div>
                <Input
                  type="textarea"
                  cols={55}
                  onChangeFn={() => {}}
                  value={statement.data.text}
                />
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
                {statement.data.actants.map((statementActant, sai) => {
                  const actant = actants.find(
                    (a) => a.id === statementActant.actant
                  );
                  return actant && actant.class && Entities[actant.class] ? (
                    <tr key={sai}>
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
                          onChangeFn={() => {}}
                          options={meta.dictionaries.positions}
                          value={statementActant.position}
                        />
                      </td>
                      <td key="certainty">
                        <Input
                          type="select"
                          onChangeFn={() => {}}
                          options={meta.dictionaries.certainties}
                          value={statementActant.certainty}
                        />
                      </td>
                      <td key="elvl">
                        <Input
                          type="select"
                          onChangeFn={() => {}}
                          options={meta.dictionaries.elvls}
                          value={statementActant.elvl}
                        />
                      </td>
                      <td key="actions">
                        <Button key="d" icon={<FaTrashAlt />} color="danger" />
                      </td>
                    </tr>
                  ) : (
                    <tr key={sai} />
                  );
                })}
              </tbody>
            </table>
            <div className="mt-1">{suggester()}</div>
          </div>

          {
            // properties
          }
          <div key="properties" className="section section-properties">
            <h2 className="section-heading">Properties (has)</h2>
            {statement.data.actants.map((statementActant, sai) => {
              const actant = actants.find(
                (a) => a.id === statementActant.actant
              );

              const actantProps = statement.data.props.filter(
                (p) => p.subject === statementActant.actant
              );

              return actant ? (
                <div key={sai} className="property-part">
                  <Tag
                    key={"1"}
                    propId={actant.id}
                    category={Entities[actant.class].id}
                    color={Entities[actant.class].color}
                    label={actant.data.label}
                  />

                  {actantProps.length ? (
                    <table className="property-table">
                      <thead>
                        <tr>
                          <th key="type">Type</th>
                          <th key="value">Value</th>
                          <th key="certainty">Certa inty</th>
                          <th key="elvl">Elvl</th>
                          <th key="actions">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {actantProps.map((actantProp, ap) => {
                          const typeId = actantProp.actant1;
                          const valueId = actantProp.actant2;

                          const type = actants.find((a) => a.id === typeId);
                          const value = actants.find((a) => a.id === valueId);

                          return type && value ? (
                            <tr key={ap} className="property-row">
                              <td key="type">
                                <Tag
                                  propId={actant.id}
                                  category={Entities[type.class].id}
                                  color={Entities[type.class].color}
                                  label={actant.data.label}
                                />
                              </td>
                              <td key="value">
                                <Tag
                                  propId={actant.id}
                                  category={Entities[value.class].id}
                                  color={Entities[value.class].color}
                                  label={actant.data.label}
                                />
                              </td>
                              <td key="certainty">
                                <Input
                                  type="select"
                                  onChangeFn={() => {}}
                                  options={meta.dictionaries.certainties}
                                  value={statementActant.certainty}
                                />
                              </td>
                              <td key="elvl">
                                <Input
                                  type="select"
                                  onChangeFn={() => {}}
                                  options={meta.dictionaries.elvls}
                                  value={statementActant.elvl}
                                />
                              </td>
                              <td key="actions">
                                <Button
                                  key="d"
                                  icon={<FaTrashAlt />}
                                  color="danger"
                                />
                              </td>
                            </tr>
                          ) : (
                            <tr />
                          );
                        })}
                      </tbody>
                    </table>
                  ) : null}
                  <div className="">{suggester()}</div>
                </div>
              ) : (
                <div />
              );
            })}
          </div>
          {
            // references
          }
          <div className="section section-references">
            <h2 className="section-heading">References</h2>
            {statement.data.references.length ? (
              <table className="references-table">
                <thead>
                  <tr>
                    <th key="value">Reference</th>
                    <th key="part">Part</th>
                    <th key="type">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.data.references.map((reference) => {
                    const resource = actants.find(
                      (a) => a.id === reference.resource
                    );
                    return resource ? (
                      <tr key={resource.id}>
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
                            onChangeFn={() => {}}
                            value={reference.part}
                          />
                        </td>
                        <td>
                          <Input
                            type="select"
                            onChangeFn={() => {}}
                            options={meta.dictionaries.referencetypes}
                            value={reference.type}
                          />
                        </td>
                      </tr>
                    ) : null;
                  })}
                </tbody>
              </table>
            ) : null}
            <div className="">
              {
                <Suggester
                  suggestions={[]}
                  typed={""}
                  category={Entities["P"].id}
                  categories={[
                    {
                      value: Entities["R"].id,
                      label: Entities["R"].id,
                    },
                  ]}
                  onType={(newTyped: string) =>
                    console.log("newTyped", newTyped)
                  }
                  onChangeCategory={(
                    newEntityTypeId: keyof typeof Entities
                  ) => {
                    console.log("newEntityType", newEntityTypeId);
                  }}
                  onCreate={(suggestion: SuggestionI) => {
                    console.log("suggestion " + suggestion.id + " picked");
                  }}
                  onPick={(created: SuggestionI) => {
                    console.log("on picked");
                  }}
                />
              }
            </div>
          </div>
          {
            // tags
          }
          <div className="section section-tags">
            <h2 className="section-heading">Tags</h2>
            <div className="tags">
              {statement.data.tags.map((tagId) => {
                const tagActant = actants.find((a) => a.id === tagId);

                return tagActant ? (
                  <Tag
                    propId={tagId}
                    category={Entities[tagActant.class].id}
                    color={Entities[tagActant.class].color}
                    label={tagActant.data.label}
                  />
                ) : null;
              })}
            </div>
            <div className="">{suggester()}</div>
          </div>
          {
            // note
          }
          <div className="section section-notes">
            <h2 className="section-heading">Notes</h2>

            <Input
              type="textarea"
              label="Note"
              onChangeFn={() => {}}
              value={statement.data.note}
            />
          </div>
          <div className="section section-actions">
            <h2 className="section-heading">Actions</h2>
            <div className="action-buttons">
              <div className="action-button">
                <Button
                  label="save"
                  color="primary"
                  onClick={() => {
                    updateActant(statement);
                    fetchTerritory(activeStatementCopy.data.territory);
                  }}
                />
              </div>
              <div className="action-button">
                <Button
                  label="delete"
                  color="danger"
                  onClick={() => {
                    deleteActant(activeStatementCopy.id);
                    setActiveStatementId("");
                    fetchTerritory(statement.data.territory);
                  }}
                />
              </div>
              <div className="action-button">
                <Button
                  label="cancel changes"
                  color="warning"
                  onClick={() => {
                    setStatement(activeStatementCopy);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>no statement selected</div>
      )}
    </div>
  );
};
