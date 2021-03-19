import React, { ReactNode, useState } from "react";

import { IActant } from "@shared/types";
import {
  StyledChildrenWrap,
  StyledIconWrap,
  StyledTerritoryTagWrap,
} from "./TerritoryTreeBoxStyle";
import { Arrow } from "components";
import { FaDotCircle } from "react-icons/fa";
import { ActantTag } from "./../";
import theme from "Theme/theme";
import { useHistory } from "react-router-dom";
const queryString = require("query-string");

interface TerritoryTreeNode {
  territory: any;
  children: any;
  lvl: any;
}
export const TerritoryTreeNode: React.FC<TerritoryTreeNode> = ({
  territory,
  children,
  lvl,
}) => {
  let history = useHistory();
  var hashParams = queryString.parse(location.hash);
  const territoryId = hashParams.territory;

  const [isExpanded, setIsExpanded] = useState(false);

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
              style={{ marginRight: "0.3rem", color: theme.colors["primary"] }}
              onClick={() => {
                hashParams["territory"] = id;
                history.push({
                  hash: queryString.stringify(hashParams),
                });
              }}
            />
          )}
        </StyledIconWrap>
        <ActantTag actant={territoryActant} isSelected={territoryId === id} />
      </StyledTerritoryTagWrap>
    );
  };

  const renderTerritory = (territory: any, children: any, lvl: any) => {
    return (
      <div key={territory.id}>
        {renderTerritoryTag(territory, territory.id, children.length > 0)}

        <StyledChildrenWrap>
          {children.map((child: any) =>
            renderTerritory(child.territory, child.children, child.lvl)
          )}
        </StyledChildrenWrap>
      </div>
    );
  };

  return <div>{renderTerritory(territory, children, lvl)}</div>;
};
