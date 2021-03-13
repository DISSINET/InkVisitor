import React from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import api from "api";
const queryString = require("query-string");

import { useLocation, useHistory } from "react-router";

import { ActantTag } from "./../";
import { Button, ButtonGroup, Input } from "components";
import { modalityDict } from "./../../../../../../shared/dictionaries";

export const StatementEditorBox: React.FC = () => {
  let history = useHistory();
  let location = useLocation();
  var hashParams = queryString.parse(location.hash);

  const territoryId = hashParams.territory;
  const statementId = hashParams.statement;

  const queryClient = useQueryClient();

  const { status, data: statement, error, isFetching } = useQuery(
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
            <div className="section section-introduction">
              <h2 className="section-heading-first">Summary</h2>
              <div className="table">
                <div className="table-row leading-3">
                  <div className="label">Action</div>
                  <div className="value"></div>
                </div>
                <div className="table-row">
                  <div className="label">Modality</div>
                  <div className="value">
                    <Input
                      type="select"
                      onChangeFn={(newValue: string) => {
                        const newData = {
                          ...statement.data,
                          ...{ modality: newValue },
                        };
                        update(newData);
                      }}
                      options={modalityDict}
                      value={statement.data.modality}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        "no statement selected"
      )}
    </div>
  );
};
