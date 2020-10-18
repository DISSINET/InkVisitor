import React, { useMemo } from "react";

import { Entities } from "types";
import { Tag, Button, Input, Suggester } from "components";
import { StatementI, ResponseMetaI, ActantI } from "@shared/types";
import { SuggestionI } from "components/Suggester/Suggester";

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
  const actionTypes = meta.actions.map((a) => ({
    value: a.id,
    label: a.labels[0].label,
  }));

  console.log(statement);

  return (
    <>
      {statement ? (
        <div key={statement.id}>
          <Input
            type="select"
            label="action"
            onChangeFn={() => {}}
            options={actionTypes}
            value={statement.data.action}
          />
          <Input
            type="select"
            label="modality"
            onChangeFn={() => {}}
            options={meta.dictionaries.modalities}
            value={statement.data.modality}
          />
          <Input
            type="select"
            label="elvl"
            onChangeFn={() => {}}
            options={meta.dictionaries.elvls}
            value={statement.data.elvl}
          />
          <Input
            type="select"
            label="certainty"
            onChangeFn={() => {}}
            options={meta.dictionaries.certainties}
            value={statement.data.certainty}
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
          <div key="actants">
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
                {statement.data.actants.map((statementActant, sai) => {
                  const actant = actants.find(
                    (a) => a.id === statementActant.actant
                  );
                  return actant ? (
                    <tr key={sai}>
                      <td key="actants">
                        <Tag
                          key={"1"}
                          propId={actant.id}
                          category={Entities[actant.class].id}
                          color={Entities[actant.class].color}
                          label={actant.data.label}
                          isDraggable
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
                        <Button key="d" label="r" color="danger" />
                      </td>
                    </tr>
                  ) : (
                    <tr key={sai} />
                  );
                })}
              </tbody>
            </table>
          </div>

          {
            // properties
          }
          <h2>Properties (has)</h2>
          <div key="properties">
            {statement.data.actants.map((statementActant, sai) => {
              const actant = actants.find(
                (a) => a.id === statementActant.actant
              );
              return actant ? (
                <div key={sai}>
                  <Tag
                    key={"1"}
                    propId={actant.id}
                    category={Entities[actant.class].id}
                    color={Entities[actant.class].color}
                    label={actant.data.label}
                    isDraggable
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
                        .map((actantProp, ap) => {
                          const typeId = actantProp.actant1;
                          const valueId = actantProp.actant2;

                          const type = actants.find((a) => a.id === typeId);
                          const value = actants.find((a) => a.id === valueId);

                          console.log(actantProp);
                          return type && value ? (
                            <tr key={ap}>
                              <td key="type">
                                <Tag
                                  propId={actant.id}
                                  category={Entities[type.class].id}
                                  color={Entities[type.class].color}
                                  label={actant.data.label}
                                  isDraggable
                                />
                              </td>
                              <td key="value">
                                <Tag
                                  propId={actant.id}
                                  category={Entities[value.class].id}
                                  color={Entities[value.class].color}
                                  label={actant.data.label}
                                  isDraggable
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

            <Suggester
              suggestions={[]}
              typed={""}
              category={Entities["P"].id}
              categories={Object.keys(Entities).map((ek) => ({
                value: Entities[ek].id,
                label: Entities[ek].label,
              }))}
              onType={(newTyped: string) => console.log("newTyped", newTyped)}
              onChangeCategory={(newEntityTypeId: keyof typeof Entities) => {
                const newEntityType = Entities[newEntityTypeId];
                console.log("newEntityType", newEntityType);
              }}
              onCreate={(suggestion: SuggestionI) => {
                console.log("suggestion " + suggestion.id + " picked");
              }}
              onPick={(created: SuggestionI) => {
                console.log(
                  "new node " +
                    created.category +
                    ": " +
                    created.label +
                    " created"
                );
              }}
            />
          </div>
        </div>
      ) : (
        <div>no statement selected</div>
      )}
    </>
  );
};
