import React from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import api from "api";
const queryString = require("query-string");

import { FaTrashAlt } from "react-icons/fa";

import { useLocation, useHistory } from "react-router";

import {
  ActantTag,
  ActionDropdown,
  CertaintyToggle,
  ModalityToggle,
  ElvlToggle,
} from "./../";
import { Button, ButtonGroup, Input } from "components";

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
            <div key="editor-section-summary" className="editor-section">
              <div className="editor-section-header">Summary</div>
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
            </div>
            <div key="editor-section-actants" className="editor-section">
              <div className="editor-section-header">Actants</div>
              <div className="editor-section-content">
                <table className="">
                  <thead>
                    <tr>
                      <th key="actants">Actants</th>
                      <th key="position">Position</th>
                      <th key="certainty"></th>
                      <th key="elvl"></th>
                      <th key="modality"></th>
                      <th key="actions"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {statement.data.actants.map((sActant, sai) => {
                      const actant = statement.actants.find(
                        (a) => a.id === sActant.actant
                      );
                      //console.log(statement.actants, sActant);
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
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
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
              </div>
            </div>
            <div key="editor-section-props" className="editor-section">
              <div className="editor-section-header">Properties (has)</div>
              <div className="editor-section-content"></div>
            </div>
            <div key="editor-section-refs" className="editor-section">
              <div className="editor-section-header">References</div>
              <div className="editor-section-content"></div>
            </div>
            <div key="editor-section-tags" className="editor-section">
              <div className="editor-section-header">Tags</div>
              <div className="editor-section-content"></div>
            </div>
            <div key="editor-section-notes" className="editor-section">
              <div className="editor-section-header">Notes</div>
              <div className="editor-section-content"></div>
            </div>
          </div>
        </div>
      ) : (
        "no statement selected"
      )}
    </div>
  );
};
