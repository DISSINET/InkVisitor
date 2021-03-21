import React, { useCallback, useEffect, useState } from "react";
import update from "immutability-helper";
import { useHistory } from "react-router-dom";
const queryString = require("query-string");

import { IActant } from "@shared/types";
import {
  StyledChildrenWrap,
  StyledFaCircle,
  StyledFaDotCircle,
  StyledIconWrap,
  StyledTerritoryTagWrap,
} from "./TerritoryTreeNodeStyle";
import { Arrow } from "components";
import { ActantTag } from "..";

interface TerritoryTreeNode {
  territory: any;
  children: any;
  lvl: number;
  statementsCount: number;
  // expandParent?: () => void;
}
export const TerritoryTreeNode: React.FC<TerritoryTreeNode> = ({
  territory,
  children,
  lvl,
  statementsCount,
  // expandParent = () => {},
}) => {
  let history = useHistory();
  var hashParams = queryString.parse(location.hash);
  const territoryId = hashParams.territory;
  const isSelected = territoryId === territory.id;

  const [isExpanded, setIsExpanded] = useState(true);

  // useEffect(() => {
  //   if (isSelected) {
  //     console.log("here", territory.id);
  //     expandParent;
  //   }
  // }, []);

  const [childTerritories, setChildTerritories] = useState<any[]>([]);

  useEffect(() => {
    setChildTerritories(children);
  }, [children]);

  const moveFn = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragCard = childTerritories[dragIndex];
      setChildTerritories(
        update(childTerritories, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragCard],
          ],
        })
      );
    },
    [childTerritories]
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
            <>
              {statementsCount > 0 ? (
                <StyledFaDotCircle
                  size={13}
                  onClick={() => {
                    hashParams["territory"] = id;
                    history.push({
                      hash: queryString.stringify(hashParams),
                    });
                  }}
                />
              ) : (
                <StyledFaCircle
                  size={13}
                  onClick={() => {
                    hashParams["territory"] = id;
                    history.push({
                      hash: queryString.stringify(hashParams),
                    });
                  }}
                />
              )}
            </>
          )}
        </StyledIconWrap>
        <ActantTag actant={territoryActant} isSelected={isSelected} />
      </StyledTerritoryTagWrap>
    );
  };

  return (
    <div key={territory.id}>
      {renderTerritoryTag(territory, territory.id, children.length > 0)}

      <StyledChildrenWrap isExpanded={isExpanded}>
        {childTerritories.map((child: any, key: number) => (
          <TerritoryTreeNode
            key={key}
            territory={child.territory}
            children={child.children}
            lvl={child.lvl}
            statementsCount={child.statementsCount}
            // expandParent={() => setIsExpanded(true)}
          />
        ))}
      </StyledChildrenWrap>
    </div>
  );
};
