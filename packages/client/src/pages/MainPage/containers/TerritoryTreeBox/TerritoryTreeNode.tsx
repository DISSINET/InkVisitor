import React, { useState } from "react";

import { IActant } from "@shared/types";
import {
  StyledChildrenWrap,
  StyledFaDotCircle,
  StyledIconWrap,
  StyledTerritoryTagWrap,
} from "./TerritoryTreeBoxStyle";
import { Arrow } from "components";
import { ActantTag } from "./../";
import { useHistory } from "react-router-dom";
const queryString = require("query-string");

interface TerritoryTreeNode {
  territory: any;
  children: any;
  lvl: number;
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
              rotation={isExpanded ? "bottom" : "right"}
              size={6}
              onClick={() => {
                hashParams["territory"] = id;
                history.push({
                  hash: queryString.stringify(hashParams),
                });
                setIsExpanded(!isExpanded);
              }}
            />
          ) : (
            <StyledFaDotCircle
              size={13}
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

  return (
    <div key={territory.id}>
      {renderTerritoryTag(territory, territory.id, children.length > 0)}

      <StyledChildrenWrap>
        {isExpanded &&
          children.map((child: any) => (
            <TerritoryTreeNode
              territory={child.territory}
              children={child.children}
              lvl={child.lvl}
            />
          ))}
      </StyledChildrenWrap>
    </div>
  );
};
