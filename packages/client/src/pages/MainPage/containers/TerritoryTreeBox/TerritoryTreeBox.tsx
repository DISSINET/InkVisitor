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
import { Arrow, Button, ButtonGroup, Tag } from "components";

import { ActantTag } from "./../";
import { FaCaretRight, FaCircle, FaDotCircle } from "react-icons/fa";
import {
  StyledIconWrap,
  StyledTerritoryTagWrap,
} from "./TerritoryTreeBoxStyle";

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

  const renderTerritoryTag = (
    territoryActant: IActant,
    id: string,
    hasChildren: boolean
  ) => {
    return (
      <StyledTerritoryTagWrap>
        <StyledIconWrap>
          {hasChildren ? (
            <Arrow
              rotation="right"
              size={6}
              onClick={() => {
                hashParams["territory"] = id;
                history.push({
                  hash: queryString.stringify(hashParams),
                });
              }}
            />
          ) : (
            <FaDotCircle
              size={13}
              style={{ marginRight: "0.3rem" }}
              onClick={() => {
                hashParams["territory"] = id;
                history.push({
                  hash: queryString.stringify(hashParams),
                });
              }}
            />
          )}
        </StyledIconWrap>
        <ActantTag
          actant={territoryActant}
          isSelected={territoryId === id}
          // button={
          //   <Button
          //     color="primary"
          //     onClick={() => {
          //       hashParams["territory"] = id;
          //       history.push({
          //         hash: queryString.stringify(hashParams),
          //       });
          //     }}
          //     icon={<FaCaretRight />}
          //     label=""
          //   />
          // }
        />
      </StyledTerritoryTagWrap>
    );
  };

  const renderTerritory = (territory: any, children: any, lvl: any) => {
    return (
      <div style={{}} key={territory.id}>
        {renderTerritoryTag(territory, territory.id, children.length > 0)}

        <div style={{ marginLeft: `0.75rem` }}>
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
