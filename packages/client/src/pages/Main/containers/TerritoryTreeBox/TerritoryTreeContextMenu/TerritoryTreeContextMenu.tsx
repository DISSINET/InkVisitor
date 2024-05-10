import { FloatingPortal, autoUpdate, useFloating } from "@floating-ui/react";
import { config, useSpring } from "@react-spring/web";
import { UserEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import { UseMutationResult } from "@tanstack/react-query";
import { Button } from "components";
import React, { useEffect, useState } from "react";
import { FaPlus, FaStar, FaTrashAlt } from "react-icons/fa";
import { ContextMenuNewTerritoryModal } from "../ContextMenuNewTerritoryModal/ContextMenuNewTerritoryModal";
import { ContextMenuSubmitDelete } from "../ContextMenuSubmitDelete/ContextMenuSubmitDelete";
import {
  StyledCgMenuBoxed,
  StyledContextButtonGroup,
  StyledWrapper,
} from "./TerritoryTreeContextMenuStyles";

interface TerritoryTreeContextMenu {
  territoryActant: IEntity;
  right: UserEnums.RoleMode;
  empty: boolean;
  onMenuOpen: () => void;
  onMenuClose: () => void;
  storedTerritories: string[];
  updateUserMutation: UseMutationResult<void, unknown, object, unknown>;
  isFavorited?: boolean;
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
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);

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
          <FloatingPortal id="page">
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
                    icon={<FaPlus size={14} />}
                    color="info"
                    onClick={() => {
                      // add child
                      setShowCreate(true);
                      setShowMenu(false);
                      onMenuClose();
                    }}
                  />
                )}
                <Button
                  key="favorites"
                  tooltipLabel={
                    isFavorited ? "remove from favorites" : "add to favorites"
                  }
                  icon={<FaStar size={14} />}
                  color={isFavorited ? "grey" : "warning"}
                  onClick={() => {
                    if (isFavorited) {
                      // remove from favorites
                      const index = storedTerritories.indexOf(
                        territoryActant.id
                      );
                      if (index > -1) {
                        storedTerritories.splice(index, 1).slice;
                      }
                      const newStored = [
                        ...storedTerritories.map((storedTerritory) => ({
                          territoryId: storedTerritory,
                        })),
                      ];
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
                {((right === UserEnums.RoleMode.Admin && empty) ||
                  (right === UserEnums.RoleMode.Write && empty)) && (
                  <Button
                    key="delete"
                    tooltipLabel="delete territory"
                    icon={<FaTrashAlt size={14} />}
                    color="danger"
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
        <ContextMenuNewTerritoryModal
          onClose={() => setShowCreate(false)}
          territoryActantId={territoryActant.id}
        />
      )}
    </>
  );
};
