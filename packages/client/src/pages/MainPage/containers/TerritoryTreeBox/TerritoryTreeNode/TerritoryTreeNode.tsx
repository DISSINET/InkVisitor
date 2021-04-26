import React, { useCallback, useEffect, useState } from "react";
import update from "immutability-helper";
import { useHistory } from "react-router-dom";
const queryString = require("query-string");
import {
  BsCaretRightFill,
  BsCaretDownFill,
  BsCaretRight,
  BsCaretDown,
} from "react-icons/bs";

import { IActant } from "@shared/types";
import {
  StyledChildrenWrap,
  StyledFaCircle,
  StyledFaDotCircle,
  StyledIconWrap,
  StyledTerritoryTagWrap,
} from "./TerritoryTreeNodeStyles";
import { ContextMenu } from "../ContextMenu/ContextMenu";
import { ActantTag } from "../..";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { setTreeInitialized } from "redux/features/treeInitializeSlice";

interface TerritoryTreeNode {
  territory: any;
  children: any;
  lvl: number;
  statementsCount: number;
  initExpandedNodes?: string[];
  propId?: string;
  index?: number;
  moveFn?: (dragIndex: number, hoverIndex: number) => void;
}
export const TerritoryTreeNode: React.FC<TerritoryTreeNode> = ({
  territory,
  children,
  lvl,
  statementsCount,
  initExpandedNodes = [],
  propId,
  index,
  moveFn,
}) => {
  const dispatch = useAppDispatch();
  const treeInitialized = useAppSelector((state) => state.treeInitialized);

  let history = useHistory();
  var hashParams = queryString.parse(location.hash);
  const territoryId = hashParams.territory;
  const isSelected = territoryId === territory.id;

  const [isExpanded, setIsExpanded] = useState(false);
  const [childTerritories, setChildTerritories] = useState<any[]>([]);

  useEffect(() => {
    setChildTerritories(children);
  }, [children]);

  useEffect(() => {
    if (!treeInitialized) {
      if (initExpandedNodes.some((node) => node === territory.id)) {
        setIsExpanded(true);
      } else if (territoryId === territory.id) {
        setIsExpanded(true);
        dispatch(setTreeInitialized(true));
      }
    }
  }, []);

  // const moveChildFn = useCallback(
  // (dragIndex: number, hoverIndex: number) => {
  // const dragCard = childTerritories[dragIndex];
  // setChildTerritories(
  //   update(childTerritories, {
  //     $splice: [
  //       [dragIndex, 1],
  //       [hoverIndex, 0, dragCard],
  //     ],
  //   })
  // );
  // },
  // [childTerritories]
  // );

  const onCaretClick = (id: string) => {
    hashParams["territory"] = id;
    history.push({
      hash: queryString.stringify(hashParams),
    });
    setIsExpanded(!isExpanded);
  };

  const getArrowIcon = (id: string) => {
    if (statementsCount > 0) {
      // filled
      return (
        <>
          {isExpanded ? (
            <BsCaretDownFill onClick={() => onCaretClick(id)} />
          ) : (
            <BsCaretRightFill onClick={() => onCaretClick(id)} />
          )}
        </>
      );
    } else {
      // bordered
      return (
        <>
          {isExpanded ? (
            <BsCaretDown onClick={() => onCaretClick(id)} />
          ) : (
            <BsCaretRight onClick={() => onCaretClick(id)} />
          )}
        </>
      );
    }
  };

  const renderTerritoryTag = (
    territoryActant: IActant,
    id: string,
    hasChildren: boolean
  ) => {
    return (
      <StyledTerritoryTagWrap>
        <StyledIconWrap>
          {hasChildren ? (
            <>{getArrowIcon(id)}</>
          ) : (
            <>
              {statementsCount > 0 ? (
                <StyledFaCircle
                  size={11}
                  onClick={() => {
                    hashParams["territory"] = id;
                    history.push({
                      hash: queryString.stringify(hashParams),
                    });
                  }}
                />
              ) : (
                <StyledFaDotCircle
                  size={11}
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
        <ActantTag
          actant={territoryActant}
          isSelected={isSelected}
          propId={propId}
          index={index}
          // moveFn={moveFn}
        />
        <ContextMenu territoryActant={territoryActant} />
      </StyledTerritoryTagWrap>
    );
  };

  return (
    <div key={territory.id}>
      {renderTerritoryTag(territory, territory.id, children.length > 0)}

      <StyledChildrenWrap>
        {isExpanded &&
          childTerritories.map((child: any, key: number) => (
            <TerritoryTreeNode
              key={key}
              territory={child.territory}
              children={child.children}
              lvl={child.lvl}
              statementsCount={child.statementsCount}
              initExpandedNodes={initExpandedNodes}
              propId={child.id}
              index={key}
              // moveFn={moveChildFn}
            />
          ))}
      </StyledChildrenWrap>
    </div>
  );
};
