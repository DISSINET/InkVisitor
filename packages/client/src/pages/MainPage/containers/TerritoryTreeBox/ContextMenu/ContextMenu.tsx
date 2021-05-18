import React, { useRef, useState } from "react";
import { FaTrashAlt, FaStar, FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import { CSSTransition } from "react-transition-group";

import { Button } from "components";
import {
  StyledContextButtonGroup,
  StyledFaChevronCircleDown,
  StyledWrapper,
} from "./ContextMenuStyles";
import { IActant } from "@shared/types";
import { ContextMenuNewTerritoryModal } from "../ContextMenuNewTerritoryModal/ContextMenuNewTerritoryModal";
import { ContextMenuSubmitDelete } from "../ContextMenuSubmitDelete/ContextMenuSubmitDelete";

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

        <CSSTransition
          in={showMenu}
          timeout={300}
          classNames="fade"
          unmountOnExit
        >
          {() => (
            <StyledContextButtonGroup
              showMenu={showMenu}
              clientX={currentPosition.x}
              clientY={currentPosition.y}
              height={currentPosition.height}
            >
              <Button
                key="add"
                icon={<FaPlus size={14} />}
                color="info"
                onClick={() => {
                  // add child
                  setShowCreate(true);
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
                }}
              />
            </StyledContextButtonGroup>
          )}
        </CSSTransition>
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
