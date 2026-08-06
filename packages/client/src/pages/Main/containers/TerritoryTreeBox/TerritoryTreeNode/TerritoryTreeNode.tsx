import { config, useSpring } from "@react-spring/web";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { ITerritory, IUser } from "@inkvisitor/shared/types";
import { IParentTerritory } from "@inkvisitor/shared/types/territory";
import { UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query";
import { rootTerritoryId } from "Theme/constants";
import api from "api";
import { EntityDropzone, EntityTag, PaginationControls } from "components/advanced";
import { useSearchParams } from "hooks";
import { usePagination } from "hooks/usePagination";
import update from "immutability-helper";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { setDisableTreeScroll } from "redux/features/territoryTree/disableTreeScrollSlice";
import { setTreeInitialized } from "redux/features/territoryTree/treeInitializeSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import {
  DetailBoxState,
  DraggedEntityReduxItem,
  EntityDragItem,
  IExtendedResponseTree,
} from "types";
import { TerritoryTreeContextMenu } from "../TerritoryTreeContextMenu/TerritoryTreeContextMenu";
import TerritoryTreeNodeArrowIcon from "./TerritoryTreeNodeArrowIcon";
import {
  StyledChildrenWrap,
  StyledDisabledTag,
  StyledIconWrap,
  StyledTerritoryTagWrap,
} from "./TerritoryTreeNodeStyles";
import { setDetailBoxState } from "redux/features/layout/mainPage/detailBoxStateSlice";

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
  updateUserMutation: UseMutationResult<void, unknown, Partial<IUser>, unknown>;
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
  const detailBoxState: DetailBoxState = useAppSelector(
    (state) => state.layout.mainPage.detailBoxState,
  );
  const treeInitialized = useAppSelector((state) => state.treeInitialized);
  const queryClient = useQueryClient();

  const { territoryId, setTerritoryId } = useSearchParams();

  const isSelected = territoryId === territory.id;

  const [isExpanded, setIsExpanded] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [childTerritories, setChildTerritories] = useState<IExtendedResponseTree[]>([]);

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
      const shouldExpand = initExpandedNodes.some((node) => node === territory.id);
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

  const moveChildFn = useCallback((dragIndex: number, hoverIndex: number) => {
    setChildTerritories((childTerritories) =>
      update(childTerritories, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, childTerritories[dragIndex]],
        ],
      }),
    );
  }, []);

  const moveTerritoryMutation = useMutation({
    mutationFn: async (item: EntityDragItem) => {
      if (territory.data.parent && item.index !== -1) {
        const parent = territory.data.parent as IParentTerritory;
        await api.treeMoveTerritory(item.id, parent.territoryId, item.index);
      }
    },
    onSuccess: () => {
      dispatch(setDisableTreeScroll(true));
      queryClient.invalidateQueries({ queryKey: ["tree"] });
    },
  });

  const draggedEntity: DraggedEntityReduxItem = useAppSelector((state) => state.draggedEntity);

  const [tempDisabled, setTempDisabled] = useState(false);
  const [hideChildTerritories, setHideChildTerritories] = useState(false);

  useEffect(() => {
    if (
      draggedEntity.parentId &&
      draggedEntity.parentId !== (territory.data.parent as IParentTerritory).territoryId &&
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

  const hasChildren = children.length > 0;
  const { id, data } = territory;
  const parent = data.parent as IParentTerritory;
  const isFavorited = storedTerritories?.includes(id);

  // Index of the child that leads to (or is) the selected territory, so
  // pagination can land on the page that actually renders it. initExpandedNodes
  // is the path of ancestors to the selected territory; territoryId is the
  // selected territory itself (when it is a direct child here).
  const targetChildIndex = childTerritories.findIndex(
    (child) => child.territory.id === territoryId || initExpandedNodes.includes(child.territory.id),
  );

  // Pagination hook
  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedItems: paginatedChildren,
    showPagination,
    handlePreviousPage,
    handleNextPage,
  } = usePagination({
    items: childTerritories,
    itemsPerPage: 10,
    level: lvl,
    targetIndex: targetChildIndex,
  });

  // Use all children when pagination is disabled (level 0), otherwise use paginated children
  const childrenToRender = showPagination ? paginatedChildren : childTerritories;

  const handleMenuOpen = useCallback(() => {
    setContextMenuOpen(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    setContextMenuOpen(false);
  }, []);

  const handleIconClick = useCallback(() => {
    setTerritoryId(territory.id);
    if (hasChildren) {
      setIsExpanded((prevIsExpanded) => !prevIsExpanded);
    }
    if (detailBoxState === DetailBoxState.FullHeight) {
      dispatch(setDetailBoxState(DetailBoxState.Normal));
    }
  }, [hasChildren, territoryId, detailBoxState]);

  const moveStatementsMutation = useMutation({
    mutationFn: async (data: { statements: string[]; newTerritoryId: string }) =>
      await api.statementsBatchMove(data.statements, data.newTerritoryId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["territory"] });
      queryClient.invalidateQueries({ queryKey: ["tree"] });
      toast.info(`statement moved`);
      // could be redirected to newTerritory
      // setTerritoryId(variables.newTerritoryId);
    },
  });

  return (
    <>
      <>
        {!tempDisabled ? (
          <StyledTerritoryTagWrap
            id={`territory${id}`}
            // the flag is only set while a filter runs, so undefined means the
            // tree is unfiltered and nothing recedes
            $dimmed={foundByRecursion === false}
            style={{
              opacity: animatedStyle.opacity,
            }}
          >
            <StyledIconWrap onClick={handleIconClick}>
              <TerritoryTreeNodeArrowIcon
                territoryId={id}
                isExpanded={isExpanded}
                empty={empty ?? false}
                hasChildren={hasChildren}
                statementsCount={statementsCount}
                right={right}
              />
            </StyledIconWrap>
            <EntityDropzone
              onSelected={(newSelectedId: string) => {
                moveStatementsMutation.mutate({
                  statements: [newSelectedId],
                  newTerritoryId: territory.id,
                });
              }}
              disableTemplatesAccept
              categoryTypes={[EntityEnums.Class.Statement]}
              refuseDrop={right === UserEnums.RoleMode.Read}
              refuseReadOnlySource
              // ideally statements in current T
              // excludedActantIds={[territory.data]}
            >
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
                customTooltipAttributes={{
                  childCount: children.length,
                }}
              />
            </EntityDropzone>
            <TerritoryTreeContextMenu
              territoryActant={territory}
              onMenuOpen={handleMenuOpen}
              onMenuClose={handleMenuClose}
              right={right}
              empty={(empty && !children.length) || false}
              storedTerritories={storedTerritories}
              updateUserMutation={updateUserMutation}
              isFavorited={isFavorited}
              hasPaginatedChildren={childTerritories.length > 10 && lvl >= 1}
              childTerritories={childTerritories}
            />
          </StyledTerritoryTagWrap>
        ) : (
          <StyledDisabledTag />
        )}
      </>

      <StyledChildrenWrap>
        {!hideChildTerritories &&
          isExpanded &&
          childrenToRender.map((child: IExtendedResponseTree, key: number) => (
            <MemoizedTerritoryTreeNode
              key={showPagination ? (currentPage - 1) * 10 + key : key}
              index={showPagination ? (currentPage - 1) * 10 + key : key}
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
        {!hideChildTerritories && isExpanded && showPagination && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPreviousPage={handlePreviousPage}
            onNextPage={handleNextPage}
          />
        )}
      </StyledChildrenWrap>
    </>
  );
};

export const MemoizedTerritoryTreeNode = React.memo(TerritoryTreeNode);
