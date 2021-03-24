import { ButtonGroup, Button } from "components";
import React, { useState } from "react";
import { FaTrashAlt, FaStar, FaPlus } from "react-icons/fa";

import {
  StyledContextButtonGroup,
  StyledFaChevronCircleDown,
  StyledWrapper,
} from "./ContextMenuStyles";

interface ContextMenu {}
export const ContextMenu: React.FC<ContextMenu> = () => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <StyledWrapper
      onMouseOver={() => setShowMenu(true)}
      onMouseOut={() => setShowMenu(false)}
    >
      <StyledFaChevronCircleDown />
      {showMenu && (
        <StyledContextButtonGroup>
          <Button
            key="add"
            icon={<FaPlus size={14} />}
            color="info"
            onClick={() => {
              // add child
            }}
          />
          <Button
            key="favorites"
            icon={<FaStar size={14} />}
            color="warning"
            onClick={() => {
              // add to favorites
            }}
          />
          <Button
            key="delete"
            icon={<FaTrashAlt size={14} />}
            color="danger"
            onClick={() => {
              // delete
            }}
          />
        </StyledContextButtonGroup>
      )}
    </StyledWrapper>
  );
};
