import React from "react";
import { useQuery } from "react-query";
import api from "api";
const queryString = require("query-string");

import { useLocation, useHistory } from "react-router";
import {
  ITerritory,
  IResponseTreeTerritoryComponent,
  IActant,
} from "@shared/types";
import { Button, ButtonGroup, Tag } from "components";

import { ActantTag } from "./../";
import { FaCaretRight } from "react-icons/fa";

export const TerritoryTreeBox: React.FC = () => {
  let history = useHistory();
  let location = useLocation();

  var hashParams = queryString.parse(location.hash);
  const territoryId = hashParams.territory;
  const statementId = hashParams.statement;

  const { status, data, error, isFetching } = useQuery(
    ["statement", "territory", "tree"],
    async () => {
      const res = await api.treeGet();
      return res.data;
    },
    {}
  );

  const renderTerritoryTag = (territoryActant: IActant, id: string) => {
    return (
      <ActantTag
        actant={territoryActant}
        button={
          <Button
            color="primary"
            onClick={() => {
              hashParams["territory"] = id;
              history.push({
                hash: queryString.stringify(hashParams),
              });
            }}
            icon={<FaCaretRight />}
            label=""
          />
        }
      />
    );
  };

  const renderTerritory = (territory: any, children: any, lvl: any) => {
    return (
      <div style={{ padding: "2px" }} key={territory.id}>
        {renderTerritoryTag(territory, territory.id)}

        <div style={{ marginLeft: `1em` }}>
          {children.map((child: any) =>
            renderTerritory(child.territory, child.children, child.lvl)
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {data && renderTerritory(data.territory, data.children, data.lvl)}
    </div>
  );
};
