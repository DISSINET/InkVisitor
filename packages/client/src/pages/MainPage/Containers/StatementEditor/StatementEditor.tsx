import React from "react";

import { Tag, Button, Input } from "components";

import { Entities } from "types";

import { StatementI, ResponseMetaI, ActantI } from "@shared/types";

interface StatementEditor {
  statement: undefined | StatementI;
  meta: ResponseMetaI;
  actants: ActantI[];
}

export const StatementEditor: React.FC<StatementEditor> = ({
  statement,
  meta,
  actants,
}) => {
  return (
    <>
      {statement && (
        <div>
          <Input
            type="select"
            label="action"
            onChangeFn={() => {}}
            options={["action1", "action2", "action3", "action4"]}
          />
          <Input
            type="textarea"
            label="text"
            onChangeFn={() => {}}
            value={statement.data.text}
          />
          {
            // actants
          }
          <div>
            <table>
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
                {statement.data.actants.map((statementActant) => {
                  const actant = actants.find(
                    (a) => a.id === statementActant.actant
                  );
                  return actant ? (
                    <tr>
                      <td key="actants">
                        <Tag
                          key={"1"}
                          category={Entities[actant.class].id}
                          color={Entities[actant.class].color}
                          label={actant.data.label}
                        />
                      </td>
                      <td key="position">
                        <Input
                          type="select"
                          onChangeFn={() => {}}
                          options={["s", "a1", "a2", "a3"]}
                          value={statementActant.position}
                        />
                      </td>
                      <td key="certainty">
                        <Input
                          type="select"
                          onChangeFn={() => {}}
                          options={["1", "2", "3"]}
                          value={statementActant.certainty}
                        />
                      </td>
                      <td key="elvl">
                        <Input
                          type="select"
                          onChangeFn={() => {}}
                          options={["1", "2", "3"]}
                          value={statementActant.elvl}
                        />
                      </td>
                      <td key="actions">
                        <Button key="d" label="r" color="danger" />
                      </td>
                    </tr>
                  ) : (
                    <tr />
                  );
                })}
              </tbody>
            </table>
          </div>

          {
            // properties
          }
          <h2>Properties (has)</h2>
          <div>
            {statement.data.actants.map((statementActant) => {
              const actant = actants.find(
                (a) => a.id === statementActant.actant
              );
              return actant ? (
                <div>
                  <Tag
                    key={"1"}
                    category={Entities[actant.class].id}
                    color={Entities[actant.class].color}
                    label={actant.data.label}
                  />
                  <table>
                    <thead>
                      <tr>
                        <th key="type">Type</th>
                        <th key="value">Value</th>
                        <th key="certainty">Certainty</th>
                        <th key="elvl">Elvl</th>
                        <th key="actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statement.data.props
                        .filter((p) => p.subject === statementActant.actant)
                        .map((actantProp) => {
                          const typeId = actantProp.actant1;
                          const valueId = actantProp.actant2;

                          const type = actants.find((a) => a.id === typeId);
                          const value = actants.find((a) => a.id === valueId);

                          console.log(actantProp);
                          return type && value ? (
                            <tr>
                              <td key="type">
                                <Tag
                                  category={Entities[type.class].id}
                                  color={Entities[type.class].color}
                                  label={actant.data.label}
                                />
                              </td>
                              <td key="value">
                                <Tag
                                  category={Entities[value.class].id}
                                  color={Entities[value.class].color}
                                  label={actant.data.label}
                                />
                              </td>
                              <td key="certainty">
                                <Input
                                  type="select"
                                  onChangeFn={() => {}}
                                  options={["1", "2", "3"]}
                                  value={statementActant.certainty}
                                />
                              </td>
                              <td key="elvl">
                                <Input
                                  type="select"
                                  onChangeFn={() => {}}
                                  options={["1", "2", "3"]}
                                  value={statementActant.elvl}
                                />
                              </td>
                              <td key="actions">
                                <Button key="d" label="r" color="danger" />
                              </td>
                            </tr>
                          ) : (
                            <tr />
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div />
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
