import { UserRoleMode } from "@shared/enums";
import { IEntity, ITerritory } from "@shared/types";
import { IParentTerritory } from "@shared/types/territory";
import api from "api";
import { useSearchParams } from "hooks";
import update from "immutability-helper";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BsCaretDown,
  BsCaretDownFill,
  BsCaretRight,
  BsCaretRightFill,
} from "react-icons/bs";
import { useMutation, UseMutationResult, useQueryClient } from "react-query";
import { animated, config, useSpring } from "react-spring";
import { setTreeInitialized } from "redux/features/territoryTree/treeInitializeSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { rootTerritoryId } from "Theme/constants";
import theme from "Theme/theme";
import { DraggedTerritoryItem, DragItem } from "types";
import { EntityTag } from "../..";
import { TerritoryTreeContextMenu } from "../TerritoryTreeContextMenu/TerritoryTreeContextMenu";
import {
  StyledChildrenWrap,
  StyledDisabledTag,
  StyledFaCircle,
  StyledFaDotCircle,
  StyledIconWrap,
  StyledTerritoryTagWrap,
} from "./TerritoryTreeNodeStyles";

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
  right: UserRoleMode;
  storedTerritories: string[];
  updateUserMutation: UseMutationResult<void, unknown, object, unknown>;
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
  right,
  storedTerritories,
  updateUserMutation,
}) => {
  const dispatch = useAppDispatch();
  const treeInitialized = useAppSelector((state) => state.treeInitialized);
  const queryClient = useQueryClient();

  const { territoryId, setTerritoryId } = useSearchParams();

  const isSelected = territoryId === territory.id;

  const [isExpanded, setIsExpanded] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [childTerritories, setChildTerritories] = useState<any[]>([]);
  const animatedStyle = useSpring({
    opacity: contextMenuOpen ? 0.6 : 1,
    display: "inline-flex",
    overflow: "hidden",
    config: config.stiff,
  });

  const symbolColor = useMemo(() => {
    return right === UserRoleMode.Read
      ? theme.color.gray[600]
      : theme.color.gray[800];
  }, [right]);

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
              color={symbolColor}
              style={{
                strokeWidth: "2",
                strokeLinejoin: "bevel",
                marginRight: "2px",
              }}
            />
          ) : (
            <BsCaretRightFill
              size={14}
              onClick={() => onCaretClick(id)}
              color={symbolColor}
              style={{
                strokeWidth: "2",
                strokeLinejoin: "bevel",
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
              color={symbolColor}
              style={{
                strokeWidth: "2",
                strokeLinejoin: "bevel",

                marginRight: "2px",
              }}
            />
          ) : (
            <BsCaretRight
              size={14}
              onClick={() => onCaretClick(id)}
              color={symbolColor}
              style={{
                strokeWidth: "2",
                strokeLinejoin: "bevel",
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

  // TODO: move to useCallback with all dependencies!
  const renderTerritoryTag = (
    territoryActant: IEntity,
    id: string,
    hasChildren: boolean
  ) => {
    const parent = territory.data.parent as IParentTerritory;
    const isFavorited = storedTerritories?.includes(territoryActant.id);

    return (
      <>
        {id !== rootTerritoryId && (
          <>
            {!tempDisabled ? (
              <StyledTerritoryTagWrap id={`territory${territory.id}`}>
                <StyledIconWrap>
                  {hasChildren ? (
                    <>{getArrowIcon(id)}</>
                  ) : (
                    <>
                      {statementsCount > 0 ? (
                        <StyledFaCircle
                          size={11}
                          color={symbolColor}
                          onClick={() => {
                            setTerritoryId(id);
                          }}
                        />
                      ) : (
                        <StyledFaDotCircle
                          size={11}
                          color={symbolColor}
                          onClick={() => {
                            setTerritoryId(id);
                          }}
                        />
                      )}
                    </>
                  )}
                </StyledIconWrap>
                <animated.div style={animatedStyle}>
                  <EntityTag
                    actant={territoryActant}
                    parentId={parent.id}
                    lvl={lvl}
                    isSelected={isSelected}
                    propId={propId}
                    index={index}
                    fullWidth
                    moveFn={moveFn}
                    updateOrderFn={moveTerritoryMutation.mutate}
                    statementsCount={statementsCount}
                    isFavorited={isFavorited}
                    showOnly="label"
                  />
                </animated.div>
                <TerritoryTreeContextMenu
                  territoryActant={territoryActant}
                  onMenuOpen={() => setContextMenuOpen(true)}
                  onMenuClose={() => setContextMenuOpen(false)}
                  right={right}
                  empty={empty || false}
                  storedTerritories={storedTerritories}
                  updateUserMutation={updateUserMutation}
                  isFavorited={isFavorited}
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
              right={child.right}
              lvl={child.lvl}
              statementsCount={child.statementsCount}
              initExpandedNodes={initExpandedNodes}
              propId={child.id}
              index={key}
              empty={child.empty}
              moveFn={moveChildFn}
              storedTerritories={storedTerritories}
              updateUserMutation={updateUserMutation}
            />
          ))}
      </StyledChildrenWrap>
    </>
  );
};
