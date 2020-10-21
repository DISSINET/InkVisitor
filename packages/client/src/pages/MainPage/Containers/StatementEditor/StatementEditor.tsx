import React from "react";
import { FaTrashAlt } from "react-icons/fa";

import { Entities } from "types";
import { Tag, Button, Input, Suggester } from "components";
import { StatementI, ResponseMetaI, ActantI } from "@shared/types";
import { SuggestionI } from "components/Suggester/Suggester";

interface StatementEditor {
  statement: undefined | StatementI;
  meta: ResponseMetaI;
  actants: ActantI[];
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

export const StatementEditor: React.FC<StatementEditor> = ({
  statement,
  meta,
  actants,
}) => {
  const actionTypes = meta.actions.map((a) => ({
    value: a.id,
    label: a.labels[0].label,
  }));

  // console.log(statement);

  return (
    <>
      {statement ? (
        <div key={statement.id}>
          <div className="section-introduction grid grid-cols-2">
            <div className="table">
              <div className="table-row leading-3">
                <div className="table-cell float-right mr-2">Action</div>
                <div className="table-cell">
                  <Input
                    type="select"
                    onChangeFn={() => {}}
                    options={actionTypes}
                    value={statement.data.action}
                  />
                </div>
              </div>
              <div className="table-row leading-3">
                <div className="table-cell float-right mr-2">Modality</div>
                <div className="table-cell">
                  <Input
                    type="select"
                    onChangeFn={() => {}}
                    options={meta.dictionaries.modalities}
                    value={statement.data.modality}
                  />
                </div>
              </div>
              <div className="table-row leading-3">
                <div className="table-cell float-right mr-2">Elvl</div>
                <div className="table-cell">
                  <Input
                    type="select"
                    onChangeFn={() => {}}
                    options={meta.dictionaries.elvls}
                    value={statement.data.elvl}
                  />
                </div>
              </div>
              <div className="table-row leading-3">
                <div className="table-cell float-right mr-2">Certainty</div>
                <div className="table-cell">
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
                onChangeFn={() => {}}
                value={statement.data.text}
              />
            </div>
          </div>

          <h2 className="text-lg font-bold mt-4 border-t-4 border-solid text-center">
            Actants
          </h2>
          <div key="actants" className="mt-4">
            <table className="w-full">
              <thead>
                <tr className="text-left">
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
          <h2 className="text-lg font-bold mt-4 border-t-4 border-solid text-center">
            Properties (has)
          </h2>
          <div key="properties">
            {statement.data.actants.map((statementActant, sai) => {
              const actant = actants.find(
                (a) => a.id === statementActant.actant
              );

              const actantProps = statement.data.props.filter(
                (p) => p.subject === statementActant.actant
              );

              return actant ? (
                <div key={sai} className="mt-4">
                  <Tag
                    key={"1"}
                    propId={actant.id}
                    category={Entities[actant.class].id}
                    color={Entities[actant.class].color}
                    label={actant.data.label}
                    isDraggable
                  />

                  {actantProps.length ? (
                    <table className="w-full">
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
                  <div className="mt-1">{suggester()}</div>
                </div>
              ) : (
                <div />
              );
            })}
          </div>
          {
            // resources
          }
          <h2 className="text-lg font-bold mt-4 border-t-4 border-solid text-center">
            Resources
          </h2>
          {
            // tags
          }
          <h2 className="text-lg font-bold mt-4 border-t-4 border-solid text-center">
            Tags
          </h2>
          {
            // note
          }
          <h2 className="text-lg font-bold mt-4 border-t-4 border-solid text-center">
            Note
          </h2>
          <Input
            type="textarea"
            label="Note"
            onChangeFn={() => {}}
            value={statement.data.note}
          />
          <Button label="save" />
        </div>
      ) : (
        <div>no statement selected</div>
      )}
    </>
  );
};
