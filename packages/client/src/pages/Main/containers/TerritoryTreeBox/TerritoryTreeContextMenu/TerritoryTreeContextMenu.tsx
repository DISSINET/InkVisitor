import { FloatingPortal, autoUpdate, useFloating } from "@floating-ui/react";
import { config, useSpring } from "@react-spring/web";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity, IUser } from "@inkvisitor/shared/types";
import { UseMutationResult, useQueryClient } from "@tanstack/react-query";
import { rootTerritoryId } from "Theme/constants";
import { Button } from "components";
import React, { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";
import { IcoPlusBold, IcoTrash } from "Theme/icons";
import { TbArrowsSort } from "react-icons/tb";
import { ContextMenuSubmitDelete } from "../ContextMenuSubmitDelete/ContextMenuSubmitDelete";
import { ReorderTerritoryChildrenModal } from "../ReorderTerritoryChildrenModal/ReorderTerritoryChildrenModal";
import {
  StyledCgMenuBoxed,
  StyledContextButtonGroup,
  StyledWrapper,
} from "./TerritoryTreeContextMenuStyles";
import { EntityCreateModal } from "components/advanced";
import { ButtonSize, IExtendedResponseTree } from "types";

interface TerritoryTreeContextMenu {
  territoryActant: IEntity;
  right: UserEnums.RoleMode;
  empty: boolean;
  onMenuOpen: () => void;
  onMenuClose: () => void;
  storedTerritories: string[];
  updateUserMutation: UseMutationResult<void, unknown, Partial<IUser>, unknown>;
  isFavorited?: boolean;
  hasPaginatedChildren?: boolean;
  childTerritories?: IExtendedResponseTree[];
}
export const TerritoryTreeContextMenu: React.FC<TerritoryTreeContextMenu> = ({
  territoryActant,
  onMenuOpen,
  onMenuClose,
  right,
  empty,
  storedTerritories,
  updateUserMutation,
  isFavorited,
  hasPaginatedChildren,
  childTerritories,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showReorder, setShowReorder] = useState(false);

  const canReorder = hasPaginatedChildren && childTerritories && childTerritories.length > 1;

  const animatedMount = useSpring({
    opacity: showMenu ? 1 : 0,
    config: config.stiff,
  });

  const { refs, floatingStyles } = useFloating({
    placement: "right",
    whileElementsMounted: autoUpdate,
  });

  const [portalMounted, setPortalMounted] = useState(false);

  useEffect(() => {
    if (!showMenu && portalMounted) {
      setTimeout(() => {
        setPortalMounted(false);
      }, 300);
    }
  }, [showMenu]);

  const queryClient = useQueryClient();

  const isRootTerritory = territoryActant.id === rootTerritoryId;

  return (
    <>
      <StyledWrapper
        ref={refs.setReference}
        onMouseEnter={() => {
          onMenuOpen();
          setShowMenu(true);
          setPortalMounted(true);
        }}
        onMouseLeave={() => {
          onMenuClose();
          setShowMenu(false);
        }}
      >
        <StyledCgMenuBoxed size={18} />

        {portalMounted && (
          <FloatingPortal id="page-content">
            <div
              ref={refs.setFloating}
              style={{
                ...floatingStyles,
                zIndex: 100,
              }}
            >
              <StyledContextButtonGroup style={animatedMount}>
                {right !== UserEnums.RoleMode.Read && (
                  <Button
                    key="add"
                    tooltipLabel="add child territory"
                    tooltipPosition="top"
                    icon={<IcoPlusBold size={14} />}
                    color="info"
                    shape="sharp-square"
                    size={ButtonSize.Medium}
                    onClick={() => {
                      // add child
                      setShowCreate(true);
                      setShowMenu(false);
                      onMenuClose();
                    }}
                  />
                )}
                {!isRootTerritory && (
                  <Button
                    key="favorites"
                    tooltipLabel={isFavorited ? "remove from favorites" : "add to favorites"}
                    tooltipPosition="top"
                    icon={<FaStar size={14} />}
                    color={isFavorited ? "grey" : "warning"}
                    shape="sharp-square"
                    size={ButtonSize.Medium}
                    onClick={() => {
                      if (isFavorited) {
                        // remove from favorites
                        const newStored = storedTerritories
                          .filter((id) => id !== territoryActant.id)
                          .map((storedTerritory) => ({
                            territoryId: storedTerritory,
                          }));
                        updateUserMutation.mutate({
                          storedTerritories: newStored,
                        });
                      } else {
                        // add to favorites
                        const newStored = [
                          ...storedTerritories.map((storedTerritory) => ({
                            territoryId: storedTerritory,
                          })),
                          { territoryId: territoryActant.id },
                        ];
                        updateUserMutation.mutate({
                          storedTerritories: newStored,
                        });
                      }

                      setShowMenu(false);
                      onMenuClose();
                    }}
                  />
                )}
                {canReorder && right !== UserEnums.RoleMode.Read && (
                  <Button
                    key="reorder"
                    tooltipLabel="reorder children"
                    tooltipPosition="top"
                    icon={<TbArrowsSort size={14} />}
                    color="success"
                    shape="sharp-square"
                    size={ButtonSize.Medium}
                    onClick={() => {
                      setShowReorder(true);
                      setShowMenu(false);
                      onMenuClose();
                    }}
                  />
                )}
                {((right === UserEnums.RoleMode.Admin && empty) ||
                  (right === UserEnums.RoleMode.Write && empty)) && (
                  <Button
                    key="delete"
                    tooltipLabel="delete territory"
                    tooltipPosition="top"
                    icon={<IcoTrash size={14} />}
                    color="danger"
                    shape="sharp-square"
                    size={ButtonSize.Medium}
                    onClick={() => {
                      setShowSubmit(true);
                      setShowMenu(false);
                      onMenuClose();
                    }}
                  />
                )}
              </StyledContextButtonGroup>
            </div>
          </FloatingPortal>
        )}
      </StyledWrapper>

      {showSubmit && (
        <ContextMenuSubmitDelete
          onClose={() => setShowSubmit(false)}
          territoryActant={territoryActant}
        />
      )}
      {showCreate && (
        <EntityCreateModal
          closeModal={() => setShowCreate(false)}
          allowedEntityClasses={[EntityEnums.Class.Territory]}
          onMutationSuccess={() => queryClient.invalidateQueries({ queryKey: ["tree"] })}
          parentTerritory={territoryActant}
        />
      )}
      {showReorder && childTerritories && (
        <ReorderTerritoryChildrenModal
          parentId={territoryActant.id}
          children={childTerritories}
          onClose={() => setShowReorder(false)}
        />
      )}
    </>
  );
};
