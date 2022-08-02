import { UserRoleMode } from "@shared/enums";
import { IEntity } from "@shared/types";
import { Button } from "components";
import React, { useRef, useState } from "react";
import { FaPlus, FaStar, FaTrashAlt } from "react-icons/fa";
import { UseMutationResult } from "react-query";
import { useSpring } from "react-spring";
import { config } from "react-spring/renderprops";
import { ContextMenuNewTerritoryModal } from "../ContextMenuNewTerritoryModal/ContextMenuNewTerritoryModal";
import { ContextMenuSubmitDelete } from "../ContextMenuSubmitDelete/ContextMenuSubmitDelete";
import {
  StyledCgMenuBoxed,
  StyledContextButtonGroup,
  StyledWrapper,
} from "./TerritoryTreeContextMenuStyles";

interface TerritoryTreeContextMenu {
  territoryActant: IEntity;
  right: UserRoleMode;
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
  const ref = useRef<HTMLDivElement>(null);

  const [showMenu, setShowMenu] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [currentPosition, setCurrentPosition] = useState({
    x: 0,
    y: 0,
    height: 0,
  });

  const setDivPosition = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setCurrentPosition({
        x: rect["x"],
        y: rect["y"],
        height: rect["height"],
      });
    }
  };

  const animatedMount = useSpring({
    opacity: showMenu ? 1 : 0,
    config: config.stiff,
  });

  return (
    <>
      <StyledWrapper
        ref={ref}
        onMouseEnter={() => {
          if (!showMenu) {
            setDivPosition();
          }
          onMenuOpen();
          setShowMenu(true);
        }}
        onMouseLeave={() => {
          onMenuClose();
          setShowMenu(false);
        }}
      >
        <StyledCgMenuBoxed size={18} />
        {showMenu && (
          <StyledContextButtonGroup
            $clientX={currentPosition.x}
            $clientY={currentPosition.y}
            height={currentPosition.height}
            style={animatedMount}
          >
            {right !== UserRoleMode.Read && (
              <Button
                key="add"
                tooltip="add child territory"
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
              tooltip={
                isFavorited ? "remove from favorites" : "add to favorites"
              }
              icon={<FaStar size={14} />}
              color={isFavorited ? "grey" : "warning"}
              onClick={() => {
                if (isFavorited) {
                  // remove from favorites
                  const index = storedTerritories.indexOf(territoryActant.id);
                  if (index > -1) {
                    storedTerritories.splice(index, 1).slice;
                  }
                  const newStored = [
                    ...storedTerritories.map((storedTerritory) => ({
                      territoryId: storedTerritory,
                    })),
                  ];
                  updateUserMutation.mutate({ storedTerritories: newStored });
                } else {
                  // add to favorites
                  const newStored = [
                    ...storedTerritories.map((storedTerritory) => ({
                      territoryId: storedTerritory,
                    })),
                    { territoryId: territoryActant.id },
                  ];
                  updateUserMutation.mutate({ storedTerritories: newStored });
                }
                setShowMenu(false);
                onMenuClose();
              }}
            />
            {((right === UserRoleMode.Admin && empty) ||
              (right === UserRoleMode.Write && empty)) && (
              <Button
                key="delete"
                tooltip="delete territory"
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
