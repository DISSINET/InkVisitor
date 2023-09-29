import { animated, config, useSpring } from "@react-spring/web";
import { UserEnums } from "@shared/enums";
import { ITerritory } from "@shared/types";
import { IParentTerritory } from "@shared/types/territory";
import {
  UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { rootTerritoryId } from "Theme/constants";
import api from "api";
import { EntityTag } from "components/advanced";
import { useSearchParams } from "hooks";
import update from "immutability-helper";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BsCaretDown,
  BsCaretDownFill,
  BsCaretRight,
  BsCaretRightFill,
} from "react-icons/bs";
import { setDisableTreeScroll } from "redux/features/territoryTree/disableTreeScrollSlice";
import { setTreeInitialized } from "redux/features/territoryTree/treeInitializeSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import {
  DraggedEntityReduxItem,
  EntityDragItem,
  IExtendedResponseTree,
} from "types";
import { TerritoryTreeContextMenu } from "../TerritoryTreeContextMenu/TerritoryTreeContextMenu";
import {
  StyledChildrenWrap,
  StyledDisabledTag,
  StyledFaCircle,
  StyledFaDotCircle,
  StyledIconWrap,
  StyledTerritoryTagWrap,
} from "./TerritoryTreeNodeStyles";
import { ThemeContext, useTheme } from "styled-components";
import { ThemeType } from "Theme/theme";

interface TerritoryTreeNode {
  territory: ITerritory;
  children: IExtendedResponseTree[];
  lvl: number;
  statementsCount: number;
  initExpandedNodes?: string[];
  propId?: string;
  index?: number;
  moveFn?: (dragIndex: number, hoverIndex: number) => void;
  empty?: boolean;
  foundByRecursion?: boolean;
  right: UserEnums.RoleMode;
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
  foundByRecursion,
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
  const [childTerritories, setChildTerritories] = useState<
    IExtendedResponseTree[]
  >([]);
  const animatedStyle = useSpring({
    opacity: contextMenuOpen ? 0.6 : 1,
    display: "inline-flex",
    overflow: "hidden",
    config: config.stiff,
  });

  const themeId = useAppSelector((state) => state.theme);
  const themeContext = useContext(ThemeContext);

  const symbolColor = useMemo(() => {
    return right === UserEnums.RoleMode.Read
      ? themeContext.color.gray[600]
      : themeContext.color.gray[800];
  }, [right, themeId]);

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
    async (item: EntityDragItem) => {
      if (territory.data.parent && item.index !== -1) {
        const parent = territory.data.parent as IParentTerritory;
        await api.treeMoveTerritory(item.id, parent.territoryId, item.index);
      }
    },
    {
      onSuccess: () => {
        dispatch(setDisableTreeScroll(true));
        queryClient.invalidateQueries(["tree"]);
      },
    }
  );

  const onCaretClick = (id: string) => {
    setTerritoryId(id);
    setIsExpanded(!isExpanded);
  };

  const renderArrowIcon = () => {
    const { id } = territory;
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

  const draggedEntity: DraggedEntityReduxItem = useAppSelector(
    (state) => state.draggedEntity
  );

  const [tempDisabled, setTempDisabled] = useState(false);
  const [hideChildTerritories, setHideChildTerritories] = useState(false);

  useEffect(() => {
    if (
      draggedEntity.parentId &&
      draggedEntity.parentId !==
        (territory.data.parent as IParentTerritory).territoryId &&
      draggedEntity.parentId !== propId
    ) {
      if (draggedEntity.lvl && draggedEntity.lvl > lvl) {
        setTempDisabled(true);
      }
    } else {
      setTempDisabled(false);
    }

    if (draggedEntity.parentId) {
      if (draggedEntity.lvl && draggedEntity.lvl === lvl) {
        setHideChildTerritories(true);
      }
    } else {
      setHideChildTerritories(false);
    }
  }, [draggedEntity]);

  const renderTreeNode = () => {
    const hasChildren = children.length > 0;
    const { id, data } = territory;
    const parent = data.parent as IParentTerritory;
    const isFavorited = storedTerritories?.includes(id);

    return (
      <>
        {id !== rootTerritoryId && (
          <>
            {!tempDisabled ? (
              <StyledTerritoryTagWrap
                id={`territory${id}`}
                style={{
                  backgroundColor: foundByRecursion
                    ? themeContext.color.foundByTreeFilter
                    : "",
                }}
              >
                <StyledIconWrap>
                  {hasChildren ? (
                    <>{renderArrowIcon()}</>
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
                    entity={territory}
                    parentId={parent.territoryId}
                    lvl={lvl}
                    isSelected={isSelected}
                    index={index}
                    fullWidth
                    moveFn={moveFn}
                    updateOrderFn={moveTerritoryMutation.mutate}
                    statementsCount={statementsCount}
                    isFavorited={isFavorited}
                    showOnly="label"
                    tooltipPosition="right"
                  />
                </animated.div>
                <TerritoryTreeContextMenu
                  territoryActant={territory}
                  onMenuOpen={() => setContextMenuOpen(true)}
                  onMenuClose={() => setContextMenuOpen(false)}
                  right={right}
                  empty={(empty && !children.length) || false}
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
      {renderTreeNode()}

      <StyledChildrenWrap noIndent={lvl === 0}>
        {!hideChildTerritories &&
          isExpanded &&
          childTerritories.map((child: IExtendedResponseTree, key: number) => (
            <TerritoryTreeNode
              key={key}
              index={key}
              propId={child.territory.id}
              territory={child.territory}
              children={child.children}
              right={child.right}
              lvl={child.lvl}
              statementsCount={child.statementsCount}
              initExpandedNodes={initExpandedNodes}
              empty={child.empty}
              foundByRecursion={child.foundByRecursion}
              moveFn={moveChildFn}
              storedTerritories={storedTerritories}
              updateUserMutation={updateUserMutation}
            />
          ))}
      </StyledChildrenWrap>
    </>
  );
};
