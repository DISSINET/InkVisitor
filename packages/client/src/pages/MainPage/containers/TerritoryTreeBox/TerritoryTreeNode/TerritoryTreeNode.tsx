import React, { useCallback, useEffect, useState } from "react";
import update from "immutability-helper";
import { useHistory, useParams } from "react-router-dom";
const queryString = require("query-string");
import {
  BsCaretRightFill,
  BsCaretDownFill,
  BsCaretRight,
  BsCaretDown,
} from "react-icons/bs";

import { IActant, ITerritory } from "@shared/types";
import {
  StyledChildrenWrap,
  StyledDisabledTag,
  StyledFaCircle,
  StyledFaDotCircle,
  StyledIconWrap,
  StyledTerritoryTagWrap,
} from "./TerritoryTreeNodeStyles";
import { ContextMenu } from "../ContextMenu/ContextMenu";
import { ActantTag } from "../..";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { setTreeInitialized } from "redux/features/territoryTree/treeInitializeSlice";
import theme from "Theme/theme";
import { rootTerritoryId } from "Theme/constants";
import { animated, config, useSpring } from "react-spring";
import api from "api";
import { IParentTerritory } from "@shared/types/territory";
import { useMutation, useQueryClient } from "react-query";
import { DraggedTerritoryItem, DragItem, SearchParams } from "types";
import { useSearchParams } from "hooks";

interface TerritoryTreeNode {
  territory: ITerritory;
  children: any;
  lvl: number;
  statementsCount: number;
  initExpandedNodes?: string[];
  propId?: string;
  index?: number;
  moveFn?: (dragIndex: number, hoverIndex: number) => void;
  empty?: boolean;
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
  empty,
}) => {
  const dispatch = useAppDispatch();
  const treeInitialized = useAppSelector((state) => state.treeInitialized);
  const queryClient = useQueryClient();

  let history = useHistory();
  const queryParams = new URLSearchParams(location.search);

  const {
    territory: territoryId,
    setTerritory: setTerritoryId,
    statement: statementId,
    setStatement: setStatementId,
  } = useSearchParams();

  // var hashParams = queryString.parse(location.hash);
  // const selectedTerritoryId = hashParams.territory;

  const isSelected = territoryId === territory.id;

  const [isExpanded, setIsExpanded] = useState(false);
  const [childTerritories, setChildTerritories] = useState<any[]>([]);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const animatedStyle = useSpring({
    opacity: contextMenuOpen ? 0.6 : 1,
    display: "inline-flex",
    overflow: "hidden",
    config: config.stiff,
  });

  useEffect(() => {
    setChildTerritories(children);
  }, [children]);

  useEffect(() => {
    if (!treeInitialized) {
      const shouldExpand = initExpandedNodes.some(
        (node) => node === territory.id
      );
      if (shouldExpand) {
        setIsExpanded(true);
      } else if (territoryId === territory.id) {
        setIsExpanded(true);
        dispatch(setTreeInitialized(true));
      } else if (territory.id === rootTerritoryId) {
        setIsExpanded(true);
      } else {
        setIsExpanded(false);
      }
    }
  }, [treeInitialized, initExpandedNodes]);

  const moveChildFn = useCallback(
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

  const moveTerritoryMutation = useMutation(
    async (item: DragItem) => {
      if (territory.data.parent && item.index !== -1) {
        const parent = territory.data.parent as IParentTerritory;
        await api.treeMoveTerritory(item.id, parent.id, item.index);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("tree");
      },
    }
  );

  const onCaretClick = (id: string) => {
    setTerritoryId(id);
    setIsExpanded(!isExpanded);
  };

  const getArrowIcon = (id: string) => {
    if (!empty) {
      // filled
      return (
        <>
          {isExpanded ? (
            <BsCaretDownFill
              size={14}
              onClick={() => onCaretClick(id)}
              style={{
                strokeWidth: "2",
                strokeLinejoin: "bevel",
                color: theme.color["primary"],
                marginRight: "2px",
              }}
            />
          ) : (
            <BsCaretRightFill
              size={14}
              onClick={() => onCaretClick(id)}
              style={{
                strokeWidth: "2",
                strokeLinejoin: "bevel",
                color: theme.color["primary"],
                marginRight: "2px",
              }}
            />
          )}
        </>
      );
    } else {
      // bordered
      return (
        <>
          {isExpanded ? (
            <BsCaretDown
              size={14}
              onClick={() => onCaretClick(id)}
              style={{
                strokeWidth: "2",
                strokeLinejoin: "bevel",
                color: theme.color["primary"],
                marginRight: "2px",
              }}
            />
          ) : (
            <BsCaretRight
              size={14}
              onClick={() => onCaretClick(id)}
              style={{
                strokeWidth: "2",
                strokeLinejoin: "bevel",
                color: theme.color["primary"],
                marginRight: "2px",
              }}
            />
          )}
        </>
      );
    }
  };

  const draggedTerritory: DraggedTerritoryItem = useAppSelector(
    (state) => state.territoryTree.draggedTerritory
  );

  const [tempDisabled, setTempDisabled] = useState(false);
  const [hideChildTerritories, setHideChildTerritories] = useState(false);

  useEffect(() => {
    if (
      draggedTerritory.parentId &&
      draggedTerritory.parentId !==
        (territory.data.parent as IParentTerritory).id &&
      draggedTerritory.parentId !== propId
    ) {
      if (draggedTerritory.lvl && draggedTerritory.lvl > lvl) {
        setTempDisabled(true);
      }
    } else {
      setTempDisabled(false);
    }

    if (draggedTerritory.parentId) {
      if (draggedTerritory.lvl && draggedTerritory.lvl === lvl) {
        setHideChildTerritories(true);
      }
    } else {
      setHideChildTerritories(false);
    }
  }, [draggedTerritory]);

  const renderTerritoryTag = (
    territoryActant: IActant,
    id: string,
    hasChildren: boolean
  ) => {
    const parent = territory.data.parent as IParentTerritory;
    return (
      <>
        {id !== rootTerritoryId && (
          <>
            {!tempDisabled ? (
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
                            setTerritoryId(id);
                          }}
                        />
                      ) : (
                        <StyledFaDotCircle
                          size={11}
                          onClick={() => {
                            setTerritoryId(id);
                          }}
                        />
                      )}
                    </>
                  )}
                </StyledIconWrap>
                <animated.div style={animatedStyle}>
                  <ActantTag
                    actant={territoryActant}
                    parentId={parent.id}
                    lvl={lvl}
                    isSelected={isSelected}
                    propId={propId}
                    index={index}
                    fullWidth
                    enableTooltip
                    moveFn={moveFn}
                    updateOrderFn={moveTerritoryMutation.mutate}
                  />
                </animated.div>
                <ContextMenu
                  territoryActant={territoryActant}
                  onMenuOpen={() => setContextMenuOpen(true)}
                  onMenuClose={() => setContextMenuOpen(false)}
                />
              </StyledTerritoryTagWrap>
            ) : (
              <StyledDisabledTag />
            )}
          </>
        )}
      </>
    );
  };

  return (
    <>
      {renderTerritoryTag(territory, territory.id, children.length > 0)}

      <StyledChildrenWrap noIndent={lvl === 0}>
        {!hideChildTerritories &&
          isExpanded &&
          childTerritories.map((child: any, key: number) => (
            <TerritoryTreeNode
              key={`${key}_${child.id}`}
              territory={child.territory}
              children={child.children}
              lvl={child.lvl}
              statementsCount={child.statementsCount}
              initExpandedNodes={initExpandedNodes}
              propId={child.id}
              index={key}
              empty={child.empty}
              moveFn={moveChildFn}
            />
          ))}
      </StyledChildrenWrap>
    </>
  );
};
