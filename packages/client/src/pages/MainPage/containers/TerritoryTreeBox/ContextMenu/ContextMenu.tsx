import { IActant } from "@shared/types";
import { Button } from "components";
import React, { useRef, useState } from "react";
import { FaPlus, FaStar, FaTrashAlt } from "react-icons/fa";
import { config, Transition } from "react-spring/renderprops";
import { toast } from "react-toastify";
import { ContextMenuNewTerritoryModal } from "../ContextMenuNewTerritoryModal/ContextMenuNewTerritoryModal";
import { ContextMenuSubmitDelete } from "../ContextMenuSubmitDelete/ContextMenuSubmitDelete";
import {
  StyledContextButtonGroup,
  StyledTiDocumentText,
  StyledWrapper,
} from "./ContextMenuStyles";

interface ContextMenu {
  territoryActant: IActant;
  onMenuOpen: () => void;
  onMenuClose: () => void;
}
export const ContextMenu: React.FC<ContextMenu> = ({
  territoryActant,
  onMenuOpen,
  onMenuClose,
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
        <StyledTiDocumentText />
        <Transition
          items={showMenu}
          from={{ opacity: 0 }}
          enter={{ opacity: 1 }}
          leave={{ opacity: 0 }}
          config={config.stiff}
        >
          {(showMenu) =>
            showMenu &&
            ((styles) => (
              <StyledContextButtonGroup
                $clientX={currentPosition.x}
                $clientY={currentPosition.y}
                height={currentPosition.height}
                style={styles}
              >
                <Button
                  key="add"
                  icon={<FaPlus size={14} />}
                  color="info"
                  onClick={() => {
                    // add child
                    setShowCreate(true);
                    setShowMenu(false);
                    onMenuClose();
                  }}
                />
                <Button
                  key="favorites"
                  icon={<FaStar size={14} />}
                  color="warning"
                  onClick={() => {
                    // add to favorites
                    toast.success(
                      `You're adding territory [${territoryActant.label}] to favorites. (not implemented yet)`
                    );
                  }}
                />
                <Button
                  key="delete"
                  icon={<FaTrashAlt size={14} />}
                  color="danger"
                  onClick={() => {
                    setShowSubmit(true);
                    setShowMenu(false);
                    onMenuClose();
                  }}
                />
              </StyledContextButtonGroup>
            ))
          }
        </Transition>
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
