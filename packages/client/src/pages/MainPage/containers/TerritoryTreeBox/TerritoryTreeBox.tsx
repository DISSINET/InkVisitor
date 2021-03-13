import React from "react";
import { useQuery } from "react-query";
import api from "api";
const queryString = require("query-string");

import { useLocation, useHistory } from "react-router";
import { ITerritory, IResponseTreeTerritoryComponent } from "@shared/types";
import { Button, ButtonGroup, Tag } from "components";

import { FaCaretRight } from "react-icons/fa";

export const TerritoryTreeBox: React.FC = () => {
  let history = useHistory();
  let location = useLocation();

  var hashParams = queryString.parse(location.hash);

  const { status, data, error, isFetching } = useQuery(
    "tree",
    async () => {
      const res = await api.treeGet();
      return res.data;
    },
    {}
  );

  const renderTerritoryTag = (label: string, id: string) => {
    return (
      <Tag
        category="T"
        label={label}
        color="#bcd"
        key={id}
        button={
          <Button
            color="primary"
            onClick={() => {
              hashParams["territory"] = id;
              history.push({
                hash: queryString.stringify(hashParams),
              });
              console.log("clicked");
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
      <div>
        {renderTerritoryTag(territory.labels[0].value, territory.id)}

        <div style={{ marginLeft: `1em` }}>
          {children.map((child: any) =>
            renderTerritory(child.territory, child.children, child.lvl)
          )}
        </div>
      </div>
    );
  };

  if (data) {
    console.log(data);
  }

  return (
    <div>
      {data && renderTerritory(data.territory, data.children, data.lvl)}
    </div>
  );
};
