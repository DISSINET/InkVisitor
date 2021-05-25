import React, { useRef, useState } from "react";
import { FaTrashAlt, FaStar, FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";

import { Button } from "components";
import {
  StyledContextButtonGroup,
  StyledFaChevronCircleDown,
  StyledWrapper,
} from "./ContextMenuStyles";
import { IActant } from "@shared/types";
import { ContextMenuNewTerritoryModal } from "../ContextMenuNewTerritoryModal/ContextMenuNewTerritoryModal";
import { ContextMenuSubmitDelete } from "../ContextMenuSubmitDelete/ContextMenuSubmitDelete";
import { useSpring } from "react-spring";
import { config, Transition } from "react-spring/renderprops";

interface ContextMenu {
  territoryActant: IActant;
}
export const ContextMenu: React.FC<ContextMenu> = ({ territoryActant }) => {
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
          setShowMenu(true);
        }}
        onMouseLeave={() => setShowMenu(false)}
      >
        <StyledFaChevronCircleDown size={14} />
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
                clientx={currentPosition.x}
                clienty={currentPosition.y}
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
